// 我的断命记录：录盘、加断语、标反馈、统计、备份
const {JSDOM}=require('jsdom');const fs=require('fs');
const dom=new JSDOM(fs.readFileSync(__dirname+'/index.html','utf8'),{url:'http://localhost/',runScripts:'dangerously',pretendToBeVisual:true});
const w=dom.window,d=w.document,ev=x=>w.eval(x);let fail=0;const ck=(c,m)=>{console.log((c?'✓ ':'✗ ')+m);if(!c)fail++;};
setTimeout(()=>{
  ck(ev("lgParse('甲子 丙寅 戊辰 庚申')")==='甲丙戊庚子寅辰申','四柱解析（年月日时→干四支四）');
  ck(ev("lgParse('甲丑 丙寅 戊辰 庚申')")===null&&ev("lgParse('甲子 丙寅')")===null,'阴阳不配或不足 8 字拒收');
  ev('openLog()');ck(d.getElementById('p-log').classList.contains('active'),'进入断命记录');
  ev('lgEdit(-1)');
  d.getElementById('lg-name').value='同事小王';d.getElementById('lg-gz').value='乙卯 丙戌 己亥 癸酉';ev('lgSync();lgForm()');
  ck(/卯戌合/.test(d.getElementById('lg-body').textContent),'录盘后自动列出盘上作用');
  const add=(t,h,wt)=>{d.getElementById('lg-t').value=t;[...d.querySelectorAll('#lg-how button')].find(b=>b.textContent===h).click();[...d.querySelectorAll('#lg-what button')].find(b=>b.textContent===wt).click();ev('lgAdd()');};
  add('早年当兵','合','官/事业');add('36 岁前不聚财','十神','财');
  ck(ev('LG.items.length')===2,'加两条断语');
  ev("LG.items[0].fb='y';LG.items[1].fb='n';lgSave()");
  const L=JSON.parse(w.localStorage.getItem('bazi_mylog')||'[]');
  ck(L.length===1&&L[0].name==='同事小王'&&L[0].g==='乙丙己癸卯戌亥酉','保存到本地（bazi_mylog）');
  const t=d.getElementById('lg-body').textContent;
  ck(/合准1・半0・错0100%/.test(t.replace(/\s/g,''))&&/十神准0・半0・错10%/.test(t.replace(/\s/g,'')),'按作用方式统计准确率');
  ev('renderLogHome()');ck(/记录 1 盘.*准确率 50%/.test(d.getElementById('el-log-sub').textContent),'首页显示记录数与准确率');
  let bk=null;w.Blob=function(p){bk=JSON.parse(p.join(''));};w.URL.createObjectURL=()=>'blob:x';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};ev('exportBackup()');
  ck(bk&&bk.mylog&&bk.mylog.length===1,'导出备份含断命记录');
  console.log(fail?`\n❌ ${fail} 项失败`:'\n✅ 断命记录全部通过');process.exit(fail?1:0);
},500);
