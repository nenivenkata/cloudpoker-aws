import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { deck, evaluate, compare } from './poker.js';
import { fileURLToPath } from 'node:url';

const sessions=new Map();
const ttl=30*60*1000, maxSessions=2000;
let requests=0, rounds=0, errors=0;
const started=Date.now();
const publicDir=fileURLToPath(new URL('./public/',import.meta.url));
const staticFiles={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css']};
// Optional Vault Agent integration: read a mounted file, never log its value.
let labSecretLoaded=false;
if (process.env.LAB_SECRET_FILE) {
  const secret=(await readFile(process.env.LAB_SECRET_FILE,'utf8')).trim();
  if (!secret) throw new Error('Configured lab secret is empty');
  labSecretLoaded=true;
}
function send(res,status,value) {
  res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});
  res.end(JSON.stringify(value));
}
function view(session) {
  return {hand:session.hand,phase:session.phase,round:session.round,
    result:session.result || null, csrf:session.csrf,
    dealer:session.phase==='finished'?session.dealer:[],
    playerRank:evaluate(session.hand).label};
}
function newRound(s) {
  s.deck=deck(); s.hand=s.deck.splice(0,5); s.dealer=s.deck.splice(0,5);
  s.phase='draw'; s.round++; s.result=null;
}
async function body(req) {
  let text='';
  for await (const chunk of req) {
    text+=chunk;
    if (Buffer.byteLength(text)>2048) throw Object.assign(new Error('Body too large'),{status:413});
  }
  try { return JSON.parse(text || '{}'); }
  catch { throw Object.assign(new Error('Invalid JSON'),{status:400}); }
}
function sessionFor(req) {
  const id=(req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith('lab_session='))?.slice(12);
  const s=sessions.get(id);
  if (!s || Date.now()-s.touched>ttl) { if (id) sessions.delete(id); return null; }
  s.touched=Date.now();
  return s;
}
const server=http.createServer(async(req,res)=>{
  const begin=Date.now(), requestId=randomUUID();
  requests++;
  res.setHeader('X-Request-ID',requestId);
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  const path=new URL(req.url,'http://localhost').pathname;
  res.on('finish',()=>{
    if(res.statusCode>=400) errors++;
    // Never log cookies, headers, cards, payloads, credentials, or query strings.
    console.log(JSON.stringify({time:new Date().toISOString(),level:'info',requestId,method:req.method,
      route:Object.hasOwn(staticFiles,path)||['/healthz','/readyz','/metrics','/api/session','/api/draw','/api/new'].includes(path)?path:'unknown',
      status:res.statusCode,durationMs:Date.now()-begin}));
  });
  try {
    if(req.method==='GET' && ['/healthz','/readyz'].includes(path)) return send(res,200,{status:'ok',labSecretLoaded});
    if(req.method==='GET' && path==='/metrics') {
      res.writeHead(200,{'Content-Type':'text/plain; version=0.0.4'});
      return res.end(`# TYPE cloudpoker_requests_total counter\ncloudpoker_requests_total ${requests}\n# TYPE cloudpoker_rounds_total counter\ncloudpoker_rounds_total ${rounds}\n# TYPE cloudpoker_errors_total counter\ncloudpoker_errors_total ${errors}\n# TYPE cloudpoker_uptime_seconds gauge\ncloudpoker_uptime_seconds ${(Date.now()-started)/1000}\n`);
    }
    if(req.method==='GET' && Object.hasOwn(staticFiles,path)) {
      const [name,type]=staticFiles[path];
      const data=await readFile(`${publicDir}/${name}`);
      res.writeHead(200,{'Content-Type':type}); return res.end(data);
    }
    if(req.method==='POST') {
      // Browser requests must originate from the same origin, including port.
      if(req.headers.origin && req.headers.origin!==`${process.env.COOKIE_SECURE==='true'?'https':'http'}://${req.headers.host}`)
        return send(res,403,{error:'Origin rejected'});
      if(!req.headers['content-type']?.startsWith('application/json')) return send(res,415,{error:'Use application/json'});
      const data=await body(req);
      let s=sessionFor(req);
      if(path==='/api/session') {
        if(!s) {
          if(sessions.size>=maxSessions) return send(res,503,{error:'Lab session capacity reached'});
          const id=randomBytes(32).toString('hex');
          s={round:0,csrf:randomBytes(24).toString('hex'),touched:Date.now()};
          newRound(s); sessions.set(id,s);
          res.setHeader('Set-Cookie',`lab_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=1800${process.env.COOKIE_SECURE==='true'?'; Secure':''}`);
        }
        return send(res,200,view(s));
      }
      if(!s) return send(res,401,{error:'Session expired. Reload the page.'});
      const supplied=Buffer.from(req.headers['x-csrf-token'] || '');
      const expected=Buffer.from(s.csrf);
      if(supplied.length!==expected.length || !timingSafeEqual(supplied,expected)) return send(res,403,{error:'CSRF check failed'});
      if(path==='/api/draw') {
        if(s.phase!=='draw') return send(res,409,{error:'Round already complete'});
        if(!Array.isArray(data.discard) || data.discard.length>5 || new Set(data.discard).size!==data.discard.length || data.discard.some(i=>!Number.isInteger(i)||i<0||i>4))
          return send(res,400,{error:'discard must contain unique card positions 0 through 4'});
        for(const i of data.discard) s.hand[i]=s.deck.pop();
        const outcome=compare(s.hand,s.dealer);
        s.result={outcome:outcome>0?'You win':outcome<0?'Dealer wins':'Tie',dealerRank:evaluate(s.dealer).label};
        s.phase='finished'; rounds++;
        return send(res,200,view(s));
      }
      if(path==='/api/new') {
        if(s.phase!=='finished') return send(res,409,{error:'Finish the current round first'});
        newRound(s); return send(res,200,view(s));
      }
    }
    send(res,404,{error:'Not found'});
  } catch(e) {
    send(res,e.status || 500,{error:e.status?e.message:'Internal server error'});
  }
});
server.requestTimeout=10000; server.headersTimeout=10000;
const cleanup=setInterval(()=>{for(const [id,s] of sessions) if(Date.now()-s.touched>ttl) sessions.delete(id);},60000);
cleanup.unref();
server.listen(Number(process.env.PORT || 3000),'0.0.0.0',()=>console.log(JSON.stringify({level:'info',event:'started',port:Number(process.env.PORT || 3000)})));
process.on('SIGTERM',()=>{server.close(()=>process.exit(0)); setTimeout(()=>process.exit(1),10000).unref();});
