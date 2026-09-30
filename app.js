(function(){
const ASSETS=window.PULSE_DATA||[];
const CIK={NVDA:"0001045810",AAPL:"0000320193",TSLA:"0001318605",AMZN:"0001018723",MSFT:"0000789019",META:"0001326801",GOOGL:"0001652044",AMD:"0000002488",AVGO:"0001730168",PLTR:"0001321655"};
const CLUSTERS=[
  {s:"GME",n:"GameStop",ins:4,v:"+$59.0M"},
  {s:"PAM",n:"Pampa Energy",ins:2,v:"+$10.8M"},
  {s:"INBX",n:"Inhibrx",ins:2,v:"+$3.9M"},
  {s:"INR",n:"Infinity Natural",ins:2,v:"+$0.7M"},
  {s:"PLAY",n:"Dave & Buster's",ins:2,v:"+$0.2M"}
];
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
  $("list").innerHTML=`<div class="osint">
    <div class="block"><h4>HOW TO READ SIGNS</h4><p>Each source answers one question. If heat says BUY and signs agree, size up. If they fight, sit.</p></div>
    <div class="block"><h4>EXPANSION · 8-K / GROWTH</h4><p><span class="tag ck">CHECK</span> Apify expansion scraper watches 8-Ks and news for hire / buy / launch / partner. On a name: open 8-K. New plant, deal, or product = lift. Lawsuit, restatement, CEO exit = drag.</p></div>
    <div class="block"><h4>BARCHART · TAPE + OPINION</h4><p><span class="tag ck">CHECK</span> Barchart is the quote + technical + analyst page. Use it to confirm volume and whether the street is already long. Do not buy a cold name because an opinion is green.</p></div>
    <div class="block"><h4>FT MARKETS · CONTEXT</h4><p><span class="tag ck">CHECK</span> FT is the grown-up tape: what the name owns, sector mix, and the story the Street is selling. Good for ETFs. Not a trigger.</p></div>
    <div class="block"><h4>SENTISENSE · MOOD</h4><p><span class="tag ${71>=60?"up":"dn"}">${71>=60?"LIFT":"DRAG"}</span> News + social mood. Crypto Fear &amp; Greed is 71 GREED. Greed supports trend-following. It does not mean buy a broken chart.</p></div>
    <div class="block"><h4>SEC EDGAR · THE FILING</h4><p><span class="tag ck">CHECK</span> 8-K = something happened. 10-Q / 10-K = the books. Form 4 = insiders trading their own stock. No filing is a buy button by itself.</p></div>
    <div class="block"><h4>OPENINSIDER · CLUSTER BUYS</h4><p>Several officers buying the same stock in a short window is the clean insider tell. One 10% holder selling is usually noise. Latest clusters:</p>
      ${CLUSTERS.map(c=>`<a class="cluster" href="http://openinsider.com/${c.s}" target="_blank" rel="noopener"><b>${c.s}</b><span>${c.ins} insiders · ${c.v}</span></a>`).join("")}
      <p style="margin-top:10px"><a class="btn" href="http://openinsider.com/latest-cluster-buys" target="_blank" rel="noopener">OPEN CLUSTER LIST</a></p>
    </div>
    <div class="block"><h4>INSIDER SCANNER · FORM 4</h4><p><span class="tag ck">CHECK</span> Same data as OpenInsider, filtered: officer buy ≥ $25k, skip 10b5-1 auto-sells when you can. Cluster + officer buy + HOT trend = the only stack worth sizing.</p></div>
    <div class="block"><h4>MARKET TELL</h4><p>Hot: ${hot}.<br>Cold: ${ice}.</p></div>
    <div class="block"><h4>THE STACK — KEEP IT DUMB</h4><p>1. Heat first.<br>2. Fib tells you where to buy it.<br>3. Expansion / 8-K tells you if the company is growing or breaking.<br>4. Insiders tell you if they agree with their own story.<br>5. Mood / Barchart / FT are context. Never the trigger.</p></div>
    <p class="note">Apify actors and FTMarkets run off-phone. Here you get the public page each one is built on. Cluster list from OpenInsider 30 Sep 2026. Not advice.</p>
  </div>`;
}
function linksFor(a){
  const cik=CIK[a.s];
  const edgar=cik?`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&owner=include&count=10`:`https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(a.s)}`;
  const eightk=cik?`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=8-K&dateb=&owner=include&count=10`:`https://www.sec.gov/edgar/search/#/q=%22${encodeURIComponent(a.s)}%22%20%228-K%22`;
  return [
    ["8-K EXPAND", eightk],
    ["EDGAR", edgar],
    ["INSIDERS", "http://openinsider.com/"+encodeURIComponent(a.s)],
    ["CLUSTER", "http://openinsider.com/latest-cluster-buys"],
    ["BARCHART", "https://www.barchart.com/stocks/quotes/"+encodeURIComponent(a.s)+"/overview"],
    ["FT MARKETS", "https://markets.ft.com/data/search?query="+encodeURIComponent(a.s)],
    ["SENTI MOOD", "https://app.sentisense.ai/indexes/market-mood"],
    ["CHART", "https://finance.yahoo.com/quote/"+encodeURIComponent(a.raw)]
  ];
}
function openSheet(sym){
  const a=ASSETS.find(x=>x.s===sym); if(!a) return;
  const sig=signal(a), fac=factors(a), hi=a.hi, lo=a.lo, span=hi-lo||1;
  const fibHTML=Object.entries(a.fib).map(([k,v])=>`<div class="fib-line" style="top:${((hi-v)/span)*100}%"><b>${k}</b><span>${fmt(v)}</span></div>`).join("");
  const py=Math.max(4,Math.min(96,((hi-a.p)/span)*100));
  const btns=linksFor(a).map(([lab,href])=>`<a class="btn" href="${href}" target="_blank" rel="noopener">${lab}</a>`).join("");
  $("sheet").classList.add("show");
  $("panel").innerHTML=`<div class="handle"></div><div class="d-top"><div><div class="d-sym">${a.s}</div><div class="d-nm">${a.t} · ${a.n}</div></div><button class="close" id="closeSheet">CLOSE</button></div>
    <div class="bigpx">${fmt(a.p)}</div>
    <div class="chg ${a.d>=0?"up":"dn"}">${a.d>=0?"+":""}${a.d.toFixed(2)}% · heat ${a.heat}</div>
    <div class="row"><div class="kpi"><div class="l">20-day</div><div class="v">${fmt(a.s20)}</div></div><div class="kpi"><div class="l">50-day</div><div class="v">${fmt(a.s50)}</div></div><div class="kpi"><div class="l">60d range</div><div class="v">${fmt(a.lo)}–${fmt(a.hi)}</div></div></div>
    <div class="verdict" style="border-color:${sig.c}44"><div class="g">SIMPLE CALL</div><div class="s" style="color:${sig.c}">${sig.k}</div><p>${sig.why}</p></div>
    <div class="section"><h3>Fibonacci — 60 day swing</h3><div class="fib">${fibHTML}<div class="price-mark" style="top:${py}%"><em>NOW ${fmt(a.p)}</em></div></div></div>
    <div class="section"><h3>What moves it</h3><div class="factors">${fac.map(f=>`<div class="factor"><span class="tag ${f.dir}">${f.dir==="up"?"LIFT":"DRAG"}</span><span>${f.t}</span></div>`).join("")}</div></div>
    <div class="section"><h3>Open the sources</h3><div class="btns">${btns}</div></div>
    <p class="note">8-K = expansion/break. Form 4 / OpenInsider = insiders. Barchart / FT / Senti = context. Heat stays the trigger.</p>`;
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
