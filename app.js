(function(){
const ASSETS=window.PULSE_DATA||[];
const CIK={NVDA:"0001045810",AAPL:"0000320193",TSLA:"0001318605",AMZN:"0001018723",MSFT:"0000789019",META:"0001326801",GOOGL:"0001652044",AMD:"0000002488",AVGO:"0001730168",PLTR:"0001321655"};
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
  if(a.heat>=72 && above20 && up) return {k:"BUY",c:"var(--buy)",why:"Uptrend + heat. Strength above 20-day."};
  if(a.heat>=60 && above20) return {k:"LEAN BUY",c:"var(--buy)",why:"Above 20-day. Wait for a pullback to hold."};
  if(a.heat<38 || (!above20 && !up)) return {k:"AVOID",c:"var(--avoid)",why:"Weak trend. Do not chase."};
  return {k:"WATCH",c:"var(--watch)",why:"Mixed tape. Need a level to hold."};
}
function fmt(n){
  if(n==null||Number.isNaN(n)) return "—";
  if(n>=1000) return n.toLocaleString(undefined,{maximumFractionDigits:0});
  if(n>=1) return n.toFixed(2);
  return n.toFixed(4);
}
function factors(a){
  const list=[], above20=a.p>=a.s20, up=a.s20>=a.s50, rng=a.hi-a.lo||1, pos=(a.p-a.lo)/rng;
  list.push(up?{dir:"up",t:"20-day is above 50-day. Trend is up."}:{dir:"dn",t:"20-day is below 50-day. Trend is down."});
  list.push(above20?{dir:"up",t:"Price holds above the 20-day average."}:{dir:"dn",t:"Price is under the 20-day average."});
  if(pos>0.8) list.push({dir:"up",t:"Near 60-day high. Momentum is strong, chase risk is higher."});
  else if(pos<0.3) list.push({dir:"dn",t:"Near 60-day low. Weak tape unless a base forms."});
  if(a.fib && a.fib["0.382"]){
    if(a.p>a.fib["0.382"]) list.push({dir:"up",t:"Holding above Fib 0.382. Bulls still in control."});
    else list.push({dir:"dn",t:"Lost Fib 0.382. Next supports are 0.5 then 0.618."});
  }
  if(a.d<=-2) list.push({dir:"dn",t:"Sharp down day. Let it settle before buying."});
  if(a.s==="TLT") list.push({dir:"dn",t:"Long bonds weak. Yields firm. Pressure on long-duration growth."});
  if(["IBIT","BTC"].includes(a.s)) list.push({dir:"up",t:"Spot BTC ETF flow is the cleanest institutional crypto tell."});
  if(["NVDA","AMD","AVGO","SMH"].includes(a.s)) list.push({dir:"up",t:"Semi complex: AI capex is the driver. Weak SMH = do not fight it."});
  return list.slice(0,6);
}
function card(a){
  const h=heatLabel(a.heat), sig=signal(a), up=a.d>=0;
  return `<button class="card" data-s="${a.s}" style="--accent:${h.color}"><div class="heatpill" style="background:${h.color};color:${h.text}">${h.name}</div><div class="meta"><div class="sym">${a.s}</div><div class="nm">${a.t} · ${a.n}</div><div class="why">${sig.why}</div></div><div class="right"><div class="px">${fmt(a.p)}</div><div class="chg ${up?"up":"dn"}">${up?"+":""}${a.d.toFixed(2)}%</div><div class="signal" style="color:${sig.c}">${sig.k}</div></div></button>`;
}
function bind(){ document.querySelectorAll("[data-s]").forEach(el=>el.onclick=()=>openSheet(el.dataset.s)); }
function renderHeat(){
  const list=ASSETS.filter(a=>state.filter==="ALL"||a.t===state.filter).slice().sort((x,y)=>y.heat-x.heat);
  $("list").innerHTML=list.map(card).join("")||'<div class="empty">No names.</div>'; bind();
}
function renderScan(){
  const ranked=ASSETS.slice().sort((a,b)=>b.heat-a.heat);
  const buys=ranked.filter(a=>signal(a).k.includes("BUY"));
  const avoids=ranked.filter(a=>signal(a).k==="AVOID").reverse();
  $("list").innerHTML=`<div class="osint"><div class="block"><h4>BUY BOOK</h4><p>Heat + uptrend + price over 20-day. Do not override it with a story.</p></div>${buys.map(card).join("")}<div class="block" style="margin-top:14px"><h4>DO NOT BUY</h4><p>Broken 20/50 stack or ice-cold heat. Wait.</p></div>${avoids.map(card).join("")}</div>`; bind();
}
function renderFib(){
  const list=ASSETS.filter(a=>state.filter==="ALL"||a.t===state.filter);
  $("list").innerHTML='<div class="osint"><div class="block"><h4>FIBONACCI MAP</h4><p>60-day high = 0. Retrace toward 1. Price above 0.382 = bulls. Lost 0.618 = damage.</p></div></div>'+list.map(a=>{
    const near=Object.entries(a.fib).map(([k,v])=>({k,v,dist:Math.abs(a.p-v)/a.p})).sort((x,y)=>x.dist-y.dist)[0];
    const h=heatLabel(a.heat);
    return `<button class="card" data-s="${a.s}" style="--accent:${h.color}"><div class="heatpill" style="background:${h.color};color:${h.text}">${a.s}</div><div class="meta"><div class="sym">Near Fib ${near.k}</div><div class="nm">Level ${fmt(near.v)} · now ${fmt(a.p)}</div></div><div class="right"><div class="px">${fmt(a.p)}</div></div></button>`;
  }).join(""); bind();
}
function renderOsint(){
  const hot=ASSETS.filter(a=>a.heat>=80).map(a=>a.s).join("  ");
  const ice=ASSETS.filter(a=>a.heat<40).map(a=>a.s).join("  ")||"—";
  const btc=ASSETS.find(a=>a.s==="BTC"), tlt=ASSETS.find(a=>a.s==="TLT"), smh=ASSETS.find(a=>a.s==="SMH"), gld=ASSETS.find(a=>a.s==="GLD");
  $("list").innerHTML=`<div class="osint">
    <div class="block"><h4>MARKET TELL</h4><p>Hot: ${hot}.<br>Cold: ${ice}.</p></div>
    <div class="block"><h4>CRYPTO FEAR & GREED</h4><p>Live index in the header. Greed favors IBIT / ETHA trend. Do not invent a dip.</p></div>
    <div class="block"><h4>RATES — TLT ${fmt(tlt.p)}</h4><p>${tlt.p<tlt.s20?"Bonds are cold. Firm yields. Do not treat every dip in duration names as a gift.":"Bonds stabilizing. Risk assets get a tailwind."}</p></div>
    <div class="block"><h4>AI / SEMIS — SMH ${fmt(smh.p)}</h4><p>${smh.p>=smh.s20?"Complex is hot. NVDA, AMD, AVGO follow this tape.":"Semi leadership cracked. Cut size."}</p></div>
    <div class="block"><h4>GOLD — GLD ${fmt(gld.p)}</h4><p>${gld.p<gld.s20?"Hedge bid fading. Risk-on can persist.":"Gold bid = insurance demand. Size risk assets down."}</p></div>
    <div class="block"><h4>BTC ${fmt(btc.p)}</h4><p>IBIT is the listed proxy. Crypto beta only if BTC holds Fib 0.382.</p></div>
    <div class="block"><h4>SEC / EDGAR</h4><p>Open a name, tap FILINGS. Watch 8-K, 10-Q/10-K, Form 4. No filing is a buy button.</p></div>
    <div class="block"><h4>RULES</h4><p>1. HOT + 20>50 + price>20 = buy bias.<br>2. Lost 20-day and 50-day = do not buy.<br>3. Buy pullbacks to Fib 0.382 / 0.5 in an uptrend.<br>4. Never buy ICE because it looks cheap.</p></div>
    <p class="note">Crypto prints live. Stocks/ETFs are the last public snapshot. Not advice.</p></div>`;
}
function openSheet(sym){
  const a=ASSETS.find(x=>x.s===sym); if(!a) return;
  const sig=signal(a), fac=factors(a), hi=a.hi, lo=a.lo, span=hi-lo||1;
  const fibHTML=Object.entries(a.fib).map(([k,v])=>`<div class="fib-line" style="top:${((hi-v)/span)*100}%"><b>${k}</b><span>${fmt(v)}</span></div>`).join("");
  const py=Math.max(4,Math.min(96,((hi-a.p)/span)*100));
  const cik=CIK[a.s];
  const edgar=cik?`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&owner=include&count=10`:`https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(a.s)}`;
  $("sheet").classList.add("show");
  $("panel").innerHTML=`<div class="handle"></div><div class="d-top"><div><div class="d-sym">${a.s}</div><div class="d-nm">${a.t} · ${a.n}</div></div><button class="close" id="closeSheet">CLOSE</button></div>
    <div class="bigpx">${fmt(a.p)}</div>
    <div class="chg ${a.d>=0?"up":"dn"}">${a.d>=0?"+":""}${a.d.toFixed(2)}% · heat ${a.heat}</div>
    <div class="row"><div class="kpi"><div class="l">20-day</div><div class="v">${fmt(a.s20)}</div></div><div class="kpi"><div class="l">50-day</div><div class="v">${fmt(a.s50)}</div></div><div class="kpi"><div class="l">60d range</div><div class="v">${fmt(a.lo)}–${fmt(a.hi)}</div></div></div>
    <div class="verdict" style="border-color:${sig.c}44"><div class="g">SIMPLE CALL</div><div class="s" style="color:${sig.c}">${sig.k}</div><p>${sig.why}</p></div>
    <div class="section"><h3>Fibonacci — 60 day swing</h3><div class="fib">${fibHTML}<div class="price-mark" style="top:${py}%"><em>NOW ${fmt(a.p)}</em></div></div></div>
    <div class="section"><h3>What moves it</h3><div class="factors">${fac.map(f=>`<div class="factor"><span class="tag ${f.dir}">${f.dir==="up"?"LIFT":"DRAG"}</span><span>${f.t}</span></div>`).join("")}</div></div>
    <div class="btns"><a class="btn" href="${edgar}" target="_blank" rel="noopener">SEC FILINGS</a><a class="btn" href="https://finance.yahoo.com/quote/${encodeURIComponent(a.raw)}" target="_blank" rel="noopener">CHART</a></div>
    <p class="note">Heat is a filter from trend, averages, range, and the day. Not a crystal ball.</p>`;
  $("closeSheet").onclick=closeSheet;
}
function closeSheet(){ $("sheet").classList.remove("show"); }
function render(){
  document.querySelectorAll(".chip").forEach(c=>c.classList.toggle("on", c.dataset.f===state.filter));
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("on", t.dataset.tab===state.tab));
  if(state.tab==="heat") renderHeat();
  if(state.tab==="scan") renderScan();
  if(state.tab==="fib") renderFib();
  if(state.tab==="osint") renderOsint();
}
function scoreAsset(a){
  let score=50;
  if(a.s20&&a.s50){ score+=a.s20>a.s50?12:-12; score+=a.p>a.s20?10:-10; score+=a.p>a.s50?8:-8; }
  score+=Math.max(-15,Math.min(15,(a.d||0)*4));
  if(a.hi&&a.lo&&a.hi!==a.lo) score+=((a.p-a.lo)/(a.hi-a.lo)-0.5)*20;
  a.heat=Math.round(Math.max(0,Math.min(100,score))*10)/10;
}
async function liveRefresh(){
  try{
    const fng=await fetch("https://api.alternative.me/fng/").then(r=>r.json());
    const row=fng&&fng.data&&fng.data[0];
    if(row){ const el=document.querySelector(".fng"); if(el) el.innerHTML="CRYPTO F&G<br><b>"+row.value+" "+String(row.value_classification).toUpperCase()+"</b>"; }
  }catch(e){}
  try{
    const rows=await fetch("https://api.coinlore.net/api/ticker/?id=90,80,48543,58,2").then(r=>r.json());
    (rows||[]).forEach(row=>{
      const a=ASSETS.find(x=>x.s===row.symbol); if(!a) return;
      const px=parseFloat(row.price_usd), chg=parseFloat(row.percent_change_24h);
      if(!Number.isNaN(px)) a.p=px;
      if(!Number.isNaN(chg)) a.d=Math.round(chg*100)/100;
      scoreAsset(a);
    });
    const live=document.querySelector(".status .live");
    if(live) live.innerHTML='<i class="dot"></i> LIVE';
    render();
  }catch(e){}
}
function init(){
  document.querySelectorAll(".chip").forEach(c=>c.onclick=()=>{state.filter=c.dataset.f;render();});
  document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{state.tab=t.dataset.tab;closeSheet();render();});
  $("sheet").addEventListener("click",e=>{ if(e.target.id==="sheet") closeSheet(); });
  const now=new Date(); const hh=((now.getHours()+11)%12)+1; $("clock").textContent=hh+":"+String(now.getMinutes()).padStart(2,"0");
  render(); liveRefresh(); setInterval(liveRefresh,60000);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();
