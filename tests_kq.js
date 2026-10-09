// 教材知识点题库 ↔ 命理精讲教材 自动对账
// 用法：node tests_kq.js   （教材目录不在时只跑结构检查）
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const line=html.split('\n').find(l=>l.startsWith('const KQ_DATA='));
const D=JSON.parse(line.slice(14,line.lastIndexOf(';')));
const TB=path.join(__dirname,'..','bazi-course','content','实用八字教材');
const strip=s=>String(s).replace(/<[^>]+>/g,'');
const errs=[],warns=[];
// ① 结构
const seen=new Map();
D.forEach(([c,qt,a,w,e],i)=>{
  const tag=`#${i}[${c}] ${strip(qt).slice(0,24)}`;
  if(!/^kq_/.test(c))errs.push(`${tag} 分类名不是 kq_ 开头`);
  if(!Array.isArray(w)||w.length!==3||new Set(w).size!==3)errs.push(`${tag} 干扰项不是 3 个不同的`);
  if(w.includes(a))errs.push(`${tag} 正解混在干扰项里`);
  if(!/〔第\d+章/.test(e))errs.push(`${tag} 解析没有〔第N章…〕出处`);
  if(/视频/.test(qt+a+w.join('')+e))errs.push(`${tag} 出现「视频」二字（全站一律写 v课）`);
  const k=strip(qt);if(seen.has(k))errs.push(`${tag} 题干与 #${seen.get(k)} 重复`);else seen.set(k,i);
});
// ② 与教材对账
if(fs.existsSync(TB)){
  const T={};
  for(const f of fs.readdirSync(TB))if(/^\d\d-.*\.md$/.test(f))T[+f.slice(0,2)]=fs.readFileSync(path.join(TB,f),'utf8');
  const clean=s=>s.replace(/\*\*/g,'');
  const all=clean(Object.values(T).join('\n'));
  const heads={};for(const n in T)heads[n]=[...T[n].matchAll(/^#+\s*(.+)$/gm)].map(m=>clean(m[1]).replace(/^[⭐⚠️\s]+/,''));
  D.forEach(([c,qt,a,w,e],i)=>{
    const tag=`#${i}[${c}] ${strip(qt).slice(0,24)}`;
    for(const m of e.matchAll(/第(\d+)章§([^〕；、]+)/g)){
      const n=+m[1],sec=m[2].replace(/[①-⑩]/g,'').trim();
      if(!T[n]){errs.push(`${tag} 引用的第${n}章不存在`);continue;}
      if(!heads[n].some(h=>h.startsWith(sec)))errs.push(`${tag} 第${n}章找不到小节「${m[2]}」`);
    }
    for(const m of (qt+'｜'+a+'｜'+e).matchAll(/「([^」]{4,})」/g)){
      const qq=strip(m[1]);
      if(/（\s*）/.test(qq))continue;            // 填空题挖了空，跳过
      if(!all.includes(qq))warns.push(`${tag} 引文在教材里找不到：「${qq.slice(0,30)}」`);
    }
  });
}else warns.push('教材目录不在，跳过对账：'+TB);
const L=s=>strip(s).length;
const longest=D.filter(([,,a,w])=>L(a)>Math.max(...w.map(L))).length;
console.log(`教材知识点 ${D.length} 题｜正解最长 ${longest}（${Math.round(longest/D.length*100)}%）`);
warns.forEach(x=>console.log('⚠️ ',x));
errs.forEach(x=>console.log('❌',x));
if(errs.length){console.log(`\n❌ ${errs.length} 处错误`);process.exit(1);}
console.log(warns.length?`\n✅ 结构与出处全部通过（${warns.length} 条引文提醒）`:'\n✅ 结构、出处、引文全部通过');
