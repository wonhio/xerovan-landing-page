# Generates en/index.html and kr/index.html from the original single-page site.
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / "_original.html").read_text(encoding="utf-8")
SITE = "https://www.xerovan.com"

def must(html, old, new, count=None):
    n = html.count(old)
    if n == 0:
        sys.exit(f"NOT FOUND: {old[:80]!r}")
    if count is not None and n != count:
        sys.exit(f"COUNT {n} != {count}: {old[:80]!r}")
    return html.replace(old, new)

def must_re(html, pattern, new, flags=re.S):
    out, n = re.subn(pattern, lambda m: new, html, count=1, flags=flags)
    if n == 0:
        sys.exit(f"REGEX NOT FOUND: {pattern[:80]!r}")
    return out

# ---------------------------------------------------------------- common
# url code -> (hreflang, og locale, native label, short label)
LANGS = {
    "en": ("en", "en_US", "English", "EN"),
    "kr": ("ko", "ko_KR", "한국어", "KR"),
    "ja": ("ja", "ja_JP", "日本語", "JA"),
    "es": ("es", "es_ES", "Español", "ES"),
    "ar": ("ar", "ar_AE", "العربية", "AR"),
    "pt": ("pt", "pt_BR", "Português", "PT"),
}
BLOG_LABEL = {"en": "Blog", "kr": "블로그", "ja": "ブログ", "es": "Blog", "ar": "المدونة", "pt": "Blog"}

VERCEL_ANALYTICS = '''  <!-- Vercel Web Analytics -->
  <script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
  <script defer src="/_vercel/insights/script.js"></script>
'''

LEGAL_SLUGS = ["terms", "privacy", "refund", "risk-disclosure", "compliance"]
LEGAL_NAMES_EN = ["Terms & Conditions", "Privacy Policy", "Refund Policy", "Risk Disclosure", "Compliance"]
LEGAL_NAMES_KR = ["이용약관", "개인정보 처리방침", "환불 정책", "위험 고지", "컴플라이언스"]
LATEST = {
    "en": ("Blog", "Guides and updates from the Xerovan team.", "View all posts"),
    "kr": ("블로그", "Xerovan 팀이 전하는 가이드와 소식.", "전체 글 보기"),
    "ja": ("ブログ", "Xerovanチームによるガイドとお知らせ。", "すべての記事を見る"),
    "es": ("Blog", "Guías y novedades del equipo de Xerovan.", "Ver todos los artículos"),
    "ar": ("المدونة", "أدلة وتحديثات من فريق Xerovan.", "عرض جميع المقالات"),
    "pt": ("Blog", "Guias e novidades da equipe Xerovan.", "Ver todos os artigos"),
}
WEBP = ["hero-visual", "ecosystem-visual"] + [f"feature-0{i}" for i in range(1, 10)] + [f"usecase-0{i}" for i in range(1, 7)]

MOBILE_CSS = """  .nav-end{display:flex;align-items:center;gap:10px;}
  .menu-btn{display:none;width:40px;height:40px;border:1px solid var(--line);border-radius:100px;background:transparent;color:var(--silver-300);cursor:pointer;align-items:center;justify-content:center;flex-direction:column;gap:4px;padding:0;}
  .menu-btn span{display:block;width:16px;height:1.5px;background:currentColor;border-radius:2px;transition:transform .2s ease, opacity .2s ease;}
  .menu-btn[aria-expanded="true"] span:nth-child(1){transform:translateY(5.5px) rotate(45deg);}
  .menu-btn[aria-expanded="true"] span:nth-child(2){opacity:0;}
  .menu-btn[aria-expanded="true"] span:nth-child(3){transform:translateY(-5.5px) rotate(-45deg);}
  .menu-btn:hover,.menu-btn[aria-expanded="true"]{color:var(--silver-100);border-color:var(--silver-500);}
  .mobile-menu{display:flex;flex-direction:column;padding:6px 16px 14px;border-top:1px solid var(--line);background:rgba(10,11,13,0.97);}
  .mobile-menu[hidden]{display:none;}
  .mobile-menu a{padding:15px 8px;font-size:15px;font-weight:600;color:var(--silver-300);border-bottom:1px solid var(--line-soft);}
  .mobile-menu a:last-child{border-bottom:none;}
  .mobile-menu a:hover,.mobile-menu a[aria-current="page"]{color:var(--silver-100);}
  @media(max-width:920px){ .menu-btn{display:flex;} }
  @media(min-width:921px){ .mobile-menu{display:none !important;} }
  @media(max-width:600px){ nav{padding:12px 16px;} }
  @media(max-width:380px){ .brand img.brand-word-img{height:15px;} .brand{gap:8px;} }
"""
MOBILE_JS = """  /* Mobile menu (☰) */
  (function () {
    var b = document.querySelector('.menu-btn'), m = document.getElementById('mobileMenu');
    if (!b || !m) return;
    function set(open) { m.hidden = !open; b.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    b.addEventListener('click', function (e) { e.stopPropagation(); set(m.hidden); var l = document.querySelector('.lang-menu'); if (l) l.open = false; });
    m.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    document.addEventListener('click', function (e) { if (!m.hidden && !m.contains(e.target) && !b.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  })();
"""
MENU_LABEL = {'en': 'Menu', 'kr': '메뉴', 'ja': 'メニュー', 'es': 'Menú', 'ar': 'القائمة', 'pt': 'Menu'}
MENU_BTN = '<button type="button" class="menu-btn" aria-label="{label}" aria-expanded="false" aria-controls="mobileMenu"><span></span><span></span><span></span></button>'

PAGE_TITLE = {
    "en": "Xerovan — Crypto Wallet & Visa Card for Global Payments",
    "kr": "Xerovan — 크립토 지갑과 Visa 카드로 해외결제·여행까지",
    "ja": "Xerovan — 暗号資産ウォレットとVisaカードで海外決済・旅行まで",
    "es": "Xerovan — Billetera cripto y tarjeta Visa para pagos globales",
    "ar": "Xerovan — محفظة عملات مشفرة وبطاقة Visa للمدفوعات العالمية",
    "pt": "Xerovan — Carteira cripto e cartão Visa para pagamentos globais",
}

OG_TITLE = {
    "en": "Xerovan — Value in Motion",
    "kr": "Xerovan — 지갑·결제·리워드·여행을 하나로",
    "ja": "Xerovan — ウォレット・決済・リワード・旅行をひとつに",
    "es": "Xerovan — Wallets, pagos, recompensas y viajes en un solo lugar",
    "ar": "Xerovan — المحافظ والمدفوعات والمكافآت والسفر في مكان واحد",
    "pt": "Xerovan — Carteiras, pagamentos, recompensas e viagens em um só lugar",
}

