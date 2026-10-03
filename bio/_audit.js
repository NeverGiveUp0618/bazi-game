// 生平内部自洽检查：node bio/_audit.js "$PWD"（生日/卒日/周岁虚岁/年表与反推生日是否对得上；「慈禧 3 岁」那条是误报）
// 生平内部自洽检查
const fs=require('fs'),path=require('path');
const D=process.argv[2];global.window={BIO:{}};
global.BIO_PUT=(k,o)=>{window.BIO[k]=o;};
require(path.join(D,'bio/meta.js'));
for(const f of fs.readdirSync(path.join(D,'bio')).filter(f=>/^\d{3}\.js$/.test(f))) require(path.join(D,'bio',f));
const M=window.BIO_META,B=window.BIO;
const out=[];const flag=(k,m)=>out.push(`${String(M[k].no).padStart(3,'0')} ${k}：${m}`);
const ymd=s=>{const m=s.match(/(\d{4}) 年 (\d{1,2}) 月 (\d{1,2}) 日/);return m?`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`:null;};
const diffY=(a,b)=>{const[x1,x2,x3]=a.split('-').map(Number),[y1,y2,y3]=b.split('-').map(Number);let n=y1-x1;if(y2<x2||(y2===x2&&y3<x3))n--;return n;};
for(const k in B){
  const o=B[k],items={};o.s.forEach(([c,its])=>its.forEach(([l,t,q])=>{items[l]={t,q,c};}));
  const tl=o.tl,m=M[k];
  // 1 生日
  const bi=items['生日'];let birth=null;
  if(bi){birth=ymd(bi.t);
    if(birth&&m.d&&birth!==m.d&&!bi.q)flag(k,`生日写 ${birth}，本盘反推 ${m.d}，却没标存疑`);
    if(birth&&tl[0]&&tl[0][0].length===10&&tl[0][0]!==birth)flag(k,`基本资料生日 ${birth} ≠ 年表首条 ${tl[0][0]}`);
  }
  // 2 去世
  const de=items['去世'];
  if(de){const dd=ymd(de.t);
    const last=tl[tl.length-1];
    if(dd){
      const inTl=tl.find(e=>e[0]===dd);
      if(!inTl)flag(k,`卒日 ${dd} 不在年表里`);
      const after=tl.filter(e=>e[0].slice(0,4)>dd.slice(0,4)&&!/葬|迁葬|墓|盗|追赠|国葬|奉安|炸毁|骨灰|公布/.test(e[1]));
      if(after.length)flag(k,`卒后还有事件：${after.map(e=>e[0]+e[1].slice(0,10)).join('；')}`);
      const zs=de.t.match(/周岁\s*约?\s*(\d+)/);
      const b0=birth||(tl[0]&&tl[0][0].length===10?tl[0][0]:null);
      if(zs&&b0){const real=diffY(b0,dd);if(Math.abs(real-+zs[1])>0)flag(k,`去世写周岁 ${zs[1]}，按 ${b0}→${dd} 实为 ${real}`);}
      const xs=de.t.match(/虚岁\s*(\d+)/);
      if(xs&&m.d){const by=+m.d.slice(0,4)-((+m.d.slice(5,7)<2||(+m.d.slice(5,7)===2&&+m.d.slice(8)<4))?1:0);const dy=+dd.slice(0,4)-((+dd.slice(5,7)<2||(+dd.slice(5,7)===2&&+dd.slice(8)<4))?1:0);if(dy-by+1!==+xs[1])flag(k,`去世写虚岁 ${xs[1]}，按本盘生年算为 ${dy-by+1}`);}
    }
  }
  // 3 其它文字里的「周岁 N」（健康段）
  for(const l in items){if(l==='去世')continue;const t=items[l].t,zs=t.match(/周岁\s*约?\s*(\d+)/);const dd=de&&ymd(de.t);const b0=birth||(tl[0]&&tl[0][0].length===10?tl[0][0]:null);
    if(zs&&dd&&b0&&Math.abs(diffY(b0,dd)-+zs[1])>0)flag(k,`「${l}」写周岁 ${zs[1]}，实为 ${diffY(b0,dd)}`);}
  // 4 年表首条年份 vs 反推年
  if(m.d&&tl[0]&&!/生/.test(tl[0][1]))flag(k,`年表第一条不是出生：${tl[0][1].slice(0,15)}`);
  if(m.d&&tl[0]){const ty=+tl[0][0].slice(0,4),my=+m.d.slice(0,4);if(Math.abs(ty-my)>0&&!tl[0][2]&&!(bi&&bi.q))flag(k,`年表生年 ${ty} 与反推 ${my} 不同却没标存疑`);}
  // 5 简介里的年份不晚于卒年
  // 6 「X 岁」写法核对：「N 岁时」「年仅 N」
  const txt=JSON.stringify(o);
  const ages=[...txt.matchAll(/(\d{4}) 年[^。；"]{0,30}?(?:虚岁|年仅|时年)?\s*(\d{1,2}) 岁/g)];
  for(const a of ages){const y=+a[1],n=+a[2];const by=birth?+birth.slice(0,4):(m.d?+m.d.slice(0,4):null);if(!by)continue;const s=y-by,x=y-by+1;if(n!==s&&n!==x&&n!==s-1)flag(k,`「${a[0].slice(0,40)}」岁数与生年 ${by} 不合（周 ${s}/虚 ${x}）`);}
  // 7 年表空洞：同一天重复
  const seen={};tl.forEach(e=>{if(e[0].length===10){if(seen[e[0]])flag(k,`年表同日两条 ${e[0]}`);seen[e[0]]=1;}});
}
console.log(out.join('\n')||'无问题');console.log('共',out.length,'条');
