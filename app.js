(function(){
const ASSETS=window.PULSE_DATA||[];
const CLUSTERS=window.PULSE_CLUSTERS||[];
const state={filter:"ALL",tab:"heat"};
const $=id=>document.getElementById(id);
function heatLabel(h){
  if(h>=80) return {name:"HOT",color:"#ff4d2e",text:"#1a0604"};
  if(h>=65) return {name:"WARM",color:"#ff8a3d",text:"#1a0c04"};
  if(h>=45) return {name:"FLAT",color:"#c8c2a8",text:"#1a180e"};
  if(h>=30) return {name:"COLD",color:"#4aa3ff",text:"#041018"};
  return {name:"ICE",color:"#9fd8ff",text:"#041018"};
}
function signal(a){
  const above20=a.p>=a.s20, up=a.s20>=a.s50;
  if(window.PULSE_REGIME==="BEAR"||window.PULSE_REGIME==="HIGH_VOL") return {k:"SIT CASH",c:"var(--avoid)",why:"Regime filter is on. No new buys."};
  if(a.flow==="SELL") return {k:"AVOID",c:"var(--avoid)",why:"Sell-off. Watch "+a.watch+" days. Do not buy the dump."};
  if(a.flow==="WATCH" && a.heat<70) return {k:"WATCH",c:"var(--watch)",why:"Mixed filings. Clock: "+a.watch+" days."};
  if(a.flow==="BUY" && a.heat>=72 && above20 && up) return {k:"BUY",c:"var(--buy)",why:"Buy-flow + heat + uptrend."};
  if(a.heat>=72 && above20 && up) return {k:"LEAN BUY",c:"var(--buy)",why:"Hot heat, flow is not a cluster. Smaller size."};
  if(a.heat<38 || (!above20 && !up)) return {k:"AVOID",c:"var(--avoid)",why:"Weak trend."};
  return {k:"WATCH",c:"var(--watch)",why:"Mixed tape."};
}
function fmt(n){
  if(n==null||Number.isNaN(n)) return "-";
  if(n>=1000) return n.toLocaleString(undefined,{maximumFractionDigits:0});
  if(n>=1) return n.toFixed(2);
  return n.toFixed(4);
}
function matrix(a){
  const m=a.mx||{sec:"N",news:"N",tech:"N",macro:"N"};
  return '<div class="mx"><span class="dotx '+(m.sec==="Y"?"y":"n")+'">SEC '+m.sec+'</span><span class="dotx '+(m.news==="Y"?"y":"n")+'">NEWS '+m.news+'</span><span class="dotx '+(m.tech==="Y"?"y":"n")+'">TECH '+m.tech+'</span><span class="dotx '+(m.macro==="Y"?"y":"n")+'">MACRO '+m.macro+'</span></div>';
}
function card(a){
  const h=heatLabel(a.heat), sig=signal(a), up=a.d>=0;
  return '<button class="card" data-s="'+a.s+'" style="--accent:'+h.color+'"><div class="heatpill" style="background:'+h.color+';color:'+h.text+'">'+h.name+'<div style="font-size:9px;margin-top:2px">C '+(a.conf||0)+'</div></div><div class="meta"><div class="sym">'+a.s+'</div><div class="nm">'+a.t+' · '+a.n+'</div><div class="why">'+sig.why+'</div>'+matrix(a)+'</div><div class="right"><div class="px">'+fmt(a.p)+'</div><div class="chg '+(up?"up":"dn")+'">'+(up?"+":"")+a.d.toFixed(2)+'%</div><div class="signal" style="color:'+sig.c+'">'+sig.k+'</div></div></button>';
}
function bind(){ document.querySelectorAll("[data-s]").forEach(el=>el.onclick=()=>openSheet(el.dataset.s)); }
function filtered(){ return ASSETS.filter(a=>state.filter==="ALL"||a.t===state.filter); }
function renderHeat(){ $("list").innerHTML=filtered().slice().sort((x,y)=>(y.conf||0)-(x.conf||0)).map(card).join(""); bind(); }
function renderScan(){
  const ranked=filtered().slice().sort((a,b)=>(b.conf||0)-(a.conf||0));
  const buys=ranked.filter(a=>["BUY","LEAN BUY"].includes(signal(a).k));
  const avoids=ranked.filter(a=>["AVOID","SIT CASH"].includes(signal(a).k));
  $("list").innerHTML='<div class="osint"><div class="block"><h4>BUY BOOK</h4><p>Buy-flow or hot heat, no sell-off clock, bull regime.</p></div>'+buys.map(card).join("")+'<div class="block" style="margin-top:14px"><h4>DO NOT BUY</h4><p>Sell-offs and broken trends. The clock is the point.</p></div>'+avoids.map(card).join("")+'</div>'; bind();
}
function renderFib(){
  $("list").innerHTML='<div class="osint"><div class="block"><h4>FIBONACCI MAP</h4><p>60-day high = 0. Buy-flow still needs a level.</p></div></div>'+filtered().map(a=>{
    const near=Object.entries(a.fib).map(([k,v])=>({k,v,dist:Math.abs(a.p-v)/a.p})).sort((x,y)=>x.dist-y.dist)[0];
    const h=heatLabel(a.heat);
    return '<button class="card" data-s="'+a.s+'" style="--accent:'+h.color+'"><div class="heatpill" style="background:'+h.color+';color:'+h.text+'">'+a.s+'</div><div class="meta"><div class="sym">Near Fib '+near.k+'</div><div class="nm">'+fmt(near.v)+' · now '+fmt(a.p)+'</div></div><div class="right"><div class="px">'+fmt(a.p)+'</div></div></button>';
  }).join(""); bind();
}
function flowCard(a){
  const col=a.flow==="BUY"?"#3dffb0":a.flow==="SELL"?"#ff5a6a":"#ffd56a";
  const clock=(a.flow==="SELL"||a.flow==="WATCH")?'<div class="clock">'+a.watch+'d left</div>':'<div class="chg up">OPEN</div>';
  return '<button class="card" data-s="'+a.s+'" style="--accent:'+col+'"><div class="heatpill" style="background:'+col+';color:#0a0a0c">'+(a.flow||"NONE")+'</div><div class="meta"><div class="sym">'+a.s+'</div><div class="nm">Buys '+(a.buys||0)+' · Sells '+(a.sells||0)+' · 8-K '+(a.eightk||0)+'</div><div class="why">'+(a.note||"")+'</div></div><div class="right"><div class="px">'+fmt(a.p)+'</div>'+clock+'<div class="signal">C '+(a.conf||0)+'</div></div></button>';
}
function renderFlow(){
  const list=filtered();
  const buys=list.filter(a=>a.flow==="BUY").sort((a,b)=>(b.conf||0)-(a.conf||0));
  const sells=list.filter(a=>a.flow==="SELL");
  const watch=list.filter(a=>a.flow==="WATCH");
  $("list").innerHTML='<div class="osint"><div class="block"><h4>THE RULE</h4><p>Lots of insider buys + new 8-Ks = buy bucket.<br>Lots of sells = sell-off. 21-day clock. Do not buy yet.<br>Clock hits 0, look again. Only buy if heat turned up.</p></div><div class="block"><h4>BUY FLOW</h4><p>People are buying. These are the only names you size.</p></div>'+buys.map(flowCard).join("")+'<div class="block" style="margin-top:12px"><h4>SELL-OFF — DO NOT BUY</h4><p>Net selling. Clock is how long you wait.</p></div>'+sells.map(flowCard).join("")+'<div class="block" style="margin-top:12px"><h4>WATCH CLOCK</h4><p>Selling cooling or filings noisy. Wait the days.</p></div>'+watch.map(flowCard).join("")+'<div class="block" style="margin-top:12px"><h4>OUTSIDE CLUSTERS</h4><p>Shown here so you do not leave the app.</p></div>'+CLUSTERS.map(c=>'<div class="block"><h4>'+c.s+' · '+c.n+'</h4><p><span class="tag up">BUY</span> '+c.ins+' insiders · '+c.v+' · '+c.age+'d ago. '+c.note+'</p></div>').join("")+'<p class="note">90-day Form 4 / 8-K snapshot. Mega-cap 10b5-1 sells are not a panic dump — that is why the clock exists. Paper only. Not advice.</p></div>';
  bind();
}
function factors(a){
  const list=[], above20=a.p>=a.s20, up=a.s20>=a.s50;
  if(a.flow==="BUY") list.push({dir:"up",t:"Buy-flow is on."});
  if(a.flow==="SELL") list.push({dir:"dn",t:"Sell-off. "+(a.sells||0)+" sells vs "+(a.buys||0)+" buys. Clock "+a.watch+"d."});
  if(a.flow==="WATCH") list.push({dir:"ck",t:"Mixed flow. Watch "+a.watch+" more days."});
  list.push(up?{dir:"up",t:"20-day above 50-day."}:{dir:"dn",t:"20-day below 50-day."});
  list.push(above20?{dir:"up",t:"Holds the 20-day."}:{dir:"dn",t:"Under the 20-day."});
  if((a.eightk||0)>=3) list.push({dir:"up",t:a.eightk+" recent 8-Ks."});
  if((a.hype||0)>=2) list.push({dir:"ck",t:"Retail hype is loud. That is not an insider buy."});
  return list;
}
function openSheet(sym){
  const a=ASSETS.find(x=>x.s===sym); if(!a) return;
  const sig=signal(a), fac=factors(a), hi=a.hi, lo=a.lo, span=hi-lo||1;
  const fibHTML=Object.entries(a.fib).map(([k,v])=>'<div class="fib-line" style="top:'+(((hi-v)/span)*100)+'%"><b>'+k+'</b><span>'+fmt(v)+'</span></div>').join("");
  const py=Math.max(4,Math.min(96,((hi-a.p)/span)*100));
  const tag=a.flow==="BUY"?"up":a.flow==="SELL"?"dn":"ck";
  $("sheet").classList.add("show");
  $("panel").innerHTML='<div class="handle"></div><div class="d-top"><div><div class="d-sym">'+a.s+'</div><div class="d-nm">'+a.t+' · '+a.n+'</div></div><button class="close" id="closeSheet">CLOSE</button></div><div class="bigpx">'+fmt(a.p)+'</div><div class="chg '+(a.d>=0?"up":"dn")+'">'+(a.d>=0?"+":"")+a.d.toFixed(2)+'% · heat '+a.heat+' · conf '+(a.conf||0)+'</div><div class="row"><div class="kpi"><div class="l">Flow</div><div class="v">'+(a.flow||"NONE")+'</div></div><div class="kpi"><div class="l">Buys / sells</div><div class="v">'+(a.buys||0)+' / '+(a.sells||0)+'</div></div><div class="kpi"><div class="l">Watch</div><div class="v">'+(a.watch||0)+'d</div></div></div><div class="row"><div class="kpi"><div class="l">8-K</div><div class="v">'+(a.eightk||0)+'</div></div><div class="kpi"><div class="l">Form 4</div><div class="v">'+(a.form4||0)+'</div></div><div class="kpi"><div class="l">20 / 50</div><div class="v">'+fmt(a.s20)+' / '+fmt(a.s50)+'</div></div></div><div class="verdict" style="border-color:'+sig.c+'44"><div class="g">SIMPLE CALL</div><div class="s" style="color:'+sig.c+'">'+sig.k+'</div><p><span class="tag '+tag+'">'+(a.flow||"NONE")+'</span> '+(a.note||sig.why)+'</p></div><div class="section"><h3>Signal matrix</h3>'+matrix(a)+'</div><div class="section"><h3>Fibonacci</h3><div class="fib">'+fibHTML+'<div class="price-mark" style="top:'+py+'%"><em>NOW '+fmt(a.p)+'</em></div></div></div><div class="section"><h3>What moves it</h3><div class="factors">'+fac.map(f=>'<div class="factor"><span class="tag '+f.dir+'">'+(f.dir==="up"?"LIFT":f.dir==="dn"?"DRAG":"WAIT")+'</span><span>'+f.t+'</span></div>').join("")+'</div></div><p class="note">All on this card. Paper only. Not advice.</p>';
  $("closeSheet").onclick=closeSheet;
}
function closeSheet(){ $("sheet").classList.remove("show"); }
function paintRegime(){
  const r=(window.PULSE_REGIME||"BULL").toUpperCase();
  const el=$("regime"); if(!el) return;
  el.className="regime "+(r==="BEAR"?"bear":r.indexOf("VOL")>=0?"vol":"bull");
  el.textContent=r==="BEAR"?"REGIME · BEAR · NO NEW BUYS":r.indexOf("VOL")>=0?"REGIME · HIGH VOL · SIT CASH":"REGIME · BULL · BUYS ALLOWED";
}
function render(){
  document.querySelectorAll(".chip").forEach(c=>c.classList.toggle("on", c.dataset.f===state.filter));
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("on", t.dataset.tab===state.tab));
  paintRegime();
  if(state.tab==="heat") renderHeat();
  if(state.tab==="scan") renderScan();
  if(state.tab==="fib") renderFib();
  if(state.tab==="flow") renderFlow();
}
function scoreAsset(a){
  let score=50;
  if(a.s20&&a.s50){ score+=a.s20>a.s50?12:-12; score+=a.p>a.s20?10:-10; score+=a.p>a.s50?8:-8; }
  score+=Math.max(-15,Math.min(15,(a.d||0)*4));
  a.heat=Math.round(Math.max(0,Math.min(100,score))*10)/10;
}
async function liveRefresh(){
  try{
    const fng=await fetch("https://api.alternative.me/fng/").then(r=>r.json());
    const row=fng&&fng.data&&fng.data[0];
    if(row){ const el=document.querySelector(".fng"); if(el) el.innerHTML="CRYPTO F&G<br><b>"+row.value+" "+String(row.value_classification).toUpperCase()+"</b>"; }
  }catch(e){}
  try{
    const live=await fetch("pulse_data.json?t="+Date.now()).then(r=>r.ok?r.json():null);
    if(live&&live.assets){
      live.assets.forEach(n=>{ const a=ASSETS.find(x=>x.s===n.s); if(!a) return; Object.assign(a,n); });
      if(live.regime) window.PULSE_REGIME=live.regime;
    }
  }catch(e){}
  try{
    const rows=await fetch("https://api.coinlore.net/api/ticker/?id=90,80,48543,58,2").then(r=>r.json());
    (rows||[]).forEach(row=>{
      const a=ASSETS.find(x=>x.s===row.symbol); if(!a) return;
      const px=parseFloat(row.price_usd), chg=parseFloat(row.percent_change_24h);
      if(!Number.isNaN(px)) a.p=px; if(!Number.isNaN(chg)) a.d=Math.round(chg*100)/100; scoreAsset(a);
    });
    const liveEl=document.querySelector(".status .live"); if(liveEl) liveEl.innerHTML='<i class="dot"></i> LIVE';
    render();
  }catch(e){}
}
function init(){
  document.querySelectorAll(".chip").forEach(c=>c.onclick=()=>{state.filter=c.dataset.f;render();});
  document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{state.tab=t.dataset.tab;closeSheet();render();});
  $("sheet").addEventListener("click",e=>{ if(e.target.id==="sheet") closeSheet(); });
  const now=new Date(); $("clock").textContent=(((now.getHours()+11)%12)+1)+":"+String(now.getMinutes()).padStart(2,"0");
  render(); liveRefresh(); setInterval(liveRefresh,60000);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();