def common(html, lang, legal_names=None):
    hl, loc, _, short = LANGS[lang]
    html = html.replace('"images/', '"/images/')
    html = must(html, '</head>', VERCEL_ANALYTICS + '</head>', 1)
    names = legal_names or LEGAL_NAMES_EN
    html = must(html, '<li><a href="#">Terms & Conditions</a></li><li><a href="#">Privacy Policy</a></li><li><a href="#">Refund Policy</a></li><li><a href="#">Risk Disclosure</a></li><li><a href="#">Compliance</a></li>',
        "".join(f'<li><a href="/{lang}/legal/{sl}">{nm}</a></li>' for sl, nm in zip(LEGAL_SLUGS, names)))
    # footer legal links are real pages now: stop the script from replacing them with modal buttons
    html = must_re(html, r"  fetch\(LEGAL_SHEET_URL\).*?\.catch\(\(\) => \{ renderLegalLinks\(legalDataFallback\); \}\);\n",
        "  /* Legal documents are served as pages at /{lang}/legal/{doc} (rendered from the same sheet). */\n")
    lt = LATEST[lang]
    html = must(html, '<section class="cta-band" id="waitlist">',
        f'''<section id="latest" class="latest" hidden>
  <div class="wrap">
    <div class="section-head center">
      <span class="eyebrow center">{lt[0]}</span>
      <h2>{lt[1]}</h2>
    </div>
    <div class="latest-grid" id="latestGrid"></div>
    <div class="latest-more"><a href="/{lang}/blog" class="btn-ghost">{lt[2]}</a></div>
  </div>
</section>

<section class="cta-band" id="waitlist">''')
    html = must(html, "  .cta-band{", """  .latest{padding:100px 0;}
  .latest-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
  @media(max-width:900px){ .latest-grid{grid-template-columns:1fr;} }
  .latest-card{display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;transition:border-color .2s ease, transform .2s ease;}
  .latest-card:hover{border-color:var(--silver-700);transform:translateY(-2px);}
  .latest-card .lc-thumb{aspect-ratio:16/9;background:linear-gradient(160deg,#2a2c31,#131417 60%,#1b1d21);}
  .latest-card .lc-thumb img{width:100%;height:100%;object-fit:cover;}
  .latest-card .lc-body{padding:20px 22px 24px;display:flex;flex-direction:column;gap:10px;}
  .latest-card .lc-meta{font-family:'JetBrains Mono';font-size:11px;color:var(--text-dim);letter-spacing:0.04em;}
  .latest-card h3{font-family:'Unbounded';font-size:15px;font-weight:600;line-height:1.4;}
  .latest-card p{font-size:13.5px;color:var(--silver-500);line-height:1.6;}
  .latest-more{text-align:center;margin-top:36px;}
  .cta-band{""")
    html = must(html, '  /* Google Sheet waitlist webhook (Apps Script Web App) */', f"""  /* Latest blog posts (hidden until at least one post exists) */
  fetch('/{lang}/blog/latest.json').then(function (r) {{ return r.ok ? r.json() : []; }}).then(function (posts) {{
    if (!posts || !posts.length) return;
    var grid = document.getElementById('latestGrid');
    posts.forEach(function (p) {{
      var a = document.createElement('a'); a.className = 'latest-card'; a.href = p.url;
      var th = document.createElement('div'); th.className = 'lc-thumb';
      if (p.image) {{ var im = document.createElement('img'); im.src = p.image; im.alt = p.title; im.loading = 'lazy'; im.decoding = 'async'; th.appendChild(im); }}
      var body = document.createElement('div'); body.className = 'lc-body';
      var meta = document.createElement('div'); meta.className = 'lc-meta'; meta.textContent = [p.topic, p.date].filter(Boolean).join(' · ');
      var h = document.createElement('h3'); h.textContent = p.title;
      var ex = document.createElement('p'); ex.textContent = p.excerpt;
      body.appendChild(meta); body.appendChild(h); body.appendChild(ex);
      a.appendChild(th); a.appendChild(body); grid.appendChild(a);
    }});
    document.getElementById('latest').hidden = false;
  }}).catch(function () {{}});

  /* Google Sheet waitlist webhook (Apps Script Web App) */""")
    html = must(html, 'content="Xerovan — Value in Motion"', f'content="{OG_TITLE[lang]}"', 2)  # og:title + twitter:title
    html = must(html, '<html lang="en">',
                f'<html lang="{hl}"' + (' dir="rtl"' if lang == "ar" else '') + '>')

    alts = "".join(f'\n    <link rel="alternate" hreflang="{v[0]}" href="{SITE}/{k}/">' for k, v in LANGS.items())
    html = must(html, '<link rel="canonical" href="https://www.xerovan.com/">',
        f'<link rel="canonical" href="{SITE}/{lang}/">{alts}\n'
        f'    <link rel="alternate" hreflang="x-default" href="{SITE}/en/">')
    og_alts = "".join(f'\n    <meta property="og:locale:alternate" content="{v[1]}">' for k, v in LANGS.items() if k != lang)
    html = must(html, '<meta property="og:url" content="https://www.xerovan.com/">',
        f'<meta property="og:url" content="{SITE}/{lang}/">\n'
        f'    <meta property="og:locale" content="{loc}">{og_alts}')

    items = "".join(
        f'\n        <a href="/{k}/" data-lang="{k}" hreflang="{v[0]}" lang="{v[0]}"'
        + (' aria-current="true"' if k == lang else '') + f'>{v[2]}</a>'
        for k, v in LANGS.items())
    html = must(html, '<a href="#faq">FAQ</a>\n    </div>\n  </nav>',
        '<a href="#faq">FAQ</a>\n'
        f'      <a href="/{lang}/blog">{BLOG_LABEL[lang]}</a>\n'
        '    </div>\n'
        '    <details class="lang-menu">\n'
        f'      <summary aria-label="Language">{short}</summary>\n'
        f'      <div class="lang-list">{items}\n      </div>\n'
        '    </details>\n  </nav>')
    html = must(html, '  @media(max-width:920px){ .nav-links{display:none;} }',
        '  @media(max-width:920px){ .nav-links{display:none;} }\n'
        "  .lang-menu{position:relative;}\n"
        "  .lang-menu summary{list-style:none; cursor:pointer; display:flex; align-items:center; gap:8px; padding:8px 14px; border:1px solid var(--line); border-radius:100px; font-family:'JetBrains Mono',monospace; font-size:11.5px; letter-spacing:0.1em; color:var(--silver-300);}\n"
        "  .lang-menu summary::-webkit-details-marker{display:none;}\n"
        "  .lang-menu summary::before{content:''; width:13px; height:13px; border:1.4px solid currentColor; border-radius:50%; box-shadow:inset 0 0 0 3px var(--void), inset 0 0 0 4.4px currentColor; opacity:.8;}\n"
        "  .lang-menu summary::after{content:'▾'; font-size:10px; opacity:.7;}\n"
        "  .lang-menu[open] summary, .lang-menu summary:hover{color:var(--silver-100); border-color:var(--silver-500);}\n"
        "  .lang-list{position:absolute; top:calc(100% + 8px); inset-inline-end:0; min-width:170px; padding:6px; background:var(--panel); border:1px solid var(--line); border-radius:12px; box-shadow:0 24px 60px -20px rgba(0,0,0,.7); display:flex; flex-direction:column;}\n"
        "  .lang-list a{padding:10px 14px; border-radius:8px; font-size:14px; color:var(--silver-300); font-family:'Inter','Noto Sans KR','Noto Sans JP','Noto Sans Arabic',sans-serif;}\n"
        "  .lang-list a:hover{background:var(--panel-2); color:var(--silver-100);}\n"
        "  .lang-list a[aria-current=\"true\"]{color:var(--ice);}")

    html = must(html, '<li><a href="#faq">FAQ</a></li>',
        f'<li><a href="#faq">FAQ</a></li><li><a href="/{lang}/blog">{BLOG_LABEL[lang]}</a></li>')

    html = must(html, '  /* Google Sheet waitlist webhook (Apps Script Web App) */',
        "  document.querySelectorAll('.lang-list a').forEach(function(a){\n"
        "    a.addEventListener('click', function(){\n"
        "      document.cookie = 'xv_lang=' + a.dataset.lang + '; path=/; max-age=31536000; SameSite=Lax';\n"
        "    });\n"
        "  });\n"
        "  document.addEventListener('click', function(e){\n"
        "    var m = document.querySelector('.lang-menu');\n"
        "    if (m && m.open && !m.contains(e.target)) m.open = false;\n"
        "  });\n\n"
        '  /* Google Sheet waitlist webhook (Apps Script Web App) */')

    html = must(html, "body: 'email=' + encodeURIComponent(email)",
        f"body: 'email=' + encodeURIComponent(email) + '&lang={lang}'")
    html = must(html, "  fetch(FAQ_SHEET_URL)\n",
        "  (FAQ_SHEET_URL ? fetch(FAQ_SHEET_URL) : Promise.reject(new Error('no sheet')))\n")
    return html

import html as _html, json as _json, subprocess as _sp

def _js_array(page, name):
    """Evaluate a JS array literal declared in the page (const NAME = [...];) with node -> Python data."""
    m = re.search(r"const " + name + r" = (\[.*?\n  \]);", page, re.S)
    assert m, f"{name} not found"
    out = _sp.run(["node", "-e", "process.stdout.write(JSON.stringify(eval(require('fs').readFileSync(0,'utf8'))))"],
                  input=m.group(1), capture_output=True, text=True, check=True)
    return _json.loads(out.stdout)

