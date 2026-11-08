// 入站自检自适应间隔：首次放行；全对翻倍(封顶10)；错一次减半；间隔内不弹
const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const ORD=['天元入命','确定虚实','确定喜忌','干支意向','十神格局','作用方式','宫位大限','大运流年'],K='bazi_game_gate_ok';
const mk=pre=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',beforeParse(w){w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});w.scrollTo=()=>{};if(pre)w.localStorage.setItem(K,JSON.stringify(pre));}});
const fail=[];const ck=(c,m)=>{console.log((c?'✓ ':'✗ ')+m);if(!c)fail.push(m);};
const solve=(w,wrong)=>new Promise(r=>{const d=w.document,btn=n=>[...d.querySelectorAll('.entry-gate-option')].find(b=>b.textContent===n&&!b.disabled);
  const go=()=>{ORD.forEach(n=>btn(n).click());setTimeout(()=>r(JSON.parse(w.localStorage.getItem(K))),500)};
  if(wrong){[...d.querySelectorAll('.entry-gate-option')].find(b=>b.textContent!==ORD[0]).click();setTimeout(go,1000)}else go();});
const sh=w=>!w.document.getElementById('entryGate').hidden;
(async()=>{
 let d=mk();await new Promise(r=>setTimeout(r,600));ck(!sh(d.window),'首次打开直接放行');ck(JSON.parse(d.window.localStorage.getItem(K)).d===5,'记下 5 天间隔');
 d=mk({t:Date.now()-1*864e5,d:5});await new Promise(r=>setTimeout(r,600));ck(!sh(d.window),'间隔内不弹');
 d=mk({t:Date.now()-6*864e5,d:5});await new Promise(r=>setTimeout(r,600));ck(sh(d.window),'超过间隔弹出');
 let v=await solve(d.window,false);ck(v.d===10,'零失误 5→10');
 d=mk({t:Date.now()-11*864e5,d:10});await new Promise(r=>setTimeout(r,600));v=await solve(d.window,false);ck(v.d===10,'10 天封顶不再涨');
 d=mk({t:Date.now()-11*864e5,d:10});await new Promise(r=>setTimeout(r,600));v=await solve(d.window,true);ck(v.d===5,'错一次 10→5');
 d=mk({t:Date.now()-2*864e5,d:30});await new Promise(r=>setTimeout(r,600));ck(!sh(d.window)&&true,'旧的超大间隔被压到 10 天内');
 console.log(fail.length?'\n❌ '+fail.length+' 项失败':'\n✅ 入站自检间隔全部通过');process.exit(fail.length?1:0);
})();
