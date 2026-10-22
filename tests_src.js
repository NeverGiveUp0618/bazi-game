/* 出处展开（2026-10-22）：题里的缩写出处要能展开成全称，教材章节要带跳转链接。 */
const fs = require('fs');
const s = fs.readFileSync(__dirname + '/index.html', 'utf8');
const i = s.lastIndexOf('/* ===== 出处展开'), j = s.indexOf('const RE=', i);
const expand = new Function(s.slice(s.indexOf('const COURSE', i), j) + '\nreturn expand;')();
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.log('  ✗', m)); };
const t = (raw, want, link) => { const e = expand(raw); ok(e && e.t === want, raw + ' => ' + (e && e.t)); if (link) ok(e && e.href && decodeURIComponent(e.href).endsWith('?go=' + link), raw + ' 链接 ' + (e && e.href)); };
t('第7章§八·F', '命理精讲 · 教材第7章 八·F', '07-#八·F');
t('第4章§七·D⑥', '命理精讲 · 教材第4章 七·D⑥', '04-#七·D');
t('第1章§二、三', '命理精讲 · 教材第1章 二、三', '01-#二');
t('中级班 p7', '大任 15《中级班》 第7页');
t('面授 p21·例48', '大任 20《2012高级面授班彩色笔记》 第21页 · 第48例');
t('21干支互通 p18-19', '大任 21《干支互通在实际断命时的使用条件和方法》 第18–19页');
t('v课 · 第 745、746 讲', '命理精讲 · v课笔记 第745、746讲');
t('讲义 p93', '小任中级班讲义 第93页');
t('小任 · 高级第7课', '小任 高级课第7课');
// 全量：题库里所有像出处的括号都要认得出（存疑注释之类不算出处）
const all = [...new Set((s + ['drill/cases.js'].map(f => fs.readFileSync(__dirname + '/' + f, 'utf8')).join('')).match(/〔[^〔〕]{1,40}〕/g))];
const looksCite = r => !/据/.test(r) && /^(第\d+章|v课|第\s*\d+\s*讲|小任|讲义\s*p|\d*[^\s\d]{2,8}\s*p\d)/.test(r);
const miss = all.map(x => x.slice(1, -1).trim()).filter(r => looksCite(r) && !expand(r) && !/第N章|第16章 第8步/.test(r));
ok(miss.length === 0, '还有认不出的出处：' + miss.join(' | '));
console.log(fail ? `✗ 失败 ${fail} 项` : `✓ 出处展开全部通过（${pass} 项）`);
process.exit(fail ? 1 : 0);