def prerender(page):
    """Write FAQ, use cases and the summary table into the HTML so crawlers see them without running scripts.
    The page scripts still rebuild these blocks on load (FAQ from the sheet), clearing the pre-rendered copy first."""
    e = lambda x: _html.escape(str(x), quote=True)
    faq = _js_array(page, "faqDataFallback")
    faq_html = "".join(f'<div class="faq-item"><button class="faq-q" aria-expanded="false"><span>{e(f["q"])}</span><span class="plus">+</span></button><div class="faq-a"><p>{e(f["a"])}</p></div></div>' for f in faq)
    page = must(page, '<div class="faq-list" id="faqList"></div>', f'<div class="faq-list" id="faqList">{faq_html}</div>')

    lab_common = re.search(r'<span class="tag-label">([^<]+)</span>\s*<ul>\$\{uc\.items', page).group(1)
    lab_typical = re.search(r'const tagsHtml = uc\.tags \? `<span class="tag-label">([^<]+)</span>', page).group(1)
    lab_value = re.search(r'<div class="uc-key-value">([^$]*)\$\{uc\.value\}', page).group(1)
    ucs = _js_array(page, "useCaseData")
    items = []
    for i, uc in enumerate(ucs):
        tags = (f'<span class="tag-label">{e(lab_typical)}</span><div class="tag-row">' + "".join(f'<span class="tag">{e(t)}</span>' for t in uc["tags"]) + "</div>") if uc.get("tags") else ""
        img = f'<img src="{e(uc["image"])}" alt="{e(uc["title"])}" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">' if uc.get("image") else ""
        items.append(
            f'<div class="uc-item"><button class="uc-head" aria-expanded="false"><span class="uc-num">0{i+1}</span>'
            f'<span class="uc-head-text"><h3>{e(uc["title"])}</h3><p>{e(uc["tag"])}</p></span><span class="uc-plus">+</span></button>'
            f'<div class="uc-body"><div class="uc-body-inner"><div><p class="lede">{e(uc["lede"])}</p>'
            f'<span class="tag-label">{e(lab_common)}</span><ul>' + "".join(f"<li>{e(it)}</li>" for it in uc["items"]) + "</ul>"
            f'{tags}<div class="uc-key-value">{e(lab_value)}{e(uc["value"])}</div></div>'
            f'<div class="uc-visual" style="padding:0; overflow:hidden;">{img}</div></div></div></div>')
    page = must(page, '<div class="uc-list" id="ucList"></div>', '<div class="uc-list" id="ucList">' + "".join(items) + "</div>")
    rows = _js_array(page, "summaryTable")
    page = must(page, '<tbody id="ucTableBody"></tbody>', '<tbody id="ucTableBody">' + "".join("<tr>" + "".join(f"<td>{e(c)}</td>" for c in r) + "</tr>" for r in rows) + "</tbody>")
    # the scripts append on load: clear the pre-rendered copies first so nothing is duplicated
    page = must(page, "  const ucList = document.getElementById('ucList');\n", "  const ucList = document.getElementById('ucList');\n  ucList.innerHTML = '';\n")
    page = must(page, "  const ucTableBody = document.getElementById('ucTableBody');\n", "  const ucTableBody = document.getElementById('ucTableBody');\n  ucTableBody.innerHTML = '';\n")
    return page

import importlib.util as _ilu
_spec = _ilu.spec_from_file_location("summary", ROOT / "_build" / "summary.py"); SUM = _ilu.module_from_spec(_spec); _spec.loader.exec_module(SUM)

def restructure(html, lang):
    """Remove the app preview; replace Summary + Features with one continuous Features section;
    nav 'Summary' becomes 'Home' (#top); add the site-wide crypto background."""
    html, n = re.subn(r'<section class="app-preview" id="appPreview">.*?</section>\n\n', '', html, flags=re.S); assert n == 1
    html, n = re.subn(r'<section id="summary">.*?</section>\n\n<div class="divider" id="dividerBars2"></div>\n\n', '', html, flags=re.S); assert n == 1
    html, n = re.subn(r'<section id="features">.*?</section>', lambda m: SUM.section(lang), html, flags=re.S); assert n == 1
    html, n = re.subn(r'<a href="#summary">[^<]*</a>', f'<a href="#top">{SUM.HOME[lang]}</a>', html); assert n >= 1
    # "Explore the app" -> app download (store by device, or the download panel); drop the old scroll handler
    html, n = re.subn(r"  document.getElementById\('exploreBtn'\).addEventListener\('click', \(\) => \{\n    document.getElementById\('appPreview'\).scrollIntoView\([^\n]*\n  \}\);\n", "", html); assert n == 1
    html = html.replace('<a href="#" class="store-badge">', '<a href="#" class="store-badge" data-store="ios">', 1)
    html = html.replace('<a href="#" class="store-badge">', '<a href="#" class="store-badge" data-store="android">', 1)
    assert 'data-store="android"' in html
    badges = re.search(r'<div class="store-badges">\s*(.*?)\s*</div>\n      </div>', html, re.S).group(1)
    modal_badges = re.sub(r' data-store="[a-z]+"', '', badges)
    if not (SUM.APP_STORE_URL or SUM.PLAY_STORE_URL):
        modal_badges = modal_badges.replace('class="store-badge"', 'class="store-badge soon" aria-disabled="true"')
    html = must(html, "</body>", SUM.app_modal(lang, modal_badges) + "\n</body>", 1)
    html = must(html, '  /* Google Sheet waitlist webhook (Apps Script Web App) */', SUM.app_js() + '\n  /* Google Sheet waitlist webhook (Apps Script Web App) */', 1)
    html = must(html, "  .latest{padding:100px 0;}", SUM.CSS + SUM.SITE_BG_CSS + SUM.APP_CSS + "  .latest{padding:100px 0;}")
    return html

def drop_usecase_extras(html):
    """Remove the summary table and the closing band under Use Cases (and the script that filled the table)."""
    html, n = re.subn(r'\s*<div class="uc-table-wrap">.*?</table>\s*</div>', '', html, flags=re.S); assert n == 1
    html, n = re.subn(r'\s*<div class="closing-band">.*?<div class="tagline">[^<]*</div>\s*</div>', '', html, flags=re.S); assert n == 1
    html, n = re.subn(r"  const ucTableBody = document.getElementById\('ucTableBody'\);\n  ucTableBody.innerHTML = '';\n  summaryTable.forEach\(row => \{.*?\n  \}\);\n", '', html, flags=re.S); assert n == 1
    return html

def finalize(html, lang):
    html = restructure(html, lang)
    # hide footer links that have no destination yet (Company column, Fees)
    # Company column: keep only "About Us" (now a real page), drop Careers / Partners until they exist
    html, n = re.subn(r'<div class="footer-col"><h5>([^<]*)</h5><ul><li><a href="#">([^<]*)</a></li>(?:<li><a href="#">[^<]*</a></li>){2}</ul></div>',
                      lambda m: f'<div class="footer-col"><h5>{m.group(1)}</h5><ul><li><a href="/{lang}/about">{m.group(2)}</a></li></ul></div>', html)
    assert n == 1, "company column not found"
    html = must(html, '"logo":"https://www.xerovan.com/images/logo-icon.png",',
                '"logo":"https://www.xerovan.com/images/logo-icon.png","email":"hello@xerovan.com","address":{"@type":"PostalAddress","addressLocality":"Dubai","addressCountry":"AE"},"founder":{"@type":"Person","name":"Jay Yoon","url":"https://www.xerovan.com/' + lang + '/about"},')
    html, n = re.subn(r'<li><a href="#">[^<]*</a></li>', '', html)
    assert n == 1, "fees link not found"
    for name in WEBP:
        html = html.replace(f'/images/{name}.jpg', f'/images/{name}.webp')
    html = re.sub(r'<img src="(/images/(?:feature|ecosystem)[^"]*)"', r'<img loading="lazy" decoding="async" src="\1"', html)
    html = html.replace('<img src="${uc.image}" alt="${uc.title}" style=', '<img src="${uc.image}" alt="${uc.title}" loading="lazy" decoding="async" style=')
    html = must_re(html, r"<title>[^<]*</title>", f"<title>{PAGE_TITLE[lang]}</title>")
    website = {"@context": "https://schema.org", "@type": "WebSite", "name": "Xerovan", "alternateName": "XEROVAN",
               "url": "https://www.xerovan.com/", "inLanguage": LANGS[lang][0]}
    html = must(html, '<link rel="preconnect" href="https://fonts.googleapis.com">',
                '<script type="application/ld+json">' + _json.dumps(website, ensure_ascii=False) + '</script>\n<link rel="preconnect" href="https://fonts.googleapis.com">')
    # mobile menu: ☰ button beside the language menu, opening the same links as the desktop nav
    links = re.search(r'<div class="nav-links">\n(.*?)\n    </div>', html, re.S).group(1)
    html = must(html, '    <details class="lang-menu">', '    <div class="nav-end">\n    <details class="lang-menu">', 1)
    html = must(html, '    </details>\n  </nav>\n</header>',
                '    </details>\n    ' + MENU_BTN.format(label=MENU_LABEL[lang]) + '\n    </div>\n  </nav>\n'
                '  <div class="mobile-menu" id="mobileMenu" hidden>\n' + links + '\n  </div>\n</header>', 1)
    html = must(html, '  .lang-menu{position:relative;}', MOBILE_CSS + '  .lang-menu{position:relative;}', 1)
    html = must(html, '  /* Google Sheet waitlist webhook (Apps Script Web App) */', MOBILE_JS + '\n  /* Google Sheet waitlist webhook (Apps Script Web App) */', 1)
    return drop_usecase_extras(prerender(html))

en = finalize(common(src, "en"), "en")

# ---------------------------------------------------------------- Korean
kr = common(src, "kr", LEGAL_NAMES_KR)

# Korean-capable fonts + line breaking
kr = must(kr, "family=JetBrains+Mono:wght@400;500&display=swap",
          "family=JetBrains+Mono:wght@400;500&family=Noto+Sans+KR:wght@400;500;600;700&display=swap")
kr = kr.replace("'Unbounded'", "'Unbounded','Noto Sans KR'")
kr = kr.replace("'Inter'", "'Inter','Noto Sans KR'")
kr = kr.replace("font-family:'JetBrains Mono'", "font-family:'JetBrains Mono','Noto Sans KR'")
kr = must(kr, "  ::selection{", "  body{word-break:keep-all; overflow-wrap:anywhere;}\n  ::selection{")

