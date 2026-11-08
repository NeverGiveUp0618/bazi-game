// 答题后点教材出处链接 → 页面重载 → 自动回到那组题
const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const mk=(pre)=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',
  beforeParse(w){w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};if(pre)w.localStorage.setItem('bazi_m1_resume',pre);}});
const fail=[];const ck=(c,m)=>{console.log((c?'✓ ':'✗ ')+m);if(!c)fail.push(m);};
const d1=mk();
setTimeout(()=>{
  const w=d1.window,ev=x=>w.eval(x);
  ev('setM1Count(10)');ev('startM1Chapter(8)');
  const G=ev('G1');const q=G.qs[0];w.m1Pick(w.eval('_opts').indexOf(q.correct));
  const a=w.document.createElement('a');a.className='src-x';a.href='https://nevergiveup0618.github.io/bazi-course/?go=08-';w.document.body.appendChild(a);
  a.addEventListener('click',e=>e.preventDefault());a.click();
  Object.defineProperty(w.document,'visibilityState',{value:'hidden',configurable:true});w.document.dispatchEvent(new w.Event('visibilitychange'));  // 去看教材时页面被切到后台
  const saved=w.localStorage.getItem('bazi_m1_resume');
  ck(JSON.parse(saved).via==='link','切后台没有覆盖掉「点链接」的断点');
  ck(!!saved,'点链接时存了断点');
  const sc=G.score,cur=G.cur;
  const d2=mk(saved);
  d2.window.addEventListener('load',()=>setTimeout(()=>{
    const w2=d2.window,G2=w2.eval('G1');
    ck(w2.document.getElementById('p1g').classList.contains('active'),'重载后直接是做题界面');
    ck(G2.qs.length===G.qs.length&&G2.cur===cur&&G2.score===sc,`进度与得分保留（第${G2.cur+1}题，${G2.score}分）`);
    ck(w2.document.getElementById('m1-lbl').textContent.includes('第8章'),'顶栏仍是第8章');
    ck(!w2.localStorage.getItem('bazi_m1_resume'),'断点用完即清');
    const d3=mk(JSON.stringify({...JSON.parse(saved),at:Date.now()-3*3600e3}));
    d3.window.addEventListener('load',()=>setTimeout(()=>{
      ck(!d3.window.document.getElementById('p1g').classList.contains('active'),'超过 2 小时不再自动恢复');
      console.log(fail.length?'\n❌ '+fail.length+' 项失败':'\n✅ 断点续做全部通过');process.exit(fail.length?1:0);},800));
  },800));
},1500);
