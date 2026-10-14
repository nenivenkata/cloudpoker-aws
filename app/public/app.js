const $=id=>document.getElementById(id);
let state, selected=new Set(), busy=false;
const suits={S:'♠',H:'♥',D:'♦',C:'♣'};
const ranks={11:'J',12:'Q',13:'K',14:'A'};
async function api(path,data={}) {
  const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json',...(state?{'X-CSRF-Token':state.csrf}:{})},body:JSON.stringify(data)});
  const value=await r.json(); if(!r.ok) throw new Error(value.error); return value;
}
function cards(target,hand,clickable=false) {
  $(target).replaceChildren();
  for(let i=0;i<5;i++) {
    const c=hand[i], el=document.createElement(clickable?'button':'div');
    el.className=`card ${c&&['H','D'].includes(c.suit)?'red':''} ${c?'':'back'} ${selected.has(i)&&clickable?'selected':''}`;
    el.textContent=c?`${ranks[c.rank]||c.rank}${suits[c.suit]}`:'♠';
    if(clickable) { el.disabled=busy; el.setAttribute('aria-label',`${el.textContent}, select to replace`); el.setAttribute('aria-pressed',String(selected.has(i))); el.onclick=()=>{selected.has(i)?selected.delete(i):selected.add(i);render();}; }
    $(target).append(el);
  }
}
function render() {
  cards('dealer',state.dealer); cards('hand',state.hand,state.phase==='draw');
  $('round').textContent=`Round ${state.round}`; $('rank').textContent=state.playerRank;
  $('dealerRank').textContent=state.result?.dealerRank || 'Hidden until showdown';
  $('message').textContent=state.result?state.result.outcome:`${selected.size} card(s) selected for replacement`;
  $('draw').hidden=state.phase!=='draw'; $('draw').disabled=busy;
  $('next').hidden=state.phase!=='finished'; $('next').disabled=busy;
}
async function action(path,data) {
  busy=true; if(state) render();
  try {state=await api(path,data); selected.clear();}
  catch(e){$('message').textContent=e.message; busy=false; $('draw').disabled=false; $('next').disabled=false;return;}
  busy=false;render();
}
$('draw').onclick=()=>action('/api/draw',{discard:[...selected]});
$('next').onclick=()=>action('/api/new');
action('/api/session');