R = [
 # head
 ('<title>Xerovan — Value in Motion</title>', '<title>Xerovan — Value in Motion | 지갑·결제·리워드·여행을 하나로</title>'),
 ('Xerovan brings your wallets, payments, rewards, travel, and business spending together in one secure platform.',
  'Xerovan은 지갑, 결제, 리워드, 여행, 비즈니스 지출을 하나의 안전한 플랫폼으로 연결합니다.'),
 ('Manage crypto, spend globally with a Visa card, earn rewards, and book travel — all in one secure platform.',
  '암호화폐 관리부터 Visa 카드 글로벌 결제, 리워드 적립, 여행 예약까지 — 하나의 안전한 플랫폼에서.'),
 ('Xerovan is a technology platform that brings crypto wallets, payments, rewards, travel, and business spending together in one secure app.',
  'Xerovan은 암호화폐 지갑, 결제, 리워드, 여행, 비즈니스 지출을 하나의 안전한 앱으로 연결하는 기술 플랫폼입니다.'),
 # nav / hero
 ('<a href="#summary">Summary</a>', '<a href="#summary">개요</a>'),
 ('<a href="#features">Features</a>', '<a href="#features">기능</a>'),
 ('<a href="#usecases">Use Cases</a>', '<a href="#usecases">활용 사례</a>'),
 ('<a href="#waitlist" class="btn-primary">Join the Waitlist</a>', '<a href="#waitlist" class="btn-primary">대기자 명단 등록</a>'),
 ('<button type="submit" class="btn-primary">Join the Waitlist</button>', '<button type="submit" class="btn-primary">대기자 명단 등록</button>'),
 ('Explore the app</button>', '앱 둘러보기</button>'),
 ('One Wallet. Endless Possibilities. Manage digital assets, pay globally, and unlock real-world utility.',
  '하나의 지갑, 무한한 가능성. 디지털 자산을 관리하고, 전 세계에서 결제하고, 실생활에서 활용하세요.'),
 ('title="Xerovan live app preview"', 'title="Xerovan 앱 실시간 미리보기"'),
 # summary
 ('<span class="eyebrow center">WHY XEROVAN</span>', '<span class="eyebrow center">왜 XEROVAN인가</span>'),
 ('Crypto should do more than sit in a wallet.', '암호화폐는 지갑 속에만 머물러선 안 됩니다.'),
 ('Xerovan connects the entire journey — from holding and managing digital assets to spending, traveling, and running a business.',
  'Xerovan은 디지털 자산의 보유·관리부터 결제, 여행, 비즈니스 운영까지 전 과정을 하나로 연결합니다.'),
 ('<span class="flow-step">Manage</span>', '<span class="flow-step">관리</span>'),
 ('<span class="flow-step">Swap</span>', '<span class="flow-step">스왑</span>'),
 ('<span class="flow-step">Spend</span>', '<span class="flow-step">결제</span>'),
 ('<span class="flow-step">Earn</span>', '<span class="flow-step">수익</span>'),
 ('<span class="flow-step">Travel</span>', '<span class="flow-step">여행</span>'),
 ('<li>Bring multiple crypto wallets together</li>', '<li>여러 암호화폐 지갑을 한곳에서 관리</li>'),
 ('<li>Manage assets across supported blockchain networks</li>', '<li>지원되는 여러 블록체인 네트워크의 자산 관리</li>'),
 ('<li>Swap and bridge assets with fewer steps</li>', '<li>더 적은 단계로 자산 스왑 및 브리지</li>'),
 ('<li>Spend globally with virtual and physical Visa cards</li>', '<li>가상·실물 Visa 카드로 전 세계 어디서나 결제</li>'),
 ('<li>Access yield, staking, cashback, and referral rewards</li>', '<li>이자, 스테이킹, 캐시백, 추천 리워드 이용</li>'),
 ('<li>Book flights, hotels, activities, and eSIM services</li>', '<li>항공권, 호텔, 액티비티, eSIM 예약</li>'),
 ('<li>Control business cards and team expenses</li>', '<li>법인 카드와 팀 지출 관리</li>'),
 ('<span class="eyebrow center">THE XEROVAN ECOSYSTEM</span>', '<span class="eyebrow center">XEROVAN 에코시스템</span>'),
 ('Everything Connected. Nothing Fragmented.', '모든 것이 연결되고, 흩어지는 것은 없습니다.'),
 ('Five essential product pillars, brought together in one seamless ecosystem.', '다섯 가지 핵심 서비스를 하나의 매끄러운 에코시스템으로 통합했습니다.'),
 ('<h4>Digital Asset Management</h4>', '<h4>디지털 자산 관리</h4>'),
 ('<li>Unified multi-wallet management</li>', '<li>통합 멀티 지갑 관리</li>'),
 ('<li>Self-custodial MPC wallet</li>', '<li>셀프 커스터디 MPC 지갑</li>'),
 ('<li>Multi-chain asset support</li>', '<li>멀티체인 자산 지원</li>'),
 ('<li>Smart crypto swaps</li>', '<li>스마트 크립토 스왑</li>'),
 ('<li>Cross-chain bridging</li>', '<li>크로스체인 브리징</li>'),
 ('<h4>Global Payments</h4>', '<h4>글로벌 결제</h4>'),
 ('<li>Virtual and physical Visa cards</li>', '<li>가상·실물 Visa 카드</li>'),
 ('<li>Xerovan Balance</li>', '<li>Xerovan 잔액</li>'),
 ('<li>Apple Pay and Google Pay</li>', '<li>Apple Pay·Google Pay</li>'),
 ('<li>Global Visa acceptance</li>', '<li>전 세계 Visa 가맹점 결제</li>'),
 ('<li>Personal and business spending controls</li>', '<li>개인·비즈니스 지출 관리</li>'),
 ('<h4>Earn and Rewards</h4>', '<h4>수익 및 리워드</h4>'),
 ('<li>Stablecoin yield opportunities</li>', '<li>스테이블코인 이자 상품</li>'),
 ('<li>Crypto staking</li>', '<li>크립토 스테이킹</li>'),
 ('<li>Cashback rewards</li>', '<li>캐시백 리워드</li>'),
 ('<li>User reward programs</li>', '<li>사용자 리워드 프로그램</li>'),
 ('<li>Referral rewards</li>', '<li>추천 리워드</li>'),
 ('<h4>Travel and Lifestyle</h4>', '<h4>여행 및 라이프스타일</h4>'),
 ('<li>Flights</li>', '<li>항공권</li>'),
 ('<li>Hotels</li>', '<li>호텔</li>'),
 ('<li>Tours and activities</li>', '<li>투어 및 액티비티</li>'),
 ('<li>eSIM services</li>', '<li>eSIM 서비스</li>'),
 ('<li>Trateria-powered Travel Marketplace</li>', '<li>Trateria 기반 여행 마켓플레이스</li>'),
 ('<h4>Business and Security</h4>', '<h4>비즈니스 및 보안</h4>'),
 ('<li>Business cards</li>', '<li>법인 카드</li>'),
 ('<li>Expense management</li>', '<li>경비 관리</li>'),
 ('<li>Transaction approval workflows</li>', '<li>거래 승인 워크플로</li>'),
 ('<li>Team spending controls</li>', '<li>팀 지출 관리</li>'),
 ('<li>MPC wallet security</li>', '<li>MPC 지갑 보안</li>'),
 ('<li>Device and transaction verification</li>', '<li>기기 및 거래 인증</li>'),
 ('alt="Xerovan card and app connected globally"', 'alt="전 세계와 연결된 Xerovan 카드와 앱"'),
 # features header
 ('<span class="eyebrow center">FEATURES</span>', '<span class="eyebrow center">기능</span>'),
 ('One Platform. Every Move.', '하나의 플랫폼, 모든 움직임.'),
 ('Nine capabilities, built to move your assets as easily as sound moves through the air.',
  '소리가 공기를 타고 퍼지듯, 자산을 자유롭게 움직이도록 설계된 아홉 가지 기능.'),
 ('<span class="tag-label">Built For</span>', '<span class="tag-label">이런 분들을 위해</span>'),
 # 01 (alts first: they contain the headings)
 ('Unified Multi-Wallet Management — Xerovan app showing wallets and asset breakdown', '통합 멀티 지갑 관리 — 지갑과 자산 구성을 보여주는 Xerovan 앱'),
 ('<h3>Unified Multi-Wallet Management</h3>', '<h3>통합 멀티 지갑 관리</h3>'),
 ('Every Wallet. Every Asset. One Secure View.', '모든 지갑, 모든 자산을 하나의 안전한 화면에서.'),
 ('Import or connect compatible crypto wallets and manage every asset through one unified, self-custodial interface.',
  '호환되는 암호화폐 지갑을 가져오거나 연결하고, 하나의 통합된 셀프 커스터디 인터페이스에서 모든 자산을 관리하세요.'),
 ('<li>Self-custodial wallet experience</li>', '<li>셀프 커스터디 지갑 경험</li>'),
 ('<li>Import or connect external wallets</li>', '<li>외부 지갑 가져오기 및 연결</li>'),
 ('<li>Secure MPC wallet technology</li>', '<li>안전한 MPC 지갑 기술</li>'),
 ('<span class="tag-label">Supported Networks</span>', '<span class="tag-label">지원 네트워크</span>'),
 ('Your wallets stay yours. Xerovan simply makes them work together.', '지갑의 주인은 언제나 당신입니다. Xerovan은 그 지갑들이 함께 작동하게 할 뿐입니다.'),
 # 02
 ('Visa Crypto Card — turn crypto into everyday spending power', 'Visa 크립토 카드 — 암호화폐를 일상의 결제 수단으로'),
 ('<h3>Visa Crypto Card</h3>', '<h3>Visa 크립토 카드</h3>'),
 ('Turn Crypto into Everyday Spending Power.', '암호화폐를 일상의 결제 수단으로.'),
 ("Xerovan's virtual and physical Visa cards turn your crypto into real-world spending power, wherever Visa is accepted.",
  'Xerovan의 가상·실물 Visa 카드로 Visa가 통하는 곳이라면 어디서나 암호화폐를 실제 구매력으로 바꾸세요.'),
 ('<li>Apple Pay and Google Pay support</li>', '<li>Apple Pay·Google Pay 지원</li>'),
 ('<li>Instant card freeze and unfreeze</li>', '<li>카드 즉시 정지 및 해제</li>'),
 ('<li>Custom spending limits</li>', '<li>맞춤 지출 한도</li>'),
 ('<span class="tag">International travelers</span>', '<span class="tag">해외 여행자</span>'),
 ('<span class="tag">Digital nomads</span>', '<span class="tag">디지털 노마드</span>'),
 ('<span class="tag">Global freelancers</span>', '<span class="tag">글로벌 프리랜서</span>'),
 ('<span class="tag">Media buyers</span>', '<span class="tag">미디어 바이어</span>'),
 ('<span class="tag">Crypto users</span>', '<span class="tag">크립토 사용자</span>'),
 ('<span class="tag">Everyday consumers</span>', '<span class="tag">일반 소비자</span>'),
 ('One card for a borderless lifestyle.', '국경 없는 라이프스타일을 위한 단 하나의 카드.'),
 # 03
 ('Smart Crypto Swaps — move across chains without the complexity', '스마트 크립토 스왑 — 복잡함 없이 체인을 넘나들기'),
 ('<h3>Smart Crypto Swaps</h3>', '<h3>스마트 크립토 스왑</h3>'),
 ('Move Across Chains Without the Complexity.', '복잡함 없이 체인을 넘나드세요.'),
 ("Swap and bridge assets across supported networks through Xerovan's smart routing, in a streamlined one-click experience.",
  'Xerovan의 스마트 라우팅으로 지원 네트워크 간 자산을 원클릭으로 간편하게 스왑하고 브리지하세요.'),
 ('<li>Smart price routing</li>', '<li>스마트 가격 라우팅</li>'),
 ('<li>Competitive network fees</li>', '<li>경쟁력 있는 네트워크 수수료</li>'),
 ('<li>Streamlined one-click experience</li>', '<li>간편한 원클릭 경험</li>'),
 ('<span class="tag-label">Powered By</span>', '<span class="tag-label">기술 파트너</span>'),
 ('Less friction. More freedom to move.', '마찰은 줄이고, 움직임의 자유는 더 크게.'),
 # 04
 ('Earn and Rewards — 8% total rewards earned this month', '수익 및 리워드 — 이번 달 누적 리워드 8%'),
 ('<h3>Earn and Rewards</h3>', '<h3>수익 및 리워드</h3>'),
 ('Make Every Asset and Every Transaction Work Harder.', '모든 자산과 모든 거래가 더 많은 가치를 만들도록.'),
 ('Xerovan brings staking, cashback, and referral rewards together so your assets and transactions keep working for you.',
  'Xerovan은 스테이킹, 캐시백, 추천 리워드를 한데 모아 당신의 자산과 거래가 계속 가치를 만들어내도록 합니다.'),
 ('<li>Cashback rewards of up to 8%</li>', '<li>최대 8% 캐시백 리워드</li>'),
 ('Hold less passively. Get more from your digital assets.', '그냥 보유만 하지 마세요. 디지털 자산에서 더 많은 것을 얻으세요.'),
 # 05
 ('Xerovan Balance — one balance across the ecosystem', 'Xerovan 잔액 — 에코시스템 전체를 아우르는 하나의 잔액'),
 ('<h3>Xerovan Balance</h3>', '<h3>Xerovan 잔액</h3>'),
 ('One Balance. Every Xerovan Experience.', '하나의 잔액으로 모든 Xerovan 서비스를.'),
 ('Top up Xerovan Balance with crypto and pay instantly across every product and service in the ecosystem.',
  '암호화폐로 Xerovan 잔액을 충전하고 에코시스템 내 모든 상품과 서비스를 즉시 결제하세요.'),
 ('<li>Top up using crypto</li>', '<li>암호화폐로 충전</li>'),
 ('<li>Make instant in-app payments</li>', '<li>앱 내 즉시 결제</li>'),
 ('<li>Pay for supported travel products</li>', '<li>지원되는 여행 상품 결제</li>'),
 ('Fund once. Spend seamlessly across the ecosystem.', '한 번 충전으로 에코시스템 전체에서 자유롭게.'),
 # 06
 ('Travel Marketplace — pay, book, and travel without borders', '여행 마켓플레이스 — 국경 없이 결제하고 예약하고 여행하기'),
 ('<h3>Travel Marketplace</h3>', '<h3>여행 마켓플레이스</h3>'),
 ('Pay, Book, and Travel Without Borders.', '국경 없이 결제하고, 예약하고, 여행하세요.'),
 ('Xerovan brings flights, hotels, tours, and eSIMs into one connected marketplace you can pay for with Xerovan Balance.',
  'Xerovan은 항공권, 호텔, 투어, eSIM을 하나의 마켓플레이스로 연결하며, Xerovan 잔액으로 결제할 수 있습니다.'),
 ('<span class="tag-label">Travel Products</span>', '<span class="tag-label">여행 상품</span>'),
 ('<span class="tag">Flights</span>', '<span class="tag">항공권</span>'),
 ('<span class="tag">Hotels</span>', '<span class="tag">호텔</span>'),
 ('<span class="tag">Tours & activities</span>', '<span class="tag">투어 및 액티비티</span>'),
 ('<span class="tag">eSIM services</span>', '<span class="tag">eSIM 서비스</span>'),
 ('<li>Travel marketplace powered by Trateria</li>', '<li>Trateria 기반 여행 마켓플레이스</li>'),
 ('<li>Multilingual product discovery</li>', '<li>다국어 상품 검색</li>'),
 ('<li>Crypto-friendly payment options</li>', '<li>크립토 친화적 결제 옵션</li>'),
 ('Your wallet, card, and journey — finally connected.', '지갑, 카드, 그리고 여행 — 마침내 하나로.'),
 # 07
 ('Business Cards and Expense Management — control every card, track every expense', '법인 카드 및 경비 관리 — 모든 카드 통제, 모든 경비 추적'),
 ('<h3>Business Cards and Expense Management</h3>', '<h3>법인 카드 및 경비 관리</h3>'),
 ('Control Every Card. Track Every Expense. Scale with Confidence.', '모든 카드를 통제하고, 모든 경비를 추적하며, 자신 있게 성장하세요.'),
 ('Xerovan lets companies issue cards, set spending policies, and track every expense from one centralized dashboard.',
  'Xerovan으로 기업은 하나의 대시보드에서 카드를 발급하고, 지출 정책을 설정하고, 모든 경비를 추적할 수 있습니다.'),
 ('<li>Apply merchant category restrictions</li>', '<li>가맹점 업종 제한 적용</li>'),
 ('<li>Create receipt-based approval workflows</li>', '<li>영수증 기반 승인 워크플로 구성</li>'),
 ('<li>Control spending by employee, team, or category</li>', '<li>직원·팀·카테고리별 지출 관리</li>'),
 ('<span class="tag">SMBs</span>', '<span class="tag">중소기업</span>'),
 ('<span class="tag">Marketing agencies</span>', '<span class="tag">마케팅 에이전시</span>'),
 ('<span class="tag">Media-buying teams</span>', '<span class="tag">미디어 바잉 팀</span>'),
 ('<span class="tag">Remote teams</span>', '<span class="tag">원격 근무 팀</span>'),
 ("<span class=\"tag\">Frequent int'l expenses</span>", '<span class="tag">해외 지출이 잦은 기업</span>'),
 ('Empower your team without losing financial control.', '재무 통제는 지키면서 팀에 자율성을 부여하세요.'),
 # 08
 ('Security and Asset Protection — advanced protection for every wallet, card, and transaction', '보안 및 자산 보호 — 모든 지갑, 카드, 거래를 위한 고급 보호'),
 ('<h3>Security and Asset Protection</h3>', '<h3>보안 및 자산 보호</h3>'),
 ('Your Assets. Your Control. Advanced Protection.', '당신의 자산, 당신의 통제, 한 차원 높은 보호.'),
 ('Xerovan combines self-custodial MPC wallet infrastructure with encryption and verification to protect every wallet, card, and transaction.',
  'Xerovan은 셀프 커스터디 MPC 지갑 인프라에 암호화와 인증을 결합해 모든 지갑, 카드, 거래를 보호합니다.'),
 ('<li>MPC wallet infrastructure</li>', '<li>MPC 지갑 인프라</li>'),
 ('<li>Data encryption</li>', '<li>데이터 암호화</li>'),
 ('<li>Transaction verification</li>', '<li>거래 인증</li>'),
 ('Security built into every wallet, card, and transaction.', '모든 지갑, 카드, 거래에 보안이 기본으로 내장되어 있습니다.'),
 # 09
 ('Global Access — one platform, global access', '글로벌 액세스 — 하나의 플랫폼, 전 세계 어디서나'),
 ('<h3>Global Access</h3>', '<h3>글로벌 액세스</h3>'),
 ('Built for a World Without Financial Borders.', '금융의 국경이 없는 세상을 위해.'),
 ('Xerovan is built for people and businesses that live, spend, and travel across countries and digital networks.',
  'Xerovan은 여러 나라와 디지털 네트워크를 넘나들며 생활하고, 소비하고, 여행하는 개인과 기업을 위해 만들어졌습니다.'),
 ('<li>Multiple currency support</li>', '<li>다중 통화 지원</li>'),
 ('<li>Solutions for individuals and businesses</li>', '<li>개인 및 기업 솔루션</li>'),
 ('One platform for wherever life and business take you.', '삶과 비즈니스가 어디로 향하든, 하나의 플랫폼으로.'),
 # use cases
 ('<span class="eyebrow center">USE CASES</span>', '<span class="eyebrow center">활용 사례</span>'),
 ('Built for people and businesses without borders.', '국경 없이 활동하는 개인과 기업을 위해.'),
 ('Xerovan is designed for individuals and businesses that manage digital assets, make international payments, travel frequently, or operate across borders.',
  'Xerovan은 디지털 자산을 관리하고, 해외 결제를 하고, 자주 여행하거나, 국경을 넘어 사업하는 개인과 기업을 위해 설계되었습니다.'),
 ('<th>Customer Segment</th><th>Primary Need</th><th>Xerovan Solution</th>', '<th>고객군</th><th>주요 니즈</th><th>Xerovan 솔루션</th>'),
 ('<h3>Built for People and Businesses Without Borders</h3>', '<h3>국경 없는 개인과 기업을 위한 플랫폼</h3>'),
 ('Whether you are managing client advertising budgets, traveling internationally, working remotely, paying for global subscriptions, using crypto in everyday life, or controlling team expenses, Xerovan brings everything together in one connected platform.',
  '고객사 광고 예산 관리, 해외 여행, 원격 근무, 글로벌 구독 결제, 일상 속 암호화폐 사용, 팀 경비 관리까지 — Xerovan은 이 모든 것을 하나로 연결된 플랫폼에 담았습니다.'),
 ('MANAGE CRYPTO. CONTROL SPENDING. PAY GLOBALLY. TRAVEL ANYWHERE.', '암호화폐 관리. 지출 통제. 글로벌 결제. 어디든 여행.'),
 ('<span class="tag-label">Typical Services</span>', '<span class="tag-label">대표 서비스</span>'),
 ('<span class="tag-label">Common Use Cases</span>', '<span class="tag-label">주요 활용 사례</span>'),
 ('Key Value: ${uc.value}', '핵심 가치: ${uc.value}'),
 # FAQ / CTA
 ('<h2>Frequently Asked Questions</h2>', '<h2>자주 묻는 질문</h2>'),
 ('Still have questions? Visit our <button type="button" class="legal-link-btn" style="display:inline" id="helpTrigger1">Help Center</button> or <button type="button" class="legal-link-btn" style="display:inline" id="helpTrigger2">Contact Support</button> for more information.',
  '더 궁금한 점이 있으신가요? <button type="button" class="legal-link-btn" style="display:inline" id="helpTrigger1">고객센터</button>를 방문하시거나 <button type="button" class="legal-link-btn" style="display:inline" id="helpTrigger2">문의하기</button>를 이용해 주세요.'),
 ('<h2>Your crypto, ready to move.</h2>', '<h2>이제, 당신의 암호화폐가 움직일 차례입니다.</h2>'),
 ('Join the waitlist and be first to know when Xerovan launches.', '대기자 명단에 등록하고 Xerovan 출시 소식을 가장 먼저 받아보세요.'),
 ('placeholder="Enter your email" required aria-label="Email address"', 'placeholder="이메일 주소를 입력하세요" required aria-label="이메일 주소"'),
 ('No spam — launch updates only.', '스팸 없이 출시 소식만 보내드립니다.'),
 ('<strong>Thank you for your interest in Xerovan.</strong>', '<strong>Xerovan에 관심 가져주셔서 감사합니다.</strong>'),
 ("You've successfully joined our waitlist. We'll notify you as soon as Xerovan officially launches and becomes available.",
  '대기자 명단 등록이 완료되었습니다. Xerovan이 정식 출시되면 가장 먼저 알려드리겠습니다.'),
 # footer
 ('Manage. Earn. Spend. Travel.</strong><br>The all-in-one Web3 financial platform for modern users.',
  '관리. 수익. 결제. 여행.</strong><br>모두를 위한 올인원 Web3 금융 플랫폼.'),
 ('<h5>Company</h5>', '<h5>회사</h5>'),
 ('<a href="#">About Us</a>', '<a href="#">회사 소개</a>'),
 ('<a href="#">Careers</a>', '<a href="#">채용</a>'),
 ('<a href="#">Partners</a>', '<a href="#">파트너</a>'),
 ('<h5>Resources</h5>', '<h5>리소스</h5>'),
 ('id="helpTrigger3">Help Center</button>', 'id="helpTrigger3">고객센터</button>'),
 ('<a href="#">Fees</a>', '<a href="#">수수료</a>'),
 ('<h5>Legal</h5>', '<h5>법적 고지</h5>'),
 ('<span>Non-Custodial Wallet</span><span>Secure Authentication</span><span>KYC & AML Compliant</span><span>Visa Card Program</span><span>Multi-Chain Infrastructure</span>',
  '<span>비수탁형 지갑</span><span>안전한 인증</span><span>KYC·AML 준수</span><span>Visa 카드 프로그램</span><span>멀티체인 인프라</span>'),
 # modals
 ('<h3>Contact Us</h3>', '<h3>문의하기</h3>'),
 ('aria-label="Close"', 'aria-label="닫기"'),
 ('<label>Name<input', '<label>이름<input'),
 ('<label>Email<input', '<label>이메일<input'),
 ('<label>Message<textarea', '<label>메시지<textarea'),
 ('>Send Message</button>', '>메시지 보내기</button>'),
 ("We'll reply to the email address you provide.", '입력하신 이메일 주소로 답변드리겠습니다.'),
 ('<strong>Thanks for reaching out.</strong>', '<strong>문의해 주셔서 감사합니다.</strong>'),
 ("We've received your message and will get back to you shortly.", '메시지를 잘 받았습니다. 빠르게 답변드리겠습니다.'),
]
for old, new in R:
    kr = must(kr, old, new)

