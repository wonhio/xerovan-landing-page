/**
 * Xerovan blog — headless WordPress renderer (Vercel Serverless Function)
 *
 * Public URLs (mapped in vercel.json):
 *   /{lang}/blog                 → list            (lang = en | kr | ja | es | ar | pt)
 *   /{lang}/blog/page/{n}        → list, page n
 *   /{lang}/blog/{slug}          → single post
 *   /blog-sitemap.xml            → sitemap of all posts
 *   /{lang}/blog/feed.xml        → RSS feed
 *
 * WordPress (cms.xerovan.com) is only the writing tool. Each post is assigned
 * to ONE category whose slug equals the language code (en, kr, ja, es, ar, pt).
 * Nothing on cms.xerovan.com is shown to visitors directly.
 *
 * Env vars (Vercel → Project → Settings → Environment Variables):
 *   WP_ORIGIN   default https://cms.xerovan.com
 *   SITE_URL    default https://www.xerovan.com
 */

const WP = (process.env.WP_ORIGIN || 'https://cms.xerovan.com').replace(/\/$/, '');
const SITE = (process.env.SITE_URL || 'https://www.xerovan.com').replace(/\/$/, '');
const PER_PAGE = 9;

const LANGS = {
  en: { hl: 'en', locale: 'en-US', og: 'en_US', name: 'English', short: 'EN' },
  kr: { hl: 'ko', locale: 'ko-KR', og: 'ko_KR', name: '한국어', short: 'KR' },
  ja: { hl: 'ja', locale: 'ja-JP', og: 'ja_JP', name: '日本語', short: 'JA' },
  es: { hl: 'es', locale: 'es-ES', og: 'es_ES', name: 'Español', short: 'ES' },
  ar: { hl: 'ar', locale: 'ar-AE', og: 'ar_AE', name: 'العربية', short: 'AR', rtl: true },
  pt: { hl: 'pt', locale: 'pt-BR', og: 'pt_BR', name: 'Português', short: 'PT' },
};

