#!/usr/bin/env python3
"""断盘陪练数据：从命理精讲 99-命例题库.md 抽完整八字盘的命例 → drill/cases.js（按需加载）。
命例题库改了就重跑：python3 drill/build.py"""
import re, json, os
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
    js = 'window.DRILL=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
    open(os.path.join(HERE, 'cases.js'), 'w', encoding='utf-8').write(js)
    print('✓ drill/cases.js', len(out), '例', round(len(js) / 1024), 'KB')
if __name__ == '__main__': main()