kr = must_re(kr, r'(<div class="footer-legal">).*?(</div>)',
'''<div class="footer-legal">
      © 2026 Xerovan. All rights reserved.
      Xerovan은 기술 플랫폼이며 은행이 아닙니다. 카드 및 결제 서비스는 인가된 금융기관과 라이선스를 보유한 프로그램 파트너가 제공하며, 자격 요건, 관련 약관 및 지역별 제공 여부에 따라 달라질 수 있습니다.
      디지털 자산, 지갑, 스왑, 브리지, 결제, 여행, 리워드 서비스에는 독립적인 제3자 제공업체가 관여할 수 있습니다. 기능, 지원 자산, 수수료, 한도 및 제공 여부는 관할 지역에 따라 다를 수 있으며 변경될 수 있습니다.
      디지털 자산에는 가격 변동성, 네트워크 장애, 스마트 컨트랙트 취약점, 자금 손실 가능성 등의 위험이 따릅니다. Xerovan은 투자, 금융, 세무 또는 법률 자문을 제공하지 않습니다.
      Xerovan 이용은 관련 법령, 본인 인증, 제재 대상 심사 및 해당 서비스 약관의 적용을 받습니다.
    </div>''')

kr = must_re(kr, r"const FAQ_SHEET_URL = '[^']*';",
 "// 한국어 FAQ: 시트에 한국어 탭을 만들고 그 탭의 CSV 게시 URL을 넣으면 시트에서 불러옵니다.\n"
 "  // 비워두면 아래 faqDataFallback(한국어)을 그대로 사용합니다.\n"
 "  const FAQ_SHEET_URL = '';")

