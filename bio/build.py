#!/usr/bin/env python3
"""命主生平构建脚本 —— 每次改了 bio/ 下的文件就跑：python3 bio/build.py

做三件事：
 1. 用每个案例的「年月日」三柱在 1790–1930 年间反推公历生日（月柱按节、年柱按立春，天文公式算节气）
 2. 按 PICK 里选定的生日＋性别，算大运方向与起运（三天折一年），写进 bio/meta.js
 3. 收集 bio/NNN.js 里已写好的命主，更新 index.html 的 BIO_LIST，BIO_VER 自增

⚠️ 盘是《人鉴》原盘，反推出来的日子与史载不符时**照录不改盘**，在 meta 里记 warn，页面显示「存疑」。
"""
import re, json, os, sys, datetime, math
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.argv = [sys.argv[0], os.path.join(ROOT, 'index.html')]

G = "甲乙丙丁戊己庚辛壬癸"; Z = "子丑寅卯辰巳午未申酉戌亥"
def jd(dt):
    y, m = dt.year, dt.month; d = dt.day + (dt.hour + dt.minute / 60) / 24
    if m <= 2: y -= 1; m += 12
    A = y // 100; B = 2 - A + A // 4
    return int(365.25 * (y + 4716)) + int(30.6001 * (m + 1)) + d + B - 1524.5
def sunlon(J):
    T = (J - 2451545) / 36525
    L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T
    M = math.radians(357.52911 + 35999.05029 * T - 0.0001537 * T * T)
    C = (1.914602 - 0.004817 * T) * math.sin(M) + (0.019993 - 0.000101 * T) * math.sin(2 * M) + 0.000289 * math.sin(3 * M)
    om = math.radians(125.04 - 1934.136 * T)
    return (L0 + C - 0.00569 - 0.00478 * math.sin(om)) % 360
JIE = [(285, '小寒'), (315, '立春'), (345, '惊蛰'), (15, '清明'), (45, '立夏'), (75, '芒种'),
       (105, '小暑'), (135, '立秋'), (165, '白露'), (195, '寒露'), (225, '立冬'), (255, '大雪')]
MZ = {315: 2, 345: 3, 15: 4, 45: 5, 75: 6, 105: 7, 135: 8, 165: 9, 195: 10, 225: 11, 255: 0, 285: 1}
def term_time(y, lon):
    """该年某个节的北京时间（UTC+8）"""
    t = datetime.datetime(y, 1, 1) + datetime.timedelta(days=((lon - 280) % 360) * 365.2422 / 360 - 5)
    diff = lambda t: ((sunlon(jd(t)) - lon + 180) % 360) - 180
    step = datetime.timedelta(hours=6)
    while diff(t) < 0: t += step
    a, b = t - step, t
    for _ in range(40):
        m = a + (b - a) / 2
        if diff(m) < 0: a = m
        else: b = m
    return b + datetime.timedelta(hours=8)
_J = None
def jies():
    global _J
    if _J is None:
        _J = sorted((term_time(y, l), n, l) for y in range(1788, 1933) for l, n in JIE)
    return _J
def pillars(dt):
    J = jies()
    last = [j for j in J if j[0] <= dt][-1]
    mi = MZ[last[2]]
    yy = [j for j in J if j[2] == 315 and j[0] <= dt][-1][0].year
    yg = (yy - 4) % 10
    mg = ((yg % 5) * 2 + 2 + (mi - 2) % 12) % 10
    j0 = int(jd(datetime.datetime(dt.year, dt.month, dt.day, 12)) + 0.5)
    di = (j0 + 49) % 60
    return G[yg] + Z[(yy - 4) % 12], G[mg] + Z[mi], G[di % 10] + Z[di % 12]
HOUR = {z: (0 if i == 0 else i * 2) for i, z in enumerate(Z)}   # 时支中点：子取 0 点、丑 2 点……亥 22 点

