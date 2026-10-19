// 断盘陪练：737 个命例逐个出题不报错、答案都在选项里、虚实十神作用与本站表一致；UI 走通一盘
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const cases=fs.readFileSync(__dirname+'/drill/cases.js','utf8');
let fail=0;const ck=(c,m)=>{console.log((c?'✓ ':'✗ ')+m);if(!c)fail++;};
const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',pretendToBeVisual:true});
const w=dom.window;
setTimeout(()=>{
  w.eval(cases);const all=w.DRILL;ck(all.length>=700,`命例数据 ${all.length} 例`);
  const ev=x=>w.eval(x);let bad=[],nstep=0,n4=0;
  for(const c of all){
    if(!/^[甲乙丙丁戊己庚辛壬癸]{4}[子丑寅卯辰巳午未申酉戌亥]{4}$/.test(c.g)){bad.push(c.n+' 盘');continue;}
    const st=ev('drBuild')(c,all,ev('mkRng')(c.n));nstep+=st.length;if(st.length>=4)n4++;
    for(const S of st){
      if(S.k==='one'&&!S.o.includes(S.a))bad.push(c.n+' 答案不在选项');
      if(S.k==='one'&&new Set(S.o).size!==S.o.length)bad.push(c.n+' 选项重复');
      if(S.k==='multi'&&!S.a.every(a=>S.o.includes(a)))bad.push(c.n+' 多选答案缺');
      if(S.k==='multi'&&S.o.length<3)bad.push(c.n+' 多选选项太少');
    }
  }
  ck(!bad.length,'逐例出题检查'+(bad.length?'：'+bad.slice(0,5).join('；'):''));
  ck(n4/all.length>0.9,`九成以上命例至少 4 步（${n4}/${all.length}，共 ${nstep} 步）`);
  {const c=all[0];const st=ev('drBuild')(c,all,ev('mkRng')(1));
    ck(st.every(S=>S.b)&&st[0].b.startsWith('①'),'每步带八步标签，第一步是①天元入命');
    const ord=st.filter(S=>!S.b.includes('对照原书')).map(S=>S.b[0]);ck(ord.join('')===ord.slice().sort().join(''),'步骤按八步顺序：'+ord.join(''));}
  {const fake={n:-1,g:'甲丙甲庚寅午子申',x:'乾',tg:[],d:''};const st=ev('drBuild')(fake,all,ev('mkRng')(2));
    const lu=st.find(S=>S.b.includes('禄')),rk=st.find(S=>S.b.startsWith('④')),gw=st.find(S=>S.b.startsWith('⑦'));
    ck(lu&&lu.a==='寅，在年支','甲禄寅、在年支');ck(rk&&rk.a==='有所生（食伤透干）','甲见丙＝有所生');
    ck(gw&&gw.a.length===1&&gw.a[0]==='盘上没有','甲木男命无戊己辰戌丑未 ⇒ 财星盘上没有');}
  {const ln=all.filter(c=>c.src);ck(ln.length>=30&&ln.every(c=>c.n>10000&&c.d),`课程笔记案例 ${ln.length} 例，都带断语`);
    {const tk=new Set(all.filter(c=>!c.src).map(c=>c.g));ck(ln.every(c=>!tk.has(c.g))&&new Set(ln.map(c=>c.g)).size===ln.length,'课程笔记案例不与题库重盘、自身也不重');}
    const nx=ln.find(c=>c.x==='—');if(nx)ck(!ev('drBuild')(nx,all,ev('mkRng')(3)).some(S=>S.b.startsWith('⑦')),'性别未说的盘不出妻星夫星题');}
  // 关系判定抽检（本站口径）
  const zr=ev('drZhiRel');
  ck(zr('子','午').includes('冲')&&zr('亥','午').includes('暗合')&&zr('亥','午').includes('绝')&&zr('子','辰').includes('半合')&&zr('申','辰').includes('拱合')&&zr('丑','戌').includes('刑')&&zr('卯','辰').includes('穿')&&!zr('丑','未').includes('刑'),'地支关系判定（冲/暗合+绝/半合/拱合/刑/穿；丑未不论刑）');
  ck(ev("drGanRel('甲','己')").includes('合')&&ev("drGanRel('丙','壬')").includes('冲')&&!ev("drGanRel('甲','乙')").length,'天干五合四冲');
  ck(ev("getXuShi('庚','戌')")==='虚'&&ev("getXuShi('甲','辰')")==='实','虚实表：庚戌虚、甲辰实');
  // UI 走一盘
  w.DRILL=all;ev('startDrill()');
  setTimeout(()=>{
    const d=w.document;ck(d.getElementById('p-drill').classList.contains('active')&&d.querySelectorAll('#dr-pan .dr-col').length===4,'进入陪练，盘面四柱');
    ck(!d.getElementById('dr-body').textContent.includes(ev('DR.c.t')),'答题前不剧透命例标题');
    let guard=0;
    while(ev('DR.i<DR.st.length')&&guard++<20){
      const S=ev('DR.st[DR.i]');
      if(S.k==='one')ev('drPick(DR.st[DR.i].o.indexOf(DR.st[DR.i].a))');
      else{d.querySelectorAll('#dr-body .dr-chip').forEach(b=>{if(S.a.includes(S.o[+b.dataset.k]))b.classList.add('on');});ev('drMulti()');}
      ev('DR.i++;drNext()');
    }
    const body=d.getElementById('dr-body').textContent;
    ck(body.includes('100 分')&&body.includes('【题'),'全答对 ⇒ 100 分并揭晓原书断语');
    ck(Object.keys(JSON.parse(w.localStorage.getItem('bazi_drill')||'{}')).length===1,'记下这一盘（bazi_drill）');
    ev('renderDrillHome()');ck(/已断 1 盘/.test(d.getElementById('el-dr-sub').textContent),'首页陪练卡显示已断盘数');
    const T=JSON.parse(w.localStorage.getItem('bazi_drill_step')||'{}');ck(Object.keys(T).some(k=>k.startsWith('①'))&&Object.values(T).every(v=>v[0]===v[1]),'按步记下对错（bazi_drill_step）');
    ck(/日主/.test(d.getElementById('dr-pan').textContent),'答完把标准答案标到盘上（日主等）');
    w.localStorage.setItem('bazi_drill_step',JSON.stringify({'⑦ 宫位':[1,6],'② 干支虚实':[5,6]}));
    ck(ev('drWeak(5)[0][0]')==='⑦ 宫位','弱项排序：正确率最低的排第一');
    ev("startDrillFocus('⑦ 宫位')");
    setTimeout(()=>{ck(ev('DR.focus')==='⑦ 宫位'&&ev('DR.st.length')===10&&ev("DR.st.every(S=>S.b==='⑦ 宫位'&&S.c)"),'专练：连续 10 个盘只练这一步');
      ck(ev('new Set(DR.st.map(S=>S.c.n)).size')===10,'专练的 10 题来自 10 个不同的盘');
      console.log(fail?`\n❌ ${fail} 项失败`:'\n✅ 断盘陪练全部通过');process.exit(fail?1:0);},200);
    return;
    console.log(fail?`\n❌ ${fail} 项失败`:'\n✅ 断盘陪练全部通过');process.exit(fail?1:0);
  },200);
},500);
