// 入门自检已撤：新用户、旧过期记录及异常旧值都直接进站，不改学习记录。
const fs=require('fs'),path=require('path'),assert=require('assert'),{JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),key='bazi_game_gate_ok';
assert(!/entryGate|entry-locked|bazi_game_gate_ok/.test(html),'页面不得保留入门遮罩、锁屏或自检触发代码');
(async()=>{
 let checks=1;
 for(const pre of [null,JSON.stringify({t:Date.now()-30*864e5,d:1}),String(Date.now()-30*864e5),'broken-old-value']){
  const errors=[],observers=[],seen=JSON.stringify({10:[Date.now()/1000,1,3,2,Date.now()/1000+86400]});
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://nevergiveup0618.github.io/bazi-game/',beforeParse(w){
   const NativeObserver=w.MutationObserver;w.MutationObserver=class extends NativeObserver{constructor(fn){super(fn);observers.push(this);}};
   w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
   w.addEventListener('error',e=>errors.push(e.message));
   if(pre!==null)w.localStorage.setItem(key,pre);w.localStorage.setItem('bazi_kq_seen',seen);
  }});
  await new Promise(r=>setTimeout(r,70));const w=dom.window,d=w.document;
  assert(!d.getElementById('entryGate')&&!d.body.classList.contains('entry-locked'),'不弹自检，不锁页面');checks++;
  assert(d.querySelector('#ph.active'),'直接显示首页');checks++;
  assert.strictEqual(w.localStorage.getItem(key),pre,'不读取或重写旧自检记录');checks++;
  assert.strictEqual(w.localStorage.getItem('bazi_kq_seen'),seen,'保留已有学习记录');checks++;
  w.eval('startM1("free-nt")');assert(d.querySelector('#p1g.active')&&w.eval('G1.qs.length>0'),'可以直接开始练习');checks++;
  await new Promise(r=>setTimeout(r,20));assert.deepStrictEqual(errors,[],'没有启动/练习异常');checks++;observers.forEach(o=>o.disconnect());dom.window.close();
 }
 console.log(`通过 ${checks} 项：无入门自检，旧自检记录不拦截，学习记录保留，可直接做题。`);
})().catch(e=>{console.error(e);process.exitCode=1});
