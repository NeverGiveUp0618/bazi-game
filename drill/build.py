#!/usr/bin/env python3
"""断盘陪练数据 → drill/cases.js（按需加载）。两个来源：
  ① 命理精讲 99-命例题库.md 的完整八字盘命例（n＝题号）
  ② 学习册新版课程笔记（公开课/初中级/高级 源文件/*.txt）里的 :::case 案例（2026-10-19 加，n 从 10001 起，src＝第几课）
     只收 @pan 四柱齐全的（性别未说且无「课上所断」的示意盘也不收）；与题库同盘的不重复收；「练习」「结论缺失」的不收
任一来源改了就重跑：python3 drill/build.py"""
import re, json, os, glob
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', 'bazi-course', 'content', '实用八字教材', '99-命例题库.md')
G = '甲乙丙丁戊己庚辛壬癸'; Z = '子丑寅卯辰巳午未申酉戌亥'
PAN = re.compile(r'\|\s*(乾|坤)\s*\|\s*([%s])\s*\|\s*([%s])\s*\|\s*([%s])\s*\|\s*([%s])\s*\|\s*\n\|\s*\|\s*([%s])\s*\|\s*([%s])\s*\|\s*([%s])\s*\|\s*([%s])\s*\|' % ((G,) * 4 + (Z,) * 4))
def plain(s):
    s = re.sub(r'<[^>]+>', '', s); s = s.replace('**', '').replace('`', '')
    s = re.sub(r'\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]', lambda m: m.group(2) or m.group(1), s)
    s = re.sub(r'^>\s?', '', s, flags=re.M)
    return re.sub(r'\n{2,}', '\n', s).strip()
def field(b, name):
    m = re.search(r'\*\*%s\*\*[：:]\s*(.+?)(?=\n\s*\n|\n\*\*|\n<details|$)' % name, b, re.S)
    return plain(m.group(1)) if m else ''
NOTES = '/Users/xiaojin/Documents/八笔记md/八字课程资料（服务器）'
def ok_gz(gz):
    return all(len(x) == 2 and x[0] in G and x[1] in Z and G.index(x[0]) % 2 == Z.index(x[1]) % 2 for x in gz)
def lesson_cases(have):
    out, seen, n = [], set(), 10000
    files = sorted(glob.glob(os.path.join(NOTES, '八字公开课', '6-新版笔记', '源文件', '*.txt'))) + \
        sorted(glob.glob(os.path.join(NOTES, '八字初中级班', '6-新版笔记', '源文件', '*.txt')), key=lambda f: int(re.search(r'(\d+)课', f).group(1))) + \
        sorted(glob.glob(os.path.join(NOTES, '八字高级班', '6-新版笔记', '源文件', '*.txt')), key=lambda f: int(re.search(r'(\d+)课', f).group(1)))
    for f in files:
        src = os.path.basename(f)[:-4]
        for m in re.finditer(r'^:::case ?(.*?)\n(.*?)^:::$', open(f, encoding='utf-8').read(), re.S | re.M):
            t, b = m.group(1).replace('⭐', '').strip(), m.group(2)
            p = re.search(r'^@pan (乾|坤|—)\|(\S\S) (\S\S) (\S\S) (\S\S)\|(.*)$', b, re.M)
            if not p or not ok_gz(p.groups()[1:5]) or re.search(r'练习|结论缺失', t): continue
            g = ''.join(x[0] for x in p.groups()[1:5]) + ''.join(x[1] for x in p.groups()[1:5])
            if g in have or g in seen: continue
            fm = lambda k: (re.search(r'\*\*%s\*\*[：:]\s*(.+?)(?=\*\*(?:反馈|推理|课上所断)\*\*|\n|$)' % k, b) or [None, ''])[1]
            d = plain(fm('课上所断')).rstrip('。')
            if not d and p.group(1) == '—': continue     # 性别都没说、也没断语的，是讲概念的示意盘，不算断命案例
            d = d or t
            body = plain(re.sub(r'^@pan.*\n?', '', b, flags=re.M))
            if len(body) > 700: body = body[:700].rstrip() + '……（全文见学习册·%s）' % src
            n += 1; seen.add(g)
            out.append({'n': n, 't': t, 'x': p.group(1), 'g': g, 'tg': [], 'd': d, 'f': plain(fm('反馈')), 'j': body, 'src': src})
    return out
def main():
    s = open(SRC, encoding='utf-8').read()
    parts = re.split(r'^### (【题(\d+)】(.*))$', s, flags=re.M)
    out = []
    for k in range(1, len(parts), 4):
        n, title, b = int(parts[k + 1]), parts[k + 2], parts[k + 3]
        m = PAN.search(b)
        if not m: continue
        g = m.groups()
        tags = re.findall(r'`([^`]+)`', title)
        title = re.sub(r'\s*`[^`]+`', '', title).strip()
        d, f = field(b, '断'), field(b, '反馈')
        jm = re.search(r'<summary>解</summary>(.*?)(?=<details>|</details>)', b, re.S)
        j = plain(jm.group(1)) if jm else ''
        if not (d or j): continue
        if len(j) > 700: j = j[:700].rstrip() + '……（全文见命理精讲·命例题库）'
        out.append({'n': n, 't': title, 'x': g[0], 'g': ''.join(g[1:]), 'tg': tags, 'd': d, 'f': f, 'j': j})
    nb = len(out); out += lesson_cases({c['g'] for c in out})
    print('  题库', nb, '例 ＋ 课程笔记', len(out) - nb, '例')
    js = 'window.DRILL=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
    open(os.path.join(HERE, 'cases.js'), 'w', encoding='utf-8').write(js)
    print('✓ drill/cases.js', len(out), '例', round(len(js) / 1024), 'KB')
if __name__ == '__main__': main()