# ── 每位命主选定的生日（必须是反推结果之一）与性别 ──
# 只有一个候选的不用写；None ＝ 盘与任何日子都对不上，用 hist 里的史载生日估算起运
PICK = {
 '清孝钦太后':'1835-11-29','袁世凯':'1859-09-16','冯国璋':'1859-01-07','瞿鸿玑':'1850-07-23','赵秉钧':'1859-02-03',
 '钱能训':'1870-01-17','李纯':'1875-09-14','杨士琦':'1862-02-02','杨士骧':'1860-09-06','程璧光':'1859-06-29',
 '朱瑞':'1884-01-13','蓝天蔚':'1877-03-19','威廉第二':'1861-01-24','孙中山':'1865-11-23','徐世昌':'1855-10-23',
 '徐树铮':'1880-11-11','黎元洪':'1864-10-19','段祺瑞':'1865-03-06','王士珍':'1861-08-19','曹锟':'1862-12-12',
 '张作霖':'1875-03-19','唐继尧':'1883-08-14','卢永祥':'1867-10-22','王承斌':'1877-08-17','萨镇冰':'1859-03-30',
 '李经羲':'1859-03-20','唐绍仪':'1862-01-02','岑春煊':'1861-05-02','熊希龄':'1870-07-23','靳云鹏':'1876-10-23',
 '孙宝琦':'1867-04-26','梁士诒':'1869-05-05','张謇':'1853-07-01','汪大燮':'1859-11-21','张绍曾':'1879-10-19',
 '龚心湛':'1869-06-02','孙洪伊':'1872-11-17','吴景濂':'1873-03-18','高凌霨':'1870-09-12','周学熙':'1866-01-12',
 '陈锦涛':'1871-06-20','张弧':'1875-09-10','潘复':'1883-11-22','许世英':'1873-09-10','王郅隆':'1863-09-07',
 '朱启钤':'1872-11-22','田文烈':'1858-11-24','程克':'1885-05-21','周扶九':'1834-09-05','李根源':None,
 '齐耀珊':None,'罗文干':'1889-04-11','章炳麟':'1869-01-12','章士钊':'1881-03-20','胡适':'1891-12-17',
 '段芝贵':'1869-10-28','龙济光':'1867-06-25','王占元':'1861-02-20','朱庆澜':'1874-03-11','吴光新':'1882-06-13',
 '张作相':'1881-03-08','陈炯明':'1878-01-13','陈宦':'1870-03-16','陆锦':'1881-01-15','李厚基':'1870-03-07',
 '孙传芳':'1885-04-17','徐绍桢':'1861-06-30','韩国均':'1857-03-29','孙发绪':'1875-06-13','黄郛':'1880-03-08',
 '李鼎新':'1862-04-27','廖仲恺':'1878-04-12','田中玉':'1870-11-16','屈映光':'1883-03-14','张敬尧':'1881-09-18',
 '江朝宗':'1862-01-24','倪嗣冲':'1868-02-06','刘冠雄':'1861-06-06','彭允彝':'1878-10-13','宣统':'1906-02-07',
 '陈夔龙':'1857-05-25','郑孝胥':'1860-05-02','康有为':'1858-03-20','梅兰芳':'1894-10-22','琴雪芳':'1904-07-14',
 '陈炳焜':'1868-11-11',
}
FEMALE = {'清孝钦太后', '琴雪芳', '某女士'}
# 盘与任何日子都对不上时，用史载生日估算起运（页面会标存疑）
HIST = {'李根源': '1879-06-02'}

