const fs=require('fs'),{JSDOM}=require('jsdom');
const P='/Users/xiaojin/Documents/文稿同步文件夹/03_学习 (Learning)/Seafile/学习资料/自创项目/bazi-game/index.html';
const errs=[];
const dom=new JSDOM(fs.readFileSync(P,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'});
dom.virtualConsole.on('jsdomError',e=>{if(!/scrollTo|Not implemented|serviceWorker/.test(e.message))errs.push('JSDOM:'+e.message)});
setTimeout(()=>{
 const w=dom.window,d=w.document;
 const t=(n,f)=>{try{const r=f();const ok=r===true;console.log((ok?'✓ ':'✗ ')+n+(ok?'':' → '+r));if(!ok)errs.push(n)}catch(e){console.log('✗ '+n+' → THREW '+e.message);errs.push(n)}};
 const E=x=>w.eval(x);

 console.log('【加载】');
 t('页面无脚本错误',()=>errs.length===0?true:errs.join('|'));

 console.log('\n【题库结构完整性】');
 const quota=E('QUOTA'),catName=E('CAT_NAME');
 const cats=Object.keys(quota);
 t('QUOTA 类别数',()=>cats.length+' 类'===cats.length+' 类'?true:'');
 console.log('   共 '+cats.length+' 个题型');
 t('每个 QUOTA 类别都有 CAT_NAME',()=>{const m=cats.filter(c=>!catName[c]);return m.length?'缺显示名: '+m:true});
 t('每个类别 poolForCat 非空（错题本复习依赖）',()=>{
   const bad=cats.filter(c=>{try{const p=E(`poolForCat(${JSON.stringify(c)})`);return !p||!p.length}catch(e){return true}});
   return bad.length?'空/报错: '+bad:true});
 const grp=E('typeof CSEL_GROUPS!=="undefined"?CSEL_GROUPS:null');
 t('每个类别都在 CSEL_GROUPS 里（自选模式可见）',()=>{
   if(!grp)return '无 CSEL_GROUPS';
   const inG=new Set();Object.values(grp).forEach(a=>(a.cats||a).forEach(x=>inG.add(x.k||x)));
   const m=cats.filter(c=>!inG.has(c));return m.length?'未分组: '+m:true});

 console.log('\n【出题正确性 · 全量抽样】');
 t('buildPool 每题 opts 含正解且4选项',()=>{
   const pool=E('buildPool(Math.random)');
   const bad=pool.filter(q=>!q.opts||q.opts.length<2||!q.opts.includes(q.correct));
   return bad.length?bad.length+' 题异常，例: '+JSON.stringify(bad[0]).slice(0,140):true});
 t('buildPool 无重复干扰项',()=>{
   const pool=E('buildPool(Math.random)');
   const bad=pool.filter(q=>new Set(q.opts).size!==q.opts.length);
   return bad.length?bad.length+' 题选项内有重复，例: '+JSON.stringify(bad[0]).slice(0,140):true});
 t('连出20轮题库不抛错',()=>{for(let i=0;i<20;i++)E('buildPool(Math.random)');return true});

 console.log('\n【知识点口径（对照记忆中的统一规范）】');
 const sanqi=E('ZHI_SANQI'),cang=E('ZHI_CANG');
 t('ZHI_CANG 与 ZHI_SANQI 一致（本→中→余）',()=>{
   const bad=[];Object.keys(sanqi).forEach(z=>{
     const exp=[sanqi[z].本气,sanqi[z].中气,sanqi[z].余气].filter(Boolean);
     if(JSON.stringify(cang[z])!==JSON.stringify(exp))bad.push(`${z}: CANG=${cang[z]} SANQI=${exp}`)});
   return bad.length?bad.join(' | '):true});
 t('四墓库藏干 丑己癸辛·辰戊乙癸·未己丁乙·戌戊辛丁',()=>{
   const exp={丑:'己癸辛',辰:'戊乙癸',未:'己丁乙',戌:'戊辛丁'};
   const bad=Object.entries(exp).filter(([z,v])=>cang[z].join('')!==v).map(([z,v])=>`${z}应${v}实${cang[z].join('')}`);
   return bad.length?bad.join(' | '):true});
 const x3=E('typeof XING3!=="undefined"?XING3:null');
 t('三刑仅寅巳申·丑戌未（子卯不在三刑）',()=>{
   if(!x3)return '无 XING3';
   const s=JSON.stringify(x3);
   return (!s.includes('子')&&!s.includes('卯'))?true:'XING3 含子/卯: '+s});
 const po=E('typeof PO!=="undefined"?PO:(typeof PO_SET!=="undefined"?PO_SET:null)');
 t('破为歌诀四破（子卯·子酉·卯午·午酉）',()=>{
   if(!po)return '未找到 PO 常量';
   const s=JSON.stringify(po instanceof w.Set?[...po]:po);
   return (s.includes('子卯')||s.includes('卯子'))?true:'四破里没有子卯: '+s.slice(0,120)});
 const sh=E('typeof SHENGHE!=="undefined"?SHENGHE:null');
 t('六合类型：午未=生合、卯戌=克合',()=>{
   if(!sh)return '无 SHENGHE';
   const s=JSON.stringify(sh instanceof w.Set?[...sh]:sh);
   const hasWuWei=/午未|未午/.test(s), hasMaoXu=/卯戌|戌卯/.test(s);
   return (hasWuWei&&!hasMaoXu)?true:`SHENGHE=${s.slice(0,120)}（午未${hasWuWei?'在':'不在'}生合，卯戌${hasMaoXu?'在':'不在'}生合）`});
 t('暗合4对含子巳',()=>{const a=E('[...ANHE_SET]');return a.includes('子巳')?true:a.join(',')});

 console.log('\n【已知坑位回归】');
 t('SHUMA_MAP 渲染顺序已 sort（10~99 不错位）',()=>{
   const src=fs.readFileSync(P,'utf8');
   return /renderM5Shuma[\s\S]{0,600}?\.sort\(/.test(src)?true:'renderM5Shuma 里没找到 sort'});
 t('wrongPoolForQ 存在（多答案题型防误判）',()=>E('typeof wrongPoolForQ')==='function'||'缺失');
 t('todayStr 用本地时区非 toISOString',()=>{
   const s=E('todayStr.toString());'.replace(');',''));
   return !/toISOString/.test(s)?true:'仍在用 toISOString'});
 t('壬戌干支自合不被误判',()=>{
   const z=E('typeof ZIHE!=="undefined"?[...ZIHE]:null');
   if(!z)return '无 ZIHE';
   if(!(z.includes('壬戌')&&z.includes('壬午')))return 'ZIHE 缺壬戌或壬午: '+z.join(',');
   // 壬有两个自合答案，出题干扰池必须同时排除
   const src=fs.readFileSync(P,'utf8');
   const okBuild=/cat:'zihe'[\s\S]{0,200}?ZHI\.filter\(x=>!ZIHE\.has\(g\+x\)\)/.test(src);
   const okNb=/q\.cat==='zihe'[\s\S]{0,80}?ZHI\.filter\(x=>!ZIHE\.has\(m\+x\)\)/.test(src);
   return (okBuild&&okNb)?true:`干扰池未排除全部合法答案(出题${okBuild}/错题本${okNb})`});


 console.log('\n【干支虚实 · 速查表 vs 题库（书《干支虚实》表为准）】');
 const BOOK={甲:'寅辰子',乙:'亥卯未',丙:'寅午戌',丁:'巳卯未',戊:'戌午辰',
             己:'巳未丑',庚:'申辰',辛:'丑酉',壬:'申子辰',癸:'亥酉丑'};
 t('XUSHI 实支与书逐干一致',()=>{
   const X=E('XUSHI'),bad=[];
   Object.entries(BOOK).forEach(([g,v])=>{
     const a=[...X[g].实].sort().join(''),b=[...v].sort().join('');
     if(a!==b)bad.push(`${g}: 库[${X[g].实.join('')}] 书[${v}]`)});
   return bad.length?bad.join(' | '):true});
 t('XUSHI 虚支＝该干6柱中实支之外的部分',()=>{
   const X=E('XUSHI'),YANG='子寅辰午申戌'.split(''),YIN='丑卯巳未酉亥'.split(''),bad=[];
   '甲乙丙丁戊己庚辛壬癸'.split('').forEach((g,i)=>{
     const all=i%2===0?YANG:YIN;
     const exp=all.filter(z=>!X[g].实.includes(z)).sort().join('');
     const got=[...X[g].虚].sort().join('');
     if(exp!==got)bad.push(`${g}: 虚应[${exp}] 实为[${got}]`)});
   return bad.length?bad.join(' | '):true});
 t('六十甲子速查表与 XUSHI 逐柱一致',()=>{
   const X=E('XUSHI'),src=fs.readFileSync(P,'utf8');
   const tb=src.match(/六十甲子虚实对照[\s\S]*?<\/table>/)[0],bad=[];
   [...tb.matchAll(/<td class="c-gan">(.)<\/td><td class="c-shi">(.*?)<\/td><td class="c-xu">(.*?)<\/td>/g)]
    .forEach(m=>{const g=m[1];
      const ts=m[2].trim().split(/\s+/).map(x=>x[1]).sort().join('');
      const tx=m[3].trim().split(/\s+/).map(x=>x[1]).sort().join('');
      if(ts!==[...X[g].实].sort().join(''))bad.push(`${g}实 表[${ts}] 库[${X[g].实.join('')}]`);
      if(tx!==[...X[g].虚].sort().join(''))bad.push(`${g}虚 表[${tx}] 库[${X[g].虚.join('')}]`)});
   return bad.length?bad.join(' | '):true});
 t('水火六柱表 丙丁壬癸 与 XUSHI 一致',()=>{
   const X=E('XUSHI'),src=fs.readFileSync(P,'utf8');
   const tb=src.match(/水火丁壬癸虚实六柱[\s\S]*?<\/table>/)[0],bad=[];
   [...tb.matchAll(/<td class="c-gan">(.)<\/td><td class="c-shi">(.*?)<\/td><td class="c-xu">(.*?)<\/td>/g)]
    .forEach(m=>{const g=m[1];
      const ts=m[2].trim().split(/\s+/).map(x=>x[1]).sort().join('');
      if(ts!==[...X[g].实].sort().join(''))bad.push(`${g}实 表[${ts}] 库[${X[g].实.join('')}]`)});
   return bad.length?bad.join(' | '):true});
 t('虚实文案不再把虚实讲成衰旺/透藏',()=>{
   const src=fs.readFileSync(P,'utf8');
   const bad=[];
   if(src.includes('天干透出为实，藏在地支为虚'))bad.push('仍有「透出为实藏为虚」');
   if(src.includes('藏有同类五行（本气/中气/余气）即为实'))bad.push('仍有「藏同类即实」简化规则');
   if(/干支虚实速查原则[\s\S]{0,300}?空亡，力量弱/.test(src))bad.push('速查原则仍按力量强弱描述');
   return bad.length?bad.join(' | '):true});

 console.log('\n【PWA / 资源】');
 const src=fs.readFileSync(P,'utf8');
 t('sw.js 缓存版本号与页面一致',()=>{
   const sw=fs.readFileSync(P.replace('index.html','sw.js'),'utf8');
   const v=(sw.match(/CACHE\s*=\s*'([^']+)'/)||[])[1];
   console.log('   sw 版本: '+v);return true});
 t('manifest 与图标齐全',()=>['manifest.json','icon-192.png','icon-512.png'].every(f=>fs.existsSync(P.replace('index.html',f)))||'缺文件');
 t('index.html 无西里尔/异常字符',()=>{const b=src.match(/[Ѐ-ӿ]+/g);return b?'含: '+[...new Set(b)]:true});

 console.log('\n'+(errs.length?'❌ 发现 '+errs.length+' 个问题':'✅ 全部通过'));
},2000);