kr = must_re(kr, r"const faqDataFallback = \[.*?\n  \];", '''const faqDataFallback = [
    { q: "현재 어떤 국가에서 이용할 수 있나요?", a: "Xerovan은 이용 가능 지역을 단계적으로 확대하고 있습니다. 지갑 생성, 카드 발급 및 일부 서비스는 거주 국가에 따라 달라질 수 있습니다. 최신 이용 가능 지역은 지원 국가 페이지에서 확인해 주세요." },
    { q: "Xerovan은 어떤 블록체인을 지원하나요?", a: "Xerovan은 Ethereum, Base, Arbitrum, Polygon, BNB Chain, Solana, TRON, Bitcoin 등 주요 블록체인 네트워크를 지원하며, 지원 네트워크는 계속 추가될 예정입니다." },
    { q: "Visa 카드는 어떻게 충전하나요?", a: "지원되는 암호화폐를 Xerovan 지갑으로 전송한 뒤 몇 번의 탭으로 카드를 충전하면 됩니다. 선택한 자산과 네트워크에 따라 자금이 변환되어 카드 결제에 사용할 수 있게 됩니다." },
    { q: "Xerovan의 수수료는 어떻게 되나요?", a: "지갑 전송, 스왑, 카드 충전 시 거래 유형에 따라 네트워크 수수료나 서비스 수수료가 발생할 수 있습니다. 모든 수수료는 거래 확정 전에 투명하게 표시됩니다." },
    { q: "Xerovan은 수탁형인가요, 비수탁형인가요?", a: "Xerovan은 비수탁형 지갑으로 설계되어, 디지털 자산에 대한 통제권을 직접 유지하면서 통합 금융 서비스를 이용할 수 있습니다." },
    { q: "기존 지갑을 연결할 수 있나요?", a: "네. MetaMask 등 지원되는 외부 지갑을 연결해 Xerovan 안에서 자산을 편리하게 관리할 수 있습니다." },
    { q: "Xerovan은 얼마나 안전한가요?", a: "보안은 Xerovan의 최우선 과제입니다. 고급 지갑 보안 기술, 암호화 통신, 생체 인증, 업계 표준 보호 체계를 통해 자산과 계정을 보호합니다." },
    { q: "암호화폐로 리워드를 받을 수 있나요?", a: "네. 지역별 제공 여부에 따라 대상 자산으로 스테이킹, 이자 상품, 캐시백 프로그램, 추천 리워드에 참여할 수 있습니다." },
    { q: "기업도 Xerovan을 이용할 수 있나요?", a: "물론입니다. 직원 카드, 지출 관리, 승인 워크플로, 경비 관리, 거래 리포트 등 규모와 관계없이 모든 기업을 위한 비즈니스 기능을 제공합니다." },
    { q: "암호화폐 지갑 외에 어떤 서비스가 있나요?", a: "Xerovan은 단순한 지갑이 아닙니다. 암호화폐 관리 외에도 Visa 카드 결제, 자산 스왑, 크로스체인 전송, 여행 예약, eSIM 구매, 리워드 등 다양한 금융 서비스를 하나의 플랫폼에서 이용할 수 있습니다." },
    { q: "KYC 인증을 꼭 해야 하나요?", a: "지갑 생성, 카드 발급, 규제 대상 금융 상품 등 일부 서비스는 관련 법규에 따라 본인 인증이 필요합니다. 지원되는 경우 외부 지갑 연결은 KYC 없이 이용할 수 있습니다." },
    { q: "Xerovan은 언제 정식 출시되나요?", a: "현재 정식 출시를 준비하고 있습니다. 대기자 명단에 등록하시면 제품 소식, 얼리 액세스 기회, 출시 안내를 받아보실 수 있습니다." }
  ];''')