def main():
    src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    cases = json.loads(re.search(r'const CASES=(\[.*?\]);', src).group(1))
    # 1790–1930 每天中午的三柱 → 日期
    table = {}
    d = datetime.datetime(1790, 3, 1, 12)
    while d.year <= 1930:
        table.setdefault(pillars(d), []).append(d.date()); d += datetime.timedelta(days=1)
    meta, errs = {}, []
    for idx, c in enumerate(cases):
        n = re.sub(r'^\d+\.', '', c['n']); b = c['b']
        hits = [str(x) for x in table.get((b[0] + b[4], b[1] + b[5], b[2] + b[6]), [])]
        hg = G[((G.index(b[2]) % 5) * 2 + Z.index(b[7])) % 10]
        m = {'no': idx + 1, 'sex': '女' if n in FEMALE else '男', 'hits': hits, 'warn': []}
        if hg != b[3]: m['warn'].append(f'时干与五鼠遁不合：{b[2]}日{b[7]}时应为{hg}{b[7]}，原盘作{b[3]}{b[7]}，照录未改')
        pick = PICK.get(n, hits[0] if len(hits) == 1 else '')
        if pick is None:
            m['warn'].append(('年月日三柱只对应 ' + '、'.join(hits) + '，与命主实际生年不合' if hits else '年月日三柱在 1790–1930 年间找不到对应日子') + '（日柱与年月对不上），起运无法精算')
            pick = HIST.get(n)
            m['est'] = True
        elif pick not in hits:
            errs.append(f'{n}: PICK {pick} 不在反推结果 {hits} 里'); continue
        if pick:
            bd = datetime.datetime.fromisoformat(pick) + datetime.timedelta(hours=HOUR[b[7]])
            yang = G.index(b[0]) % 2 == 0
            fwd = (yang and m['sex'] == '男') or (not yang and m['sex'] == '女')
            J = jies()
            j = [x for x in J if x[0] > bd][0] if fwd else [x for x in J if x[0] <= bd][-1]
            days = abs((j[0] - bd).total_seconds()) / 86400
            st = bd + datetime.timedelta(days=days * 365.2422 / 3)
            yrs = days / 3; Y = int(yrs); M = int(round((yrs - Y) * 12))
            if M == 12: Y += 1; M = 0
            m.update(d=pick, fwd=fwd, jie=j[1], jt=j[0].strftime('%Y-%m-%d %H:%M'), days=round(days, 1),
                     age=f'{Y}岁{M}个月' if M else f'{Y}岁', start={'y': st.year, 'm': st.month})
        meta[n] = m
    if errs: print('\n'.join(errs)); sys.exit(1)
    # 已写好的生平文件
    done = []
    for f in sorted(os.listdir(HERE)):
        if re.fullmatch(r'\d{3}\.js', f):
            t = open(os.path.join(HERE, f), encoding='utf-8').read()
            k = re.search(r"BIO_PUT\('([^']+)'", t).group(1)
            if k not in meta: errs.append(f'{f}: 键「{k}」不在 CASES 里')
            elif meta[k]['no'] != int(f[:3]): errs.append(f'{f}: 文件号与案例号 {meta[k]["no"]} 不符')
            done.append(k)
    if errs: print('\n'.join(errs)); sys.exit(1)
    out = '/* 自动生成：python3 bio/build.py —— 别手改 */\nwindow.BIO_META=' + json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + ';\n'
    open(os.path.join(HERE, 'meta.js'), 'w', encoding='utf-8').write(out)
    done.sort(key=lambda k: meta[k]['no'])
    s2 = re.sub(r"const BIO_LIST=\[[^\]]*\];", 'const BIO_LIST=' + json.dumps(done, ensure_ascii=False) + ';', src, count=1)
    s2 = re.sub(r'const BIO_VER=(\d+);', lambda mm: f'const BIO_VER={int(mm.group(1)) + 1};', s2, count=1)
    assert len(s2) > len(src) * 0.9
    open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(s2)
    print(f'meta {len(meta)} 人；已写生平 {len(done)} 人')
    for k, v in meta.items():
        if v['warn'] or v.get('est'): print(' ⚠', k, '；'.join(v['warn']))
if __name__ == '__main__': main()
