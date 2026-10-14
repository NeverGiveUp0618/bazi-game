// 答题后停留：每题都留 5 秒再自动跳（可提前跳）
const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',
  beforeParse(w){w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};}});
const fail=[];const ck=(c,m)=>{console.log((c?'✓ ':'✗ ')+m);if(!c)fail.push(m);};
setTimeout(()=>{
  const w=dom.window,d=w.document,G1=w.eval('G1'),prog=()=>d.getElementById('el-prog').textContent;
  G1.qs=w.eval('KQ_DATA').slice(0,3).map(([c,qt,a,ws,e],i)=>({cat:c,_id:'t'+i,main:[],qt,correct:a,w:ws,opts:[a,...ws],exp:e}));
  G1.cur=0;G1.timed=false;w.eval("show('p1g');m1Next()");
  w.m1Pick(1);
  const fb=d.getElementById('el-fb');
  ck(!!fb.querySelector('.fb-next'),'答错后出现「下一题」按钮');
  ck(!!fb.querySelector('.fb-exp'),'答错后显示解析');
  ck(fb.textContent.includes(G1.qs[0].correct),'答错后写明正确答案');
  setTimeout(()=>{
    ck(prog()==='1/3','2.5 秒后仍停在第 1 题');
    ck(/下一题 → \d/.test(d.getElementById('el-fb').textContent),'按钮上有倒计时');
    setTimeout(()=>{
    ck(prog()==='2/3','5 秒后自动跳到第 2 题');
    w.m1Pick(1);
    d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter'}));
    ck(prog()==='3/3','倒计时中按回车可提前跳');
    w.m1GoNext();ck(prog()==='3/3','重复点「下一题」不会连跳');
    G1.qs=[{cat:'wx',main:['甲'],qt:'?',correct:'木',w:['火','土','金'],opts:['木','火','土','金'],exp:'短'},{cat:'wx',main:['乙'],qt:'?',correct:'木',w:['火','土','金'],opts:['木','火','土','金'],exp:''}];
    G1.cur=0;w.m1Next();w.m1Pick(0);
    ck(!!d.getElementById('el-fb').querySelector('.fb-next'),'答对也出倒计时按钮');
    setTimeout(()=>{ck(prog()==='1/2','答对 1.5 秒时仍停在原题');
      // 结果页「再来一组」
      w.eval("clearInterval(G1.nextT);G1.waitNext=false;G1.cur=G1.qs.length;m1Next()");
      ck(d.getElementById('p1r').classList.contains('active'),'答完一组进结果页');
      ck(!!d.getElementById('el-again'),'结果页有「再来一组」按钮');
      for(const[m,t]of[['custom',true],['free-nt',false],['daily',true]]){
        if(m==='custom')w.eval("CUSTOM_CATS.clear();CUSTOM_CATS.add('kq_ti')");
        G1.mode=m;G1.timed=t;d.getElementById('el-again').click();
        ck(d.getElementById('p1g').classList.contains('active')&&prog().startsWith('1/')&&G1.timed===t,`「再来一组」(${m})重开新一组、计时设置不变`);
        clearInterval(G1.timer);
      }
      ck(G1.mode==='free','今日挑战再来一组改开随机（不重复同一组）');
      console.log(fail.length?`\n❌ ${fail.length} 项失败`:'\n✅ 答题停留全部通过');process.exit(fail.length?1:0);},1500);
    },3000);
  },2500);
},500);