kr = must_re(kr, r"const legalDataFallback = \[.*?\n  \];", '''const legalDataFallback = [
    { title: "이용약관", content: "준비 중입니다." },
    { title: "개인정보 처리방침", content: "준비 중입니다." },
    { title: "환불 정책", content: "준비 중입니다." }
  ];''')

kr = must_re(kr, r"const useCaseData = \[.*?\n  \];", '''const useCaseData = [
    {
      title: "마케팅 에이전시 및 미디어 바이어",
      tag: "여러 고객사, 팀, 플랫폼의 광고비를 한 번에 관리하세요.",
      lede: "마케팅 에이전시와 미디어 바이어는 예산, 고객사, 승인 기준이 각기 다른 여러 광고 계정을 운영합니다. Xerovan으로 전용 카드를 발급하고, 지출을 통제하고, 모든 거래를 한곳에서 추적하세요.",
      items: ["고객사·캠페인별 가상 카드 개별 발급","Google Ads, Meta Ads, TikTok Ads 등 플랫폼별 전용 카드 지정","고객사·직원·캠페인별 지출 한도 설정","가맹점 업종 제한 적용","카드 즉시 정지 및 해제","영수증 및 증빙 서류 수집","영수증 기반 거래 승인 워크플로 구성","통합 대시보드에서 광고비 모니터링","고객사·팀·프로젝트별 경비 리포트 생성"],
      value: "모든 예산을 분리하고, 모든 거래를 통제하고, 모든 캠페인을 추적하세요.",
      visual: "image",
      image: "/images/usecase-01.jpg"
    },
    {
      title: "해외를 자주 오가는 여행자",
      tag: "자금, 결제, 여행 서비스를 하나의 플랫폼에서.",
      lede: "잦은 여행에는 어디서나 믿을 수 있는 자금 접근성, 글로벌 결제 수단, 필수 여행 서비스가 필요합니다. Xerovan은 디지털 자산, Visa 카드 결제, 여행 예약을 하나의 경험으로 연결합니다.",
      items: ["Visa 가맹점이라면 전 세계 어디서나 결제","여행 중 가상·실물 카드 사용","Apple Pay 또는 Google Pay에 카드 등록","지원되는 디지털 자산으로 카드 충전","분실·도난 카드 즉시 정지","앱에서 바로 카드 정지 해제","실시간 거래 내역 확인","항공권, 호텔, 투어, 액티비티, eSIM 예약","여러 통화와 네트워크의 자산 관리"],
      value: "자금, 카드, 여행을 하나의 플랫폼으로.",
      visual: "image",
      image: "/images/usecase-02.jpg"
    },
    {
      title: "디지털 노마드 및 글로벌 프리랜서",
      tag: "어디서든 일할 수 있는 금융의 유연함.",
      lede: "디지털 노마드와 프리랜서는 여러 국가와 통화에 걸쳐 수입을 받고, 결제하고, 지출을 관리합니다. Xerovan은 특정 지역에 묶이지 않고 디지털 자산과 일상 지출을 관리할 수 있게 해줍니다.",
      items: ["하나의 인터페이스에서 여러 암호화폐 지갑 관리","지원 네트워크 전반의 자산 보유 및 관리","필요할 때 자산 스왑","Xerovan Visa 카드로 전 세계 결제","소프트웨어, 숙소, 교통, 생활비 결제","Xerovan 여행 마켓플레이스에서 여행 예약","해외 통신을 위한 eSIM 구매","개인·업무 거래를 한곳에서 확인"],
      value: "어디서든 일하고, 어디서든 결제하고, 언제나 통제하세요.",
      visual: "image",
      image: "/images/usecase-03.jpg"
    },
    {
      title: "달러·해외 구독 서비스 이용자",
      tag: "전용 카드로 반복되는 해외 결제를 관리하세요.",
      lede: "많은 국가의 사용자들이 해외 소프트웨어, 클라우드, 스트리밍, 달러 결제 구독 서비스 이용에 어려움을 겪습니다. Xerovan은 반복 결제를 편리하게 정리하고 통제할 수 있는 방법을 제공합니다.",
      items: ["구독 결제 전용 가상 카드 생성","지원되는 해외·달러 결제 서비스 이용","업무용·개인용 구독 카드 분리","구독 카테고리별 지출 한도 설정","반복 결제 실시간 모니터링","더 이상 필요 없는 구독은 카드 정지","예상치 못한 결제나 무단 결제 위험 감소","SaaS, 클라우드, 생산성, 디지털 서비스 결제 추적"],
      value: "모든 해외 구독을 직접 통제하세요.",
      visual: "image",
      image: "/images/usecase-04.jpg",
      tags: ["클라우드 인프라","AI 및 생산성 도구","디자인·협업 소프트웨어","마케팅 플랫폼","스트리밍 및 디지털 콘텐츠","비즈니스 SaaS 구독"]
    },
    {
      title: "실생활 활용을 원하는 크립토 보유자",
      tag: "보유를 넘어, 디지털 자산을 실제로 사용하세요.",
      lede: "많은 크립토 사용자가 여러 지갑과 블록체인에 자산을 나눠 보유하지만, 일상에서 쓸 간단한 방법이 없습니다. Xerovan은 지갑 관리, 스왑, 결제, 리워드, 여행을 하나로 연결합니다.",
      items: ["호환 지갑을 가져와 한곳에서 관리","외부 지갑 연결","멀티체인 자산 조회 및 관리","암호화폐 송금 및 수신","지원 네트워크 간 자산 스왑","지원 체인 간 자산 브리지","Xerovan 잔액 또는 카드 충전","Visa 네트워크에서 결제","지원되는 여행 상품·서비스를 암호화폐로 결제","스테이킹, 이자, 캐시백, 추천 리워드 이용"],
      value: "디지털 자산을 현실의 가능성으로 바꾸세요.",
      visual: "image",
      image: "/images/usecase-05.jpg"
    },
    {
      title: "중소기업 및 분산 근무 팀",
      tag: "직원, 팀, 국가에 걸친 비즈니스 지출을 간단하게.",
      lede: "중소기업에는 직원 지출에 대한 더 나은 가시성과 통제가 필요합니다. Xerovan으로 카드를 발급하고, 지출 정책을 정하고, 경비를 중앙에서 관리하세요.",
      items: ["직원 또는 부서별 다수 카드 발급","출장, 마케팅, 소프트웨어, 운영용 카드 분리","직원·팀·경비 항목별 지출 한도 설정","승인된 가맹점 업종으로 카드 사용 제한","카드 즉시 정지 및 해제","영수증 기반 경비 승인 워크플로 구성","직원 영수증 수집 및 정리","비즈니스 거래 실시간 모니터링","통합 경비 리포트 생성","해외 사업·출장 경비 관리"],
      value: "재무 통제는 지키면서 팀에 지출의 유연함을 주세요.",
      visual: "image",
      image: "/images/usecase-06.jpg"
    }
  ];''')

