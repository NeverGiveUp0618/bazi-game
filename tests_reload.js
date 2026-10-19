// 新 sw 接管时：用户已在用（点过/不在首页）不许强刷，只点亮更新条；刚打开没动过才刷一次
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
let fail=0;const ck=(c,m)=>{console.log((c?'✓ ':'✗ ')+m);if(!c)fail++;};
const patched=html.replace("    location.reload();\n  });\n}","    window.__reload();\n  });\n}");
if(patched===html){console.log('✗ 没找到 reload 挂钩点');process.exit(1);}
const html2=patched;
(async()=>{
  const mk=(setup)=>new Promise(res=>{
    let reloaded=false;
    const dom=new JSDOM(html2,{url:'http://localhost/',runScripts:'dangerously',pretendToBeVisual:true,
      beforeParse(w){const sw=new w.EventTarget();sw.controller={};sw.register=()=>Promise.resolve();
        Object.defineProperty(w.navigator,'serviceWorker',{value:sw});w.__reload=()=>{reloaded=true;};}});
    const w=dom.window;
    setTimeout(()=>{setup(w);w.navigator.serviceWorker.dispatchEvent(new w.Event('controllerchange'));
      setTimeout(()=>res({reloaded,bar:w.document.querySelector('.update-bar-text').textContent}),50);},300);
  });
  let r=await mk(w=>{w.dispatchEvent(new w.Event('pointerdown'));});
  ck(!r.reloaded&&r.bar.includes('新版本'),'点过东西后新版本接管：不强刷，更新条亮起');
  r=await mk(w=>{w.eval("show('p1g')");});
  ck(!r.reloaded,'不在首页时新版本接管：不强刷');
  r=await mk(w=>{});
  ck(r.reloaded,'刚打开、在首页、没动过：照常刷一次');
  console.log(fail?`\n❌ ${fail} 项失败`:'\n✅ 新版本接管不打断使用');process.exit(fail?1:0);
})();
