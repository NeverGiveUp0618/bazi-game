// 按章节练 / 本组错题回炉 / 只练错题 / 常混淆 / ?ch= 直达
const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const mk=(url)=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:url||'http://localhost/',
  beforeParse(w){w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};}});
const fail=[];const ck=(c,m)=>{console.log((c?'✓ ':'✗ ')+m);if(!c)fail.push(m);};
const dom=mk();
setTimeout(()=>{
  const w=dom.window,d=w.document,G1=w.eval('G1'),ev=x=>w.eval(x);
  const KQ=ev('KQ_DATA'),IDX=ev('KQ_CH_IDX');
  // 归章
  const tot=Object.values(IDX).reduce((a,b)=>a+b.length,0);
  ck(tot===KQ.length,`教材知识点全部归到章（${tot}/${KQ.length}）`);
  ck(Object.keys(IDX).length===16,'16 章都有题');
  ck(d.querySelectorAll('#el-ch-list .chr').length===16,'首页章节卡 16 行');
  // 开练第 8 章
  ev('setM1Count(10)');ev('startM1Chapter(8)');
  ck(d.getElementById('p1g').classList.contains('active')&&G1.mode==='ch'&&G1.timed===false,'第 8 章开练（无计时）');
  ck(G1.qs.length===Math.min(10,IDX[8].length)&&G1.qs.every(q=>ev('kqCh')(q.exp)===8),'题全部出自第 8 章');
  ck(d.getElementById('m1-lbl').textContent.includes('第8章'),'顶栏标明第 8 章');
  let lastWrong=null;const pickWrong=(want)=>{const q=G1.qs[G1.cur],o=w.eval('_opts');const i=want?o.indexOf(want):o.findIndex(x=>x!==q.correct);lastWrong=o[i];w.m1Pick(i);w.m1GoNext();return q;};
  const pickRight=()=>{const q=G1.qs[G1.cur];w.m1Pick(w.eval('_opts').indexOf(q.correct));w.m1GoNext();};
  // 第 1 题答错两次累计常混淆：先在这组错一次
  const base=G1.qs.length;
  const q1=pickWrong();const w1=lastWrong;
  ck(G1.qs.length===base+1&&G1.qs[base]._redo&&G1.qs[base]._id===q1._id,'答错的题排到本组末尾回炉');
  ck(G1.streak===0,'答错断连击');
  for(let k=1;k<base;k++)pickRight();
  ck(G1.cur===base&&d.getElementById('m1-cat').textContent.includes('再练一次'),'回炉题标「刚才错过·再练一次」');
  const sc=G1.score,cr=G1.correct;
  pickRight();
  ck(G1.score===sc&&G1.correct===cr,'回炉题答对不加分、不计正确数');
  ck(d.getElementById('p1r').classList.contains('active'),'回炉做完进结果页');
  ck(d.getElementById('el-rc').textContent===`${base-1}/${base}`,'结果只按原题数统计');
  ck(d.getElementById('el-bd').textContent.includes('回炉'),'结果页写明回炉情况');
  ck(G1.wrongQs.length===1&&G1.wrongQs[0]._id===q1._id,'错题列表只列原题一次');
  ck(d.getElementById('r1-lbl').textContent.includes('第8章'),'结果页标题写第 8 章');
  const st=JSON.parse(w.localStorage.getItem('bazi_kq_ch')||'{}')[8];
  ck(st&&st.a===base&&st.e===1&&st.r.length===base,'第 8 章掌握度已记录（回炉不重复计）');
  ev('initHome()');
  ck(/\d+%/.test(d.querySelectorAll('#el-ch-list .chr')[7].textContent),'首页第 8 章显示正确率');
  ck(d.getElementById('el-ch-sub').textContent.includes('第8章'),'首页提示最该练的章');
  // 只练这几道错题
  ck(d.getElementById('el-wq-section').style.display==='block'&&!!d.getElementById('el-redo-btn'),'结果页有「只练这几道错题」');
  const before=JSON.stringify(ev('getCatStats()'));
  d.getElementById('el-redo-btn').click();
  ck(G1.mode==='redo'&&G1.qs.length===1&&G1.qs[0]._id===q1._id&&!G1.qs[0]._redo,'只练错题：就这一道');
  pickWrong(w1);  // 第二次同样错 → 常混淆
  pickRight();  // 回炉
  ck(JSON.stringify(ev('getCatStats()'))===before,'错题重练不改题型统计');
  ck(d.getElementById('el-conf').textContent.includes('混了 2 次'),'同一对选项错 2 次 → 结果页提醒常混淆');
  ev('showMaster()');
  ck(d.getElementById('el-master-body').textContent.includes('最常搞混'),'掌握度页列出常混淆');
  // 重练后「再来一组」回到原来的章
  ev("show('p1r')");d.getElementById('el-again').click();
  ck(G1.mode==='ch'&&G1.ch===8,'错题重练后「再来一组」仍练第 8 章');
  // 导出备份要带上章节掌握度与常混淆
  let bk=null;w.Blob=function(parts){bk=JSON.parse(parts.join(''));};w.URL.createObjectURL=()=>'blob:x';w.URL.revokeObjectURL=()=>{};
  w.HTMLAnchorElement.prototype.click=function(){};ev('exportBackup()');
  ck(bk&&bk.kq_ch&&bk.kq_ch[8]&&bk.confuse&&Object.keys(bk.confuse).length>0,'导出备份含章节掌握度与常混淆');
  // ?ch= 直达
  const d2=mk('http://localhost/?ch=12');
  setTimeout(()=>{
    const G=d2.window.eval('G1');
    ck(G.mode==='ch'&&G.ch===12&&d2.window.document.getElementById('p1g').classList.contains('active'),'?ch=12 打开直接练第 12 章');
    console.log(fail.length?`\n❌ ${fail.length} 项失败`:'\n✅ 章节练·回炉·常混淆全部通过');process.exit(fail.length?1:0);
  },500);
},500);
