import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

test('API session isolation, CSRF, validation, showdown and replay protection',async()=>{
  const port=33000+Math.floor(Math.random()*1000);
  const child=spawn(process.execPath,['app/server.js'],{env:{...process.env,PORT:String(port)},stdio:'ignore'});
  const base=`http://127.0.0.1:${port}`;
  const post=(path,data={},headers={})=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
  try {
    let ready=false;
    for(let i=0;i<60;i++) {try {ready=(await fetch(base+'/healthz')).ok;if(ready)break;}catch{} await delay(50);}
    assert.equal(ready,true,'server starts');
    const res=await post('/api/session'); const state=await res.json();
    const cookie=res.headers.get('set-cookie').split(';')[0];
    assert.equal(state.hand.length,5);assert.equal(state.dealer.length,0);assert.equal(state.phase,'draw');
    assert.match(res.headers.get('set-cookie'),/HttpOnly/);
    const auth={Cookie:cookie,'X-CSRF-Token':state.csrf};
    assert.equal((await post('/api/draw',{discard:[]})).status,401);
    assert.equal((await post('/api/draw',{discard:[]},{Cookie:cookie})).status,403);
    assert.equal((await post('/api/draw',{discard:[]},{...auth,Origin:'https://evil.test'})).status,403);
    assert.equal((await post('/api/draw',{discard:[0,0]},auth)).status,400);
    assert.equal((await post('/api/draw',{discard:[5]},auth)).status,400);
    assert.equal((await post('/api/new',{},auth)).status,409);
    const another=await post('/api/session');const other=await another.json();
    assert.notEqual(other.csrf,state.csrf);
    const draw=await post('/api/draw',{discard:[0,2]},auth);assert.equal(draw.status,200);
    const finished=await draw.json();
    assert.equal(finished.phase,'finished');assert.equal(finished.dealer.length,5);
    assert.deepEqual(finished.hand[1],state.hand[1]);assert.deepEqual(finished.hand[3],state.hand[3]);
    assert.equal(new Set([...finished.hand,...finished.dealer].map(c=>`${c.rank}${c.suit}`)).size,10);
    assert.equal((await post('/api/draw',{discard:[]},auth)).status,409);
    const next=await (await post('/api/new',{},auth)).json();assert.equal(next.round,2);assert.equal(next.dealer.length,0);
    const metrics=await (await fetch(base+'/metrics')).text();assert.match(metrics,/cloudpoker_rounds_total 1/);
    const huge=await post('/api/draw',{x:'x'.repeat(3000)},auth);assert.equal(huge.status,413);
    const bad=await fetch(base+'/api/draw',{method:'POST',headers:{'Content-Type':'application/json',...auth},body:'{'});assert.equal(bad.status,400);
    assert.equal((await fetch(base+'/missing')).status,404);
    assert.match((await (await fetch(base)).text()),/CloudPoker/);
  } finally { child.kill('SIGTERM'); }
});
