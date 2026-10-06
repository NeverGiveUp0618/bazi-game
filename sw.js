const CACHE = 'bazi-v25-kq-more';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './bio/meta.js'];

self.addEventListener('install', e => {
  // ⚠️ 逐个 add 各自兜底：任一资源 404 都会让整个 addAll 失败，
  //    浏览器随后反复重试安装，是无限刷新的另一条路径。
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(ASSETS.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

/* ⚠️⚠️ 2026-09-08：这里原来是缓存优先——
     caches.match(req).then(r => r || fetch(req))
   而 fetch 从不把新版写回缓存，于是 install 那一刻的 index.html（内容全在这一个文件里，440K）
   被永久钉死：别人打开看到的一直是几个版本以前的内容，只有 bump CACHE 才换得掉。
   用户把链接发给别人，对方看到旧版，就是这么来的。

   改成「网络优先，但不干等」：先走网络保证新鲜；超过 TIMEOUT 还没回来就先拿缓存顶上（秒开），
   网络回来照样写进缓存，所以下一次打开一定是新的。
   ⚠️ 别再改回缓存优先——微信 X5 缓存极顽固还无视 ?query，那会让改完的内容长期看不到。 */
const TIMEOUT = 1500;

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(netFirstButDontHang(e.request));
});

function netFirstButDontHang(req) {
  return new Promise(resolve => {
    let settled = false;
    const give = res => { if (!settled && res) { settled = true; resolve(res); } };

    const timer = setTimeout(() => {
      if (settled) return;
      caches.match(req, { ignoreSearch: true }).then(give);   // 没缓存就继续等网络
    }, TIMEOUT);

    fetch(req).then(res => {
      clearTimeout(timer);
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      give(res);        // 若已用缓存应答，这里只是把新版写进缓存，供下次用
    }).catch(() => {
      clearTimeout(timer);
      // 离线：回退缓存；忽略 ?v= 差异，否则换了版本号就全部落空
      caches.match(req, { ignoreSearch: true }).then(hit => {
        give(hit || caches.match('./index.html').then(h => h || new Response('', { status: 504 })));
      });
    });
  });
}