kr = must_re(kr, r"const summaryTable = \[.*?\n  \];", '''const summaryTable = [
    ["마케팅 에이전시·미디어 바이어","고객사별 광고 예산 분리 및 통제","다수 카드, 지출 한도, 가맹점 제한, 경비 추적"],
    ["해외를 자주 오가는 여행자","전 세계 결제 및 여행 관리","Visa 카드, 카드 통제, 여행 예약, eSIM"],
    ["디지털 노마드·프리랜서","국경을 넘는 수입과 지출 관리","멀티 지갑 관리, 스왑, 글로벌 결제, 여행 서비스"],
    ["해외 구독 서비스 이용자","반복되는 해외 서비스 결제 및 통제","전용 가상 카드, 지출 한도, 거래 모니터링"],
    ["크립토 보유자","보관·거래를 넘어선 디지털 자산 활용","지갑 관리, 스왑, 카드 결제, 리워드, 여행"],
    ["중소기업·분산 근무 팀","직원·부서 경비 통제","법인 카드, 승인 워크플로, 영수증 관리, 리포트"]
  ];''')


# ---------------------------------------------------------------- JA / ES / AR / PT
import json, importlib.util
KEYS = [o for o, _ in R]
IMAGES = [f"/images/usecase-0{i}.jpg" for i in range(1, 7)]
EXTRA_FONTS = {
    "ja": ("family=Noto+Sans+JP:wght@400;500;600;700", "'Noto Sans JP'"),
    "ar": ("family=Noto+Sans+Arabic:wght@400;500;600;700", "'Noto Sans Arabic'"),
}
RTL_CSS = """
  /* ---------- RTL (Arabic) ---------- */
  [dir="rtl"] .eco-card li{padding-left:0; padding-right:14px;}
  [dir="rtl"] .eco-card li::before{left:auto; right:0;}
  [dir="rtl"] .uc-head, [dir="rtl"] .faq-q, [dir="rtl"] .uc-table th, [dir="rtl"] .uc-table td, [dir="rtl"] .legal-link-btn{text-align:right;}
  [dir="rtl"] .eyebrow, [dir="rtl"] .feature-kicker, [dir="rtl"] .tag-label, [dir="rtl"] .feature-num{letter-spacing:0;}
  [dir="rtl"] .hero-visual-screen, [dir="rtl"] .tag-row, [dir="rtl"] .footer-legal span{direction:ltr;}
"""

def wrap(old, new):
    if "<" in new or '"' in new or new.startswith(">"):
        return new                      # full replacement supplied
    if not re.search(r'[<>"=]', old):
        return new                      # plain text
    m = re.match(r'^((?:.*>)?)([^<>]+)(</[^>]+>)$', old, re.S)
    if m: return m.group(1) + new + m.group(3)
    m = re.match(r'^([\w-]+=")([^"]*)(")$', old)
    if m: return m.group(1) + new + m.group(3)
    m = re.match(r'^(<label>)([^<]+)(<\w+)$', old)
    if m: return m.group(1) + new + m.group(3)
    sys.exit(f"cannot wrap key: {old!r}")

def js(v):
    return json.dumps(v, ensure_ascii=False, indent=2).replace("\n", "\n  ")

def build_generic(code):
    spec = importlib.util.spec_from_file_location(code, ROOT / "_build" / "i18n" / f"{code}.py")
    L = importlib.util.module_from_spec(spec); spec.loader.exec_module(L)
    if len(L.T) != len(KEYS):
        sys.exit(f"{code}: {len(L.T)} strings, expected {len(KEYS)}")
    h = common(src, code, L.LEGAL_LINKS)
    if code in EXTRA_FONTS:
        fam, name = EXTRA_FONTS[code]
        h = must(h, "family=JetBrains+Mono:wght@400;500&display=swap", f"family=JetBrains+Mono:wght@400;500&{fam}&display=swap")
        h = h.replace("'Unbounded'", f"'Unbounded',{name}").replace("'Inter'", f"'Inter',{name}")
        h = h.replace("font-family:'JetBrains Mono'", f"font-family:'JetBrains Mono',{name}")
    if code == "ja":
        h = must(h, "  ::selection{", "  body{line-break:strict; word-break:normal; overflow-wrap:anywhere;}\n  ::selection{")
    if code == "ar":
        h = must(h, "</style>", RTL_CSS + "</style>")
        h = h.replace('<span class="flow-arrow">→</span>', '<span class="flow-arrow">←</span>')
    for old, new in zip(KEYS, L.T):
        h = must(h, old, wrap(old, new))
    h = must_re(h, r'(<div class="footer-legal">).*?(</div>)',
                '<div class="footer-legal">\n      © 2026 Xerovan. All rights reserved.\n      ' + L.FOOTER_LEGAL.strip() + '\n    </div>')
    h = must_re(h, r"const FAQ_SHEET_URL = '[^']*';",
                "// Leave empty to use faqDataFallback below, or paste the CSV link of a sheet tab in this language.\n  const FAQ_SHEET_URL = '';")
    h = must_re(h, r"const faqDataFallback = \[.*?\n  \];",
                "const faqDataFallback = " + js([{"q": q, "a": a} for q, a in L.FAQ]) + ";")
    h = must_re(h, r"const legalDataFallback = \[.*?\n  \];",
                "const legalDataFallback = " + js([{"title": t, "content": L.COMING_SOON} for t in L.LEGAL_LINKS[:3]]) + ";")
    ucs = []
    for i, uc in enumerate(L.USE_CASES):
        d = {"title": uc[0], "tag": uc[1], "lede": uc[2], "items": uc[3], "value": uc[4], "visual": "image", "image": IMAGES[i]}
        if len(uc) > 5: d["tags"] = uc[5]
        ucs.append(d)
    h = must_re(h, r"const useCaseData = \[.*?\n  \];", "const useCaseData = " + js(ucs) + ";")
    h = must_re(h, r"const summaryTable = \[.*?\n  \];", "const summaryTable = " + js(L.SUMMARY) + ";")
    (ROOT / code).mkdir(exist_ok=True)
    (ROOT / code / "index.html").write_text(finalize(h, code), encoding="utf-8")
    print(code, "ok", len(h))

for code in ("ja", "es", "ar", "pt"):
    if (ROOT / "_build" / "i18n" / f"{code}.py").exists():
        build_generic(code)

(ROOT / "en" / "index.html").write_text(en, encoding="utf-8")
(ROOT / "kr" / "index.html").write_text(finalize(kr, "kr"), encoding="utf-8")
print("ok", len(en), len(kr))