const T = {
  en: { blog: 'Blog', title: 'Xerovan Blog', intro: 'Product updates, guides, and insights on crypto payments, cards, and borderless finance.', read: 'Read article', back: 'All articles', newer: 'Newer', older: 'Older', empty: 'No articles yet. Check back soon.', notFound: 'Article not found', notFoundText: 'This article may have moved or is not available in this language.', down: 'The blog is temporarily unavailable', downText: 'Please try again in a few minutes.', home: 'Home', min: 'min read', page: 'Page' },
  kr: { blog: '블로그', title: 'Xerovan 블로그', intro: '제품 소식, 이용 가이드, 크립토 결제·카드·국경 없는 금융에 대한 인사이트.', read: '글 읽기', back: '전체 글', newer: '최신 글', older: '이전 글', empty: '아직 게시된 글이 없습니다. 곧 찾아올게요.', notFound: '글을 찾을 수 없습니다', notFoundText: '글이 이동되었거나 이 언어로 제공되지 않습니다.', down: '블로그를 일시적으로 불러올 수 없습니다', downText: '잠시 후 다시 시도해 주세요.', home: '홈', min: '분 소요', page: '페이지' },
  ja: { blog: 'ブログ', title: 'Xerovan ブログ', intro: 'プロダクトの最新情報、ガイド、暗号資産決済・カード・国境のない金融に関するインサイト。', read: '記事を読む', back: 'すべての記事', newer: '新しい記事', older: '前の記事', empty: 'まだ記事はありません。近日公開予定です。', notFound: '記事が見つかりません', notFoundText: '記事が移動したか、この言語では公開されていません。', down: 'ブログを一時的に表示できません', downText: '数分後にもう一度お試しください。', home: 'ホーム', min: '分で読めます', page: 'ページ' },
  es: { blog: 'Blog', title: 'Blog de Xerovan', intro: 'Novedades del producto, guías y análisis sobre pagos cripto, tarjetas y finanzas sin fronteras.', read: 'Leer artículo', back: 'Todos los artículos', newer: 'Más recientes', older: 'Anteriores', empty: 'Aún no hay artículos. Vuelve pronto.', notFound: 'Artículo no encontrado', notFoundText: 'Es posible que el artículo se haya movido o no esté disponible en este idioma.', down: 'El blog no está disponible temporalmente', downText: 'Inténtalo de nuevo en unos minutos.', home: 'Inicio', min: 'min de lectura', page: 'Página' },
  ar: { blog: 'المدونة', title: 'مدونة Xerovan', intro: 'تحديثات المنتج والأدلة ورؤى حول مدفوعات العملات المشفرة والبطاقات والتمويل بلا حدود.', read: 'اقرأ المقال', back: 'جميع المقالات', newer: 'الأحدث', older: 'الأقدم', empty: 'لا توجد مقالات بعد. تابعنا قريبًا.', notFound: 'المقال غير موجود', notFoundText: 'ربما نُقل المقال أو أنه غير متاح بهذه اللغة.', down: 'المدونة غير متاحة مؤقتًا', downText: 'يُرجى المحاولة مرة أخرى بعد بضع دقائق.', home: 'الرئيسية', min: 'دقائق قراءة', page: 'صفحة' },
  pt: { blog: 'Blog', title: 'Blog da Xerovan', intro: 'Novidades do produto, guias e análises sobre pagamentos cripto, cartões e finanças sem fronteiras.', read: 'Ler artigo', back: 'Todos os artigos', newer: 'Mais recentes', older: 'Anteriores', empty: 'Ainda não há artigos. Volte em breve.', notFound: 'Artigo não encontrado', notFoundText: 'O artigo pode ter sido movido ou não está disponível neste idioma.', down: 'O blog está temporariamente indisponível', downText: 'Tente novamente em alguns minutos.', home: 'Início', min: 'min de leitura', page: 'Página' },
};

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const decode = (s) => String(s ?? '')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const stripTags = (h) => decode(String(h ?? '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

/** Serve WordPress media through xerovan.com/blog-media/… and point internal links at the public blog. */
function publicize(html, lang) {
  const wpHost = WP.replace(/^https?:\/\//, '');
  return String(html ?? '')
    .replace(new RegExp(`https?://${wpHost.replace(/\./g, '\\.')}/wp-content/uploads/`, 'g'), '/blog-media/')
    .replace(new RegExp(`https?://${wpHost.replace(/\./g, '\\.')}/(?:(?:${Object.keys(LANGS).join('|')})/)?([a-z0-9%-]+)/?(?=["'#?])`, 'gi'), `/${lang}/blog/$1`);
}

async function wp(path) {
  const r = await fetch(`${WP}/wp-json/wp/v2/${path}`, { headers: { Accept: 'application/json' } });
  if (r.status === 400 && /page=/.test(path)) return { data: [], total: 0, pages: 0 }; // page out of range
  if (!r.ok) throw new Error(`WP ${r.status} on ${path}`);
  return { data: await r.json(), total: +r.headers.get('x-wp-total') || 0, pages: +r.headers.get('x-wp-totalpages') || 0 };
}

const catCache = new Map();
async function categoryId(lang) {
  if (catCache.has(lang)) return catCache.get(lang);
  const { data } = await wp(`categories?slug=${encodeURIComponent(lang)}&_fields=id`);
  const id = data[0]?.id ?? null;
  if (id) catCache.set(lang, id);
  return id;
}

function shape(p, lang) {
  const media = p._embedded?.['wp:featuredmedia']?.[0];
  const img = media?.source_url ? publicize(media.source_url, lang) : null;
  const words = stripTags(p.content?.rendered).split(/\s+/).length;
  const chars = stripTags(p.content?.rendered).length;
  const cjk = lang === 'kr' || lang === 'ja';
  return {
    slug: p.slug,
    title: stripTags(p.title?.rendered),
    excerpt: clip(stripTags(p.excerpt?.rendered), 180),
    content: publicize(p.content?.rendered, lang),
    date: p.date_gmt ? p.date_gmt + 'Z' : p.date,
    modified: p.modified_gmt ? p.modified_gmt + 'Z' : p.modified,
    image: img,
    imageAlt: media?.alt_text || stripTags(p.title?.rendered),
    author: p._embedded?.author?.[0]?.name || 'Xerovan',
    minutes: Math.max(1, Math.round(cjk ? chars / 500 : words / 220)),
    // Optional: a translation slug in another language, set via a WP custom field "translations" = "kr:slug-ko,ja:slug-ja"
    translations: Object.fromEntries(String(p.meta?.translations || '')
      .split(',').map((x) => x.trim().split(':')).filter((x) => x.length === 2 && LANGS[x[0]])),
  };
}

const fmtDate = (iso, lang) => {
  try { return new Date(iso).toLocaleDateString(LANGS[lang].locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Dubai' }); }
  catch { return iso?.slice(0, 10) || ''; }
};

// ---------------------------------------------------------------- page shell
function layout({ lang, title, description, canonical, alternates, ogImage, ogType = 'website', body, jsonLd }) {
  const L = LANGS[lang], t = T[lang];
  const alts = (alternates || Object.keys(LANGS).map((k) => [k, `${SITE}/${k}/blog`]))
    .map(([k, href]) => `<link rel="alternate" hreflang="${LANGS[k].hl}" href="${esc(href)}">`).join('\n  ');
  const langLinks = Object.entries(LANGS).map(([k, v]) => {
    const alt = (alternates || []).find(([a]) => a === k);
    const href = alt ? alt[1].replace(SITE, '') : `/${k}/blog`;
    return `<a href="${esc(href)}" data-lang="${k}" hreflang="${v.hl}" lang="${v.hl}"${k === lang ? ' aria-current="true"' : ''}>${v.name}</a>`;
  }).join('');
  const font = lang === 'kr' ? "'Noto Sans KR'," : lang === 'ja' ? "'Noto Sans JP'," : lang === 'ar' ? "'Noto Sans Arabic'," : '';
  const fontParam = lang === 'kr' ? '&family=Noto+Sans+KR:wght@400;500;700' : lang === 'ja' ? '&family=Noto+Sans+JP:wght@400;500;700' : lang === 'ar' ? '&family=Noto+Sans+Arabic:wght@400;500;700' : '';

  return `<!DOCTYPE html>
<html lang="${L.hl}"${L.rtl ? ' dir="rtl"' : ''}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="icon" type="image/png" href="/images/favicon.png">
  <link rel="canonical" href="${esc(canonical)}">
  ${alts}
  <link rel="alternate" type="application/rss+xml" title="${esc(t.title)}" href="${SITE}/${lang}/blog/feed.xml">
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="Xerovan">
  <meta property="og:locale" content="${L.og}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${esc(ogImage || `${SITE}/images/og-preview.jpg`)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@XerovanC">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(ogImage || `${SITE}/images/og-preview.jpg`)}">
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500${fontParam}&display=swap" rel="stylesheet">
  <style>
    :root{--void:#0a0b0d;--panel:#131417;--panel-2:#1b1d21;--panel-3:#0f1012;--line:#232529;--line-soft:#1a1c20;--silver-100:#f6f7f9;--silver-300:#d4d7dc;--silver-500:#9ba0a8;--silver-700:#5c6068;--ice:#8fe3ee;--text-dim:#83878f;--radius:16px;
      --f-display:'Unbounded',${font}sans-serif; --f-body:'Inter',${font}sans-serif; --f-mono:'JetBrains Mono',${font}monospace;}
    *{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{background:var(--void);color:var(--silver-100);font-family:var(--f-body);-webkit-font-smoothing:antialiased;overflow-x:hidden;${lang === 'kr' ? 'word-break:keep-all;' : ''}}
    a{color:inherit;text-decoration:none}
    img{max-width:100%;display:block}
    ::selection{background:var(--ice);color:#0a0b0d}
    :focus-visible{outline:2px solid var(--ice);outline-offset:3px}
    .wrap{max-width:1180px;margin:0 auto;padding:0 32px}
    @media(max-width:600px){.wrap{padding:0 16px}}

    header{position:sticky;top:0;z-index:50;backdrop-filter:blur(14px);background:rgba(10,11,13,.78);border-bottom:1px solid var(--line)}
    nav{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:14px 32px;max-width:1180px;margin:0 auto}
    @media(max-width:600px){nav{padding:12px 16px}}
    .brand{display:flex;align-items:center;gap:10px}
    .brand img{height:26px;width:auto}.brand img.wm{height:20px}
    .nav-right{display:flex;align-items:center;gap:22px;font-size:13.5px;font-weight:600;color:var(--silver-300)}
    .nav-right > a:hover{color:var(--silver-100)}
    .nav-right > a[aria-current="page"]{color:var(--silver-100)}
    @media(max-width:600px){.nav-right > a.hide-sm{display:none}}
    .lang-menu{position:relative}
    .lang-menu summary{list-style:none;cursor:pointer;padding:8px 14px;border:1px solid var(--line);border-radius:100px;font-family:var(--f-mono);font-size:11.5px;letter-spacing:.1em;color:var(--silver-300);display:flex;gap:8px;align-items:center}
    .lang-menu summary::-webkit-details-marker{display:none}
    .lang-menu summary::after{content:'▾';font-size:10px;opacity:.7}
    .lang-menu[open] summary,.lang-menu summary:hover{color:var(--silver-100);border-color:var(--silver-500)}
    .lang-list{position:absolute;top:calc(100% + 8px);inset-inline-end:0;min-width:170px;padding:6px;background:var(--panel);border:1px solid var(--line);border-radius:12px;box-shadow:0 24px 60px -20px rgba(0,0,0,.7);display:flex;flex-direction:column}
    .lang-list a{padding:10px 14px;border-radius:8px;font-size:14px;font-weight:500;color:var(--silver-300);font-family:'Inter','Noto Sans KR','Noto Sans JP','Noto Sans Arabic',sans-serif}
    .lang-list a:hover{background:var(--panel-2);color:var(--silver-100)}
    .lang-list a[aria-current="true"]{color:var(--ice)}

    .eyebrow{font-family:var(--f-mono);font-size:12px;letter-spacing:.2em;color:var(--ice);text-transform:uppercase;display:inline-flex;align-items:center;gap:10px;margin-bottom:16px}
    .eyebrow::after{content:'';width:20px;height:1px;background:var(--ice);opacity:.5}
    .metal{background:linear-gradient(100deg,var(--silver-300) 0%,var(--silver-100) 25%,#fff 42%,var(--silver-300) 60%,var(--silver-500) 78%,var(--silver-100) 100%);background-size:260% 100%;-webkit-background-clip:text;background-clip:text;color:transparent}
    @media(prefers-reduced-motion:no-preference){.metal{animation:shine 8s ease-in-out infinite}}
    @keyframes shine{0%{background-position:0% 50%}100%{background-position:100% 50%}}

    .blog-hero{padding:90px 0 50px;border-bottom:1px solid var(--line-soft)}
    .blog-hero h1{font-family:var(--f-display);font-weight:600;font-size:clamp(30px,5vw,52px);line-height:1.08;letter-spacing:-.01em}
    .blog-hero p{margin-top:18px;max-width:600px;color:var(--silver-500);font-size:16px;line-height:1.65}

    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;padding:56px 0 30px}
    @media(max-width:960px){.grid{grid-template-columns:1fr 1fr}}
    @media(max-width:620px){.grid{grid-template-columns:1fr}}
    .card{display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;transition:border-color .2s ease,transform .2s ease;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
    .card:hover{border-color:var(--silver-700);transform:translateY(-2px)}
    .card .thumb{aspect-ratio:16/9;background:var(--panel-2);overflow:hidden}
    .card .thumb img{width:100%;height:100%;object-fit:cover}
    .card .thumb.ph{background:repeating-linear-gradient(100deg,rgba(255,255,255,.04) 0 1px,transparent 1px 3px),linear-gradient(160deg,#2a2c31,#131417 60%,#1b1d21)}
    .card .body{padding:22px 22px 24px;display:flex;flex-direction:column;gap:12px;flex:1}
    .meta{font-family:var(--f-mono);font-size:11px;letter-spacing:.06em;color:var(--text-dim)}
    .card h2{font-family:var(--f-display);font-size:17px;font-weight:600;line-height:1.35}
    .card p{color:var(--silver-500);font-size:14px;line-height:1.65;flex:1}
    .card .more{font-family:var(--f-mono);font-size:11.5px;color:var(--ice);letter-spacing:.04em}
    .card.featured{grid-column:1/-1;flex-direction:row}
    .card.featured .thumb{flex:1.25;aspect-ratio:auto;min-height:300px}
    .card.featured .body{flex:1;padding:36px;justify-content:center}
    .card.featured h2{font-size:clamp(20px,2.6vw,28px)}
    @media(max-width:820px){.card.featured{flex-direction:column}.card.featured .thumb{aspect-ratio:16/9;min-height:0}.card.featured .body{padding:24px}}

    .pager{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:10px 0 90px;font-family:var(--f-mono);font-size:12px;color:var(--text-dim)}
    .pager a{padding:11px 20px;border:1px solid var(--line);border-radius:100px;color:var(--silver-300)}
    .pager a:hover{border-color:var(--silver-500);color:var(--silver-100)}
    .empty{padding:80px 0 120px;color:var(--silver-500);font-size:15px}

    .post-head{max-width:780px;margin:0 auto;padding:80px 0 34px}
    .crumb{font-family:var(--f-mono);font-size:12px;color:var(--text-dim);margin-bottom:26px;display:flex;gap:8px;flex-wrap:wrap}
    .crumb a:hover{color:var(--silver-100)}
    .post-head h1{font-family:var(--f-display);font-weight:600;font-size:clamp(28px,4.4vw,46px);line-height:1.14;letter-spacing:-.01em}
    .post-head .meta{margin-top:22px}
    .cover{max-width:1000px;margin:0 auto 10px;border-radius:var(--radius);overflow:hidden;border:1px solid var(--line)}
    .cover img{width:100%;height:auto}
    .prose{max-width:720px;margin:0 auto;padding:44px 0 40px;color:var(--silver-300);font-size:17px;line-height:1.85}
    .prose > * + *{margin-top:1.2em}
    .prose h2,.prose h3,.prose h4{font-family:var(--f-display);color:var(--silver-100);line-height:1.3;margin-top:2.1em}
    .prose h2{font-size:24px}.prose h3{font-size:19px}.prose h4{font-size:16px}
    .prose a{color:var(--ice);border-bottom:1px solid rgba(143,227,238,.35)}
    .prose a:hover{border-bottom-color:var(--ice)}
    .prose strong{color:var(--silver-100)}
    .prose ul,.prose ol{padding-inline-start:1.4em}
    .prose li + li{margin-top:.5em}
    .prose blockquote{border-inline-start:2px solid var(--ice);padding:4px 0;padding-inline-start:20px;color:var(--silver-100);font-size:18px}
    .prose img,.prose video,.prose iframe{border-radius:12px;max-width:100%;height:auto}
    .prose figure{margin-inline:0}
    .prose figcaption{font-size:13px;color:var(--text-dim);margin-top:10px;text-align:center}
    .prose pre{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:18px;overflow-x:auto;font-size:14px;line-height:1.6;direction:ltr}
    .prose code{font-family:var(--f-mono);font-size:.9em;background:var(--panel-2);padding:2px 6px;border-radius:6px}
    .prose pre code{background:none;padding:0}
    .prose table{width:100%;border-collapse:collapse;font-size:15px;display:block;overflow-x:auto}
    .prose th,.prose td{border-bottom:1px solid var(--line);padding:10px 12px;text-align:start}
    .prose hr{border:none;border-top:1px solid var(--line);margin:2.4em 0}
    .post-foot{max-width:720px;margin:0 auto;padding:10px 0 100px;border-top:1px solid var(--line-soft);padding-top:30px;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}
    .btn{font-family:var(--f-display);font-size:12.5px;font-weight:600;padding:14px 24px;border-radius:100px;border:1px solid var(--line);color:var(--silver-300)}
    .btn:hover{border-color:var(--silver-500);color:var(--silver-100)}
    .btn.primary{background:linear-gradient(180deg,#fff 0%,#e2e6ea 35%,#b7bec4 60%,#eef1f3 100%);color:#0a0b0d;border:none}

    footer{padding:44px 0;border-top:1px solid var(--line);background:var(--panel-3);font-family:var(--f-mono);font-size:11px;color:var(--text-dim)}
    footer .wrap{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}
    footer a:hover{color:var(--silver-100)}
  </style>
</head>
<body>
<header>
  <nav>
    <a href="/${lang}/" class="brand" aria-label="Xerovan">
      <img src="/images/logo-icon.png" alt="Xerovan">
      <img src="/images/logo-wordmark.png" alt="XEROVAN" class="wm">
    </a>
    <div class="nav-right">
      <a href="/${lang}/" class="hide-sm">${esc(t.home)}</a>
      <a href="/${lang}/blog" aria-current="page">${esc(t.blog)}</a>
      <details class="lang-menu">
        <summary aria-label="Language">${L.short}</summary>
        <div class="lang-list">${langLinks}</div>
      </details>
    </div>
  </nav>
</header>
<main>
${body}
</main>
<footer>
  <div class="wrap">
    <span>© ${new Date().getFullYear()} Xerovan. All rights reserved.</span>
    <span><a href="/${lang}/">xerovan.com</a> · <a href="/${lang}/blog/feed.xml">RSS</a></span>
  </div>
</footer>
<script>
  document.querySelectorAll('.lang-list a').forEach(function(a){
    a.addEventListener('click', function(){ document.cookie = 'xv_lang=' + a.dataset.lang + '; path=/; max-age=31536000; SameSite=Lax'; });
  });
  document.addEventListener('click', function(e){ var m=document.querySelector('.lang-menu'); if(m && m.open && !m.contains(e.target)) m.open=false; });
</script>
</body>
</html>`;
}

// ---------------------------------------------------------------- views
function listView(lang, posts, page, pages) {
  const t = T[lang];
  const card = (p, featured) => `
    <a class="card${featured ? ' featured' : ''}" href="/${lang}/blog/${esc(p.slug)}">
      <div class="thumb${p.image ? '' : ' ph'}">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.imageAlt)}" loading="${featured ? 'eager' : 'lazy'}">` : ''}</div>
      <div class="body">
        <div class="meta">${esc(fmtDate(p.date, lang))} · ${p.minutes} ${esc(t.min)}</div>
        <h2>${esc(p.title)}</h2>
        <p>${esc(p.excerpt)}</p>
        <span class="more">${esc(t.read)} ${LANGS[lang].rtl ? '←' : '→'}</span>
      </div>
    </a>`;
  const cards = posts.length
    ? `<div class="grid">${posts.map((p, i) => card(p, page === 1 && i === 0 && posts.length > 2)).join('')}</div>`
    : `<p class="empty">${esc(t.empty)}</p>`;
  const prev = page > 1 ? `<a href="/${lang}/blog${page - 1 > 1 ? `/page/${page - 1}` : ''}">${LANGS[lang].rtl ? '→' : '←'} ${esc(t.newer)}</a>` : '<span></span>';
  const next = page < pages ? `<a href="/${lang}/blog/page/${page + 1}">${esc(t.older)} ${LANGS[lang].rtl ? '←' : '→'}</a>` : '<span></span>';
  return `
  <section class="blog-hero"><div class="wrap">
    <span class="eyebrow">${esc(t.blog)}</span>
    <h1 class="metal">${esc(t.title)}</h1>
    <p>${esc(t.intro)}</p>
  </div></section>
  <div class="wrap">
    ${cards}
    ${pages > 1 ? `<div class="pager">${prev}<span>${esc(t.page)} ${page} / ${pages}</span>${next}</div>` : '<div style="height:60px"></div>'}
  </div>`;
}

function postView(lang, p) {
  const t = T[lang];
  return `
  <article>
    <div class="wrap">
      <header class="post-head">
        <div class="crumb"><a href="/${lang}/">${esc(t.home)}</a><span>/</span><a href="/${lang}/blog">${esc(t.blog)}</a></div>
        <h1>${esc(p.title)}</h1>
        <div class="meta">${esc(fmtDate(p.date, lang))} · ${esc(p.author)} · ${p.minutes} ${esc(t.min)}</div>
      </header>
      ${p.image ? `<figure class="cover"><img src="${esc(p.image)}" alt="${esc(p.imageAlt)}"></figure>` : ''}
      <div class="prose">${p.content}</div>
      <div class="post-foot">
        <a class="btn" href="/${lang}/blog">${LANGS[lang].rtl ? '→' : '←'} ${esc(t.back)}</a>
        <a class="btn primary" href="/${lang}/#waitlist">Xerovan ${LANGS[lang].rtl ? '←' : '→'}</a>
      </div>
    </div>
  </article>`;
}

function messageView(lang, heading, text) {
  return `<section class="blog-hero"><div class="wrap"><h1 class="metal">${esc(heading)}</h1><p>${esc(text)}</p>
    <p style="margin-top:30px"><a class="btn" href="/${lang}/blog">${esc(T[lang].back)}</a></p></div></section><div style="height:120px"></div>`;
}

// ---------------------------------------------------------------- sitemap / rss
async function sitemap() {
  // Always returns a valid sitemap: blog index pages are listed even if WordPress is unreachable.
  const urls = [];
  for (const lang of Object.keys(LANGS)) {
    urls.push({ loc: `${SITE}/${lang}/blog`, lastmod: null });
    try {
      const cat = await categoryId(lang);
      if (!cat) continue;
      for (let page = 1; page <= 20; page++) {
        const { data, pages } = await wp(`posts?categories=${cat}&per_page=100&page=${page}&_fields=slug,modified_gmt`);
        data.forEach((p) => urls.push({ loc: `${SITE}/${lang}/blog/${p.slug}`, lastmod: p.modified_gmt ? p.modified_gmt + 'Z' : null }));
        if (page >= pages) break;
      }
    } catch (e) {
      console.error('[blog-sitemap]', lang, e.message);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`;
}

function rss(lang, posts) {
  const t = T[lang];
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(t.title)}</title>
  <link>${SITE}/${lang}/blog</link>
  <atom:link href="${SITE}/${lang}/blog/feed.xml" rel="self" type="application/rss+xml"/>
  <description>${esc(t.intro)}</description>
  <language>${LANGS[lang].hl}</language>
${posts.map((p) => `  <item>
    <title>${esc(p.title)}</title>
    <link>${SITE}/${lang}/blog/${esc(p.slug)}</link>
    <guid isPermaLink="true">${SITE}/${lang}/blog/${esc(p.slug)}</guid>
    <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    <description>${esc(p.excerpt)}</description>
  </item>`).join('\n')}
</channel>
</rss>`;
}

// ---------------------------------------------------------------- handler
module.exports = async (req, res) => {
  const q = req.query || {};
  const send = (status, body, type = 'text/html; charset=utf-8', cache = 's-maxage=300, stale-while-revalidate=86400') => {
    res.statusCode = status;
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', status === 200 ? cache : 'public, max-age=0, s-maxage=60');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(body);
  };

  if (q.sitemap) {
    try { return send(200, await sitemap(), 'application/xml; charset=utf-8', 's-maxage=3600, stale-while-revalidate=86400'); }
    catch (e) { console.error(e); return send(503, '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>', 'application/xml'); }
  }

  const lang = LANGS[q.lang] ? q.lang : 'en';
  const t = T[lang];
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  // Accept ASCII and non-ASCII (e.g. Korean) slugs, whether the path arrives encoded or decoded.
  let slug = typeof q.slug === 'string' ? q.slug : '';
  try { slug = decodeURIComponent(slug); } catch { /* keep as is */ }
  slug = slug.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}\-_]/gu, '').slice(0, 200);

  try {
    const cat = await categoryId(lang);

    if (q.feed) {
      const { data } = cat ? await wp(`posts?categories=${cat}&per_page=20&_embed=wp:featuredmedia`) : { data: [] };
      return send(200, rss(lang, data.map((p) => shape(p, lang))), 'application/rss+xml; charset=utf-8');
    }

    if (slug) {
      const { data } = await wp(`posts?slug=${encodeURIComponent(slug)}&_embed=wp:featuredmedia,author`);
      const raw = data.find((p) => cat && (p.categories || []).includes(cat));
      if (!raw) {
        return send(404, layout({ lang, title: `${t.notFound} | Xerovan`, description: t.notFoundText, canonical: `${SITE}/${lang}/blog`, body: messageView(lang, t.notFound, t.notFoundText) }));
      }
      const p = shape(raw, lang);
      const canonical = `${SITE}/${lang}/blog/${p.slug}`;
      const alternates = [[lang, canonical], ...Object.entries(p.translations).map(([k, s]) => [k, `${SITE}/${k}/blog/${s}`])];
      return send(200, layout({
        lang, title: `${p.title} | Xerovan`, description: p.excerpt, canonical, alternates,
        ogImage: p.image ? `${SITE}${p.image}` : null, ogType: 'article',
        body: postView(lang, p),
        jsonLd: {
          '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.excerpt,
          datePublished: p.date, dateModified: p.modified, inLanguage: LANGS[lang].hl,
          mainEntityOfPage: canonical, image: p.image ? `${SITE}${p.image}` : `${SITE}/images/og-preview.jpg`,
          author: { '@type': 'Organization', name: 'Xerovan' },
          publisher: { '@type': 'Organization', name: 'Xerovan', logo: { '@type': 'ImageObject', url: `${SITE}/images/logo-icon.png` } },
        },
      }));
    }

    const { data, pages } = cat
      ? await wp(`posts?categories=${cat}&per_page=${PER_PAGE}&page=${page}&_embed=wp:featuredmedia`)
      : { data: [], pages: 0 };
    if (page > 1 && !data.length) {
      return send(404, layout({ lang, title: `${t.notFound} | Xerovan`, description: t.notFoundText, canonical: `${SITE}/${lang}/blog`, body: messageView(lang, t.notFound, t.notFoundText) }));
    }
    const canonical = `${SITE}/${lang}/blog${page > 1 ? `/page/${page}` : ''}`;
    return send(200, layout({
      lang, title: page > 1 ? `${t.title} — ${t.page} ${page}` : t.title, description: t.intro, canonical,
      body: listView(lang, data.map((p) => shape(p, lang)), page, pages),
      jsonLd: { '@context': 'https://schema.org', '@type': 'Blog', name: t.title, url: `${SITE}/${lang}/blog`, inLanguage: LANGS[lang].hl },
    }));
  } catch (e) {
    console.error('[blog]', e);
    return send(503, layout({ lang, title: `${t.down} | Xerovan`, description: t.downText, canonical: `${SITE}/${lang}/blog`, body: messageView(lang, t.down, t.downText) }));
  }
};
