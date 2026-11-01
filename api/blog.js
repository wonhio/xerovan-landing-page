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

const SOL = require('./_solutions.js');
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

// Topic categories (WordPress category slugs). A post = one language category + one topic category.
const TOPICS = ['news', 'manual', 'guide'];
const TOPIC_LABEL = {
  en: { all: 'All', news: 'Xerovan News', manual: 'Manual', guide: 'Crypto & Payments Guide' },
  kr: { all: '전체', news: 'Xerovan 소식', manual: '매뉴얼', guide: '크립토·결제 가이드' },
  ja: { all: 'すべて', news: 'Xerovanニュース', manual: 'マニュアル', guide: '暗号資産・決済ガイド' },
  es: { all: 'Todo', news: 'Novedades de Xerovan', manual: 'Manual', guide: 'Guía de cripto y pagos' },
  ar: { all: 'الكل', news: 'أخبار Xerovan', manual: 'دليل الاستخدام', guide: 'دليل العملات المشفرة والمدفوعات' },
  pt: { all: 'Todos', news: 'Novidades da Xerovan', manual: 'Manual', guide: 'Guia de cripto e pagamentos' },
};
const TOPIC_INTRO = {
  en: { news: 'Launch updates, new features and partnerships.', manual: 'Step-by-step help for using the Xerovan app.', guide: 'Crypto and blockchain basics, plus fixes for everyday payment, travel and business problems.' },
  kr: { news: '출시 소식, 새 기능, 파트너십 소식을 전합니다.', manual: 'Xerovan 앱 사용법을 단계별로 안내합니다.', guide: '크립토·블록체인 기초와 해외결제·여행·비즈니스 결제 문제 해결법.' },
  ja: { news: 'ローンチ情報、新機能、パートナーシップのお知らせ。', manual: 'Xerovanアプリの使い方をステップごとにご案内します。', guide: '暗号資産・ブロックチェーンの基礎と、決済・旅行・ビジネスの課題解決。' },
  es: { news: 'Novedades del lanzamiento, nuevas funciones y alianzas.', manual: 'Ayuda paso a paso para usar la app Xerovan.', guide: 'Conceptos básicos de cripto y blockchain, y soluciones para pagos, viajes y negocios.' },
  ar: { news: 'تحديثات الإطلاق والمزايا الجديدة والشراكات.', manual: 'إرشادات خطوة بخطوة لاستخدام تطبيق Xerovan.', guide: 'أساسيات العملات المشفرة والبلوكتشين، وحلول لمشكلات الدفع والسفر والأعمال.' },
  pt: { news: 'Novidades do lançamento, novos recursos e parcerias.', manual: 'Ajuda passo a passo para usar o app Xerovan.', guide: 'Noções de cripto e blockchain, e soluções para pagamentos, viagens e negócios.' },
};

// Legal documents: same Google Sheet the site used for its footer modal (columns: Title, Content).
const LEGAL_SHEET = process.env.LEGAL_SHEET_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTmXKE-ZqjHlT6Vw8NnS4qKxX8zC77y3tGWVk1HZeFyupirEUfRb8nGTsI3-_d1pcLrWHuxMm8UiHUO/pub?gid=1700406003&single=true&output=csv';
const LEGAL_DOCS = { terms: 'terms', privacy: 'privacy', refund: 'refund', 'risk-disclosure': 'risk', compliance: 'compliance' }; // url slug → keyword in sheet title
const LEGAL_NAMES = {
  en: { terms: 'Terms & Conditions', privacy: 'Privacy Policy', refund: 'Refund Policy', 'risk-disclosure': 'Risk Disclosure', compliance: 'Compliance', legal: 'Legal', note: '', soon: 'This document will be published soon.' },
  kr: { terms: '이용약관', privacy: '개인정보 처리방침', refund: '환불 정책', 'risk-disclosure': '위험 고지', compliance: '컴플라이언스', legal: '법적 고지', note: '이 문서는 영어 원문으로 제공됩니다.', soon: '이 문서는 곧 게시됩니다.' },
  ja: { terms: '利用規約', privacy: 'プライバシーポリシー', refund: '返金ポリシー', 'risk-disclosure': 'リスク開示', compliance: 'コンプライアンス', legal: '法的情報', note: '本書は英語の原文で提供されています。', soon: 'この文書は近日公開予定です。' },
  es: { terms: 'Términos y condiciones', privacy: 'Política de privacidad', refund: 'Política de reembolso', 'risk-disclosure': 'Divulgación de riesgos', compliance: 'Cumplimiento normativo', legal: 'Legal', note: 'Este documento se ofrece en su versión original en inglés.', soon: 'Este documento se publicará pronto.' },
  ar: { terms: 'الشروط والأحكام', privacy: 'سياسة الخصوصية', refund: 'سياسة الاسترداد', 'risk-disclosure': 'الإفصاح عن المخاطر', compliance: 'الامتثال', legal: 'قانوني', note: 'يُقدَّم هذا المستند بنسخته الإنجليزية الأصلية.', soon: 'سيُنشر هذا المستند قريبًا.' },
  pt: { terms: 'Termos e condições', privacy: 'Política de privacidade', refund: 'Política de reembolso', 'risk-disclosure': 'Divulgação de riscos', compliance: 'Conformidade', legal: 'Jurídico', note: 'Este documento é fornecido na versão original em inglês.', soon: 'Este documento será publicado em breve.' },
};

function parseCSV(text) {
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (q) { if (c === '"' && n === '"') { field += '"'; i++; } else if (c === '"') q = false; else field += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}

let legalCache = { at: 0, docs: null };
/** { terms: {title, content}, ... } for documents that have real content (≥ 120 characters). */
async function legalDocs() {
  if (legalCache.docs && Date.now() - legalCache.at < 600000) return legalCache.docs;
  const r = await fetch(LEGAL_SHEET);
  if (!r.ok) throw new Error(`legal sheet ${r.status}`);
  const rows = parseCSV(await r.text()); rows.shift();
  const docs = {};
  for (const [slug, kw] of Object.entries(LEGAL_DOCS)) {
    const row = rows.find((x) => (x[0] || '').toLowerCase().includes(kw));
    if (row && (row[1] || '').trim().length >= 120) docs[slug] = { title: row[0].trim(), content: row[1].trim() };
  }
  legalCache = { at: Date.now(), docs };
  return docs;
}

// About page + founder (used on /{lang}/about and in the author box under posts)
const FOUNDER = 'Jay Yoon';
const CONTACT_EMAIL = 'hello@xerovan.com';
const HQ = 'Dubai, UAE';
const ABOUT = {
  en: { title: 'About Xerovan', eyebrow: 'About', h1: 'Moving money across borders, without the borders.',
    p: ['Sending money or paying abroad is still slow and expensive. Transfers can take days, exchange and foreign-transaction fees add up on every payment, and the payment methods you can use change from country to country.',
        'Xerovan rebuilds this around stablecoins. From a wallet for your digital assets to a Visa card you can use worldwide, and on to travel and business payments, our goal is to connect it all in one app that is faster and more transparent.'],
    founder: 'Founder', role: 'Founder, Xerovan',
    bio: 'Jay Yoon is an entrepreneur who has run cross-border businesses between Singapore, Dubai and Georgia. Paying and getting paid by customers and partners in different countries, he ran into slow transfers, repeated exchange costs and payment limits that change by country, and started Xerovan to solve them with stablecoins.',
    company: 'Company', hq: 'Headquarters', contact: 'Contact', cta: 'Join the waitlist',
    short: 'Founder of Xerovan. Runs cross-border businesses between Singapore, Dubai and Georgia.', by: 'Written by' },
  kr: { title: 'Xerovan 소개', eyebrow: '회사 소개', h1: '국경을 넘는 돈의 이동을, 국경 없이.',
    p: ['해외로 돈을 보내거나 결제하는 일은 여전히 느리고 비쌉니다. 송금은 며칠씩 걸리고, 환전과 해외결제 수수료는 거래할 때마다 붙으며, 나라마다 쓸 수 있는 결제 수단도 다릅니다.',
        'Xerovan은 스테이블코인을 기반으로 이 과정을 다시 설계합니다. 디지털 자산을 보관하는 지갑부터 전 세계에서 쓰는 Visa 카드, 여행과 비즈니스 결제까지 하나의 앱에서 더 빠르고 투명하게 연결하는 것이 Xerovan의 목표입니다.'],
    founder: '창업자', role: 'Xerovan 창업자',
    bio: 'Jay Yoon은 싱가포르, 두바이, 조지아를 오가며 국경을 넘는 사업을 운영해 온 창업가입니다. 여러 나라의 고객·파트너와 대금을 주고받으며 느린 송금, 반복되는 환전 비용, 나라마다 다른 결제 제약을 직접 겪었고, 이 문제를 스테이블코인으로 풀기 위해 Xerovan을 시작했습니다.',
    company: '회사 정보', hq: '본사', contact: '문의', cta: '대기자 명단 등록',
    short: 'Xerovan 창업자. 싱가포르·두바이·조지아를 오가며 국경을 넘는 사업을 운영합니다.', by: '작성자' },
  ja: { title: 'Xerovanについて', eyebrow: '会社概要', h1: '国境を越えるお金の移動を、国境なく。',
    p: ['海外への送金や支払いは、いまも時間がかかり、コストも高いままです。送金には数日かかることがあり、両替や海外決済の手数料は取引のたびに発生し、使える決済手段も国によって異なります。',
        'Xerovanはステーブルコインを基盤に、この仕組みをつくり直します。デジタル資産を管理するウォレットから、世界中で使えるVisaカード、旅行やビジネスの支払いまで、ひとつのアプリでより速く、より透明につなぐことがXerovanの目標です。'],
    founder: '創業者', role: 'Xerovan 創業者',
    bio: 'Jay Yoonは、シンガポール、ドバイ、ジョージアを拠点に国境を越えるビジネスを運営してきた起業家です。各国の顧客やパートナーとの支払いのなかで、遅い送金、繰り返される両替コスト、国ごとに異なる決済の制約を自ら経験し、ステーブルコインでこれらを解決するためにXerovanを立ち上げました。',
    company: '会社情報', hq: '所在地', contact: 'お問い合わせ', cta: 'ウェイトリストに登録',
    short: 'Xerovan創業者。シンガポール、ドバイ、ジョージアを拠点に国境を越えるビジネスを運営。', by: '執筆者' },
  es: { title: 'Sobre Xerovan', eyebrow: 'Sobre nosotros', h1: 'Mover dinero entre países, sin fronteras.',
    p: ['Enviar dinero o pagar en el extranjero sigue siendo lento y caro. Las transferencias pueden tardar días, las comisiones de cambio y por operaciones en el extranjero se acumulan en cada pago, y los medios de pago disponibles cambian de un país a otro.',
        'Xerovan reconstruye este proceso sobre stablecoins. Desde una wallet para tus activos digitales hasta una tarjeta Visa que puedes usar en todo el mundo, pasando por pagos de viajes y de empresa, nuestro objetivo es conectarlo todo en una sola app, más rápida y transparente.'],
    founder: 'Fundador', role: 'Fundador de Xerovan',
    bio: 'Jay Yoon es un emprendedor que ha dirigido negocios internacionales entre Singapur, Dubái y Georgia. Al pagar y cobrar a clientes y socios de distintos países, se encontró con transferencias lentas, costes de cambio repetidos y límites de pago que varían según el país, y fundó Xerovan para resolverlos con stablecoins.',
    company: 'Empresa', hq: 'Sede', contact: 'Contacto', cta: 'Únete a la lista de espera',
    short: 'Fundador de Xerovan. Dirige negocios internacionales entre Singapur, Dubái y Georgia.', by: 'Escrito por' },
  ar: { title: 'عن Xerovan', eyebrow: 'من نحن', h1: 'نقل الأموال عبر الحدود، بلا حدود.',
    p: ['لا يزال إرسال الأموال أو الدفع في الخارج بطيئًا ومكلفًا. فقد تستغرق التحويلات أيامًا، وتتراكم رسوم الصرف والمعاملات الدولية مع كل عملية دفع، وتختلف وسائل الدفع المتاحة من بلد إلى آخر.',
        'تعيد Xerovan بناء هذه العملية على أساس العملات المستقرة. من محفظة لأصولك الرقمية إلى بطاقة Visa تستخدمها حول العالم، وصولًا إلى مدفوعات السفر والأعمال، هدفنا أن نربط كل ذلك في تطبيق واحد أسرع وأكثر شفافية.'],
    founder: 'المؤسس', role: 'مؤسس Xerovan',
    bio: 'جاي يون (Jay Yoon) رائد أعمال يدير أعمالًا عابرة للحدود بين سنغافورة ودبي وجورجيا. وخلال الدفع والتحصيل مع عملاء وشركاء في دول مختلفة، واجه بطء التحويلات وتكرار تكاليف الصرف وقيود الدفع التي تختلف من بلد لآخر، فأسّس Xerovan لحلّها باستخدام العملات المستقرة.',
    company: 'الشركة', hq: 'المقر', contact: 'تواصل معنا', cta: 'انضم إلى قائمة الانتظار',
    short: 'مؤسس Xerovan. يدير أعمالًا عابرة للحدود بين سنغافورة ودبي وجورجيا.', by: 'بقلم' },
  pt: { title: 'Sobre a Xerovan', eyebrow: 'Sobre nós', h1: 'Movimentar dinheiro entre países, sem fronteiras.',
    p: ['Enviar dinheiro ou pagar no exterior ainda é lento e caro. Transferências podem levar dias, taxas de câmbio e de transações internacionais se somam a cada pagamento, e os meios de pagamento disponíveis mudam de um país para outro.',
        'A Xerovan reconstrói esse processo com base em stablecoins. De uma carteira para seus ativos digitais a um cartão Visa aceito no mundo todo, passando por pagamentos de viagens e de empresas, nosso objetivo é conectar tudo em um só app, mais rápido e transparente.'],
    founder: 'Fundador', role: 'Fundador da Xerovan',
    bio: 'Jay Yoon é um empreendedor que administra negócios internacionais entre Singapura, Dubai e Geórgia. Ao pagar e receber de clientes e parceiros em diferentes países, enfrentou transferências lentas, custos de câmbio repetidos e limites de pagamento que mudam de país para país, e criou a Xerovan para resolvê-los com stablecoins.',
    company: 'Empresa', hq: 'Sede', contact: 'Contato', cta: 'Entrar na lista de espera',
    short: 'Fundador da Xerovan. Administra negócios internacionais entre Singapura, Dubai e Geórgia.', by: 'Escrito por' },
};
const founderLD = (lang) => ({ '@type': 'Person', name: FOUNDER, jobTitle: 'Founder', url: `${SITE}/${lang}/about`,
  worksFor: { '@type': 'Organization', name: 'Xerovan', url: `${SITE}/` } });
// WordPress accounts often show as "admin": posts by such an account are credited to the founder.
const isFounderAccount = (name) => !name || /^(admin|administrator|xerovan|jay|jay yoon)$/i.test(String(name).trim());

// Main menu — identical to the landing page nav (sections of /{lang}/ + Blog)
const MENU = {
  en: ['Home', 'Features', 'Use Cases', 'FAQ', 'Blog'],
  kr: ['홈', '기능', '활용 사례', 'FAQ', '블로그'],
  ja: ['ホーム', '機能', '活用例', 'FAQ', 'ブログ'],
  es: ['Inicio', 'Funciones', 'Casos de uso', 'FAQ', 'Blog'],
  ar: ['الرئيسية', 'المزايا', 'حالات الاستخدام', 'FAQ', 'المدونة'],
  pt: ['Início', 'Recursos', 'Casos de uso', 'FAQ', 'Blog'],
};
const MENU_ANCHORS = ['top', 'features', 'usecases', 'faq'];
const MENU_LABEL = {'en': 'Menu', 'kr': '메뉴', 'ja': 'メニュー', 'es': 'Menú', 'ar': 'القائمة', 'pt': 'Menu'};

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

let topicCache = { at: 0, map: null };
/** { news: <id>, manual: <id>, guide: <id> } for the topic categories that exist in WordPress. */
async function topicIds() {
  // Full map → keep 5 min; incomplete (a topic category not created yet) → re-check after 30 s.
  const ttl = topicCache.map && Object.keys(topicCache.map).length === TOPICS.length ? 300000 : 30000;
  if (topicCache.map && Date.now() - topicCache.at < ttl) return topicCache.map;
  const { data } = await wp(`categories?slug=${TOPICS.join(',')}&per_page=20&_fields=id,slug`);
  const map = {};
  data.forEach((c) => { if (TOPICS.includes(c.slug)) map[c.slug] = c.id; });
  topicCache = { at: Date.now(), map };
  return map;
}
const topicOf = (raw, tmap) => TOPICS.find((t) => tmap[t] && (raw.categories || []).includes(tmap[t])) || null;

const postsCache = new Map();
/** All published posts of one language (newest first), cached briefly; topic filtering + paging happen here. */
async function langPosts(lang, cat) {
  const c = postsCache.get(lang);
  if (c && Date.now() - c.at < 60000) return c.posts;
  const out = [];
  for (let page = 1; page <= 5; page++) {
    const { data, pages } = await wp(`posts?categories=${cat}&per_page=100&page=${page}&_embed=wp:featuredmedia`);
    out.push(...data);
    if (page >= pages) break;
  }
  postsCache.set(lang, { at: Date.now(), posts: out });
  return out;
}

function shape(p, lang, tmap = {}) {
  const media = p._embedded?.['wp:featuredmedia']?.[0];
  const img = media?.source_url ? publicize(media.source_url, lang) : null;
  const words = stripTags(p.content?.rendered).split(/\s+/).length;
  const chars = stripTags(p.content?.rendered).length;
  const cjk = lang === 'kr' || lang === 'ja';
  return {
    slug: p.slug,
    topic: topicOf(p, tmap),
    title: stripTags(p.title?.rendered),
    excerpt: clip(stripTags(p.excerpt?.rendered), 180),
    content: publicize(p.content?.rendered, lang),
    date: p.date_gmt ? p.date_gmt + 'Z' : p.date,
    modified: p.modified_gmt ? p.modified_gmt + 'Z' : p.modified,
    image: img,
    imageAlt: media?.alt_text || stripTags(p.title?.rendered),
    author: 'Admin', // shown on every post; structured data credits the Xerovan organization
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
function layout({ lang, title, description, canonical, alternates, ogImage, ogType = 'website', body, jsonLd, noindex = false, hreflang = true }) {
  const L = LANGS[lang], t = T[lang];
  const alts = !hreflang ? '' : (alternates || Object.keys(LANGS).map((k) => [k, `${SITE}/${k}/blog`]))
    .map(([k, href]) => `<link rel="alternate" hreflang="${k === 'x-default' ? 'x-default' : LANGS[k].hl}" href="${esc(href)}">`).join('\n  ');
  const langLinks = Object.entries(LANGS).map(([k, v]) => {
    const alt = (alternates || []).find(([a]) => a === k);
    const href = alt ? alt[1].replace(SITE, '') : `/${k}/blog`;
    return `<a href="${esc(href)}" data-lang="${k}" hreflang="${v.hl}" lang="${v.hl}"${k === lang ? ' aria-current="true"' : ''}>${v.name}</a>`;
  }).join('');
  const font = lang === 'kr' ? "'Noto Sans KR'," : lang === 'ja' ? "'Noto Sans JP'," : lang === 'ar' ? "'Noto Sans Arabic'," : '';
  const fontParam = lang === 'kr' ? '&family=Noto+Sans+KR:wght@400;500;700' : lang === 'ja' ? '&family=Noto+Sans+JP:wght@400;500;700' : lang === 'ar' ? '&family=Noto+Sans+Arabic:wght@400;500;700' : '';

  const menuLinks = MENU_ANCHORS.map((a, i) => `<a href="/${lang}/#${a}">${esc(MENU[lang][i])}</a>`).join('')
    + `<a href="/${lang}/blog"${/\/blog(\/|$)/.test(canonical) ? ' aria-current="page"' : ''}>${esc(MENU[lang][4])}</a>`;
  return `<!DOCTYPE html>
<html lang="${L.hl}"${L.rtl ? ' dir="rtl"' : ''}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="icon" type="image/png" href="/images/favicon.png">
  <link rel="canonical" href="${esc(canonical)}">${noindex ? '\n  <meta name="robots" content="noindex">' : ''}
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

    body>header{position:sticky;top:0;z-index:50;backdrop-filter:blur(14px);background:rgba(10,11,13,.78);border-bottom:1px solid var(--line)}
    nav{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:14px 32px;max-width:1180px;margin:0 auto}
    @media(max-width:600px){nav{padding:12px 16px}}
    .brand{display:flex;align-items:center;gap:10px}
    .brand img{height:26px;width:auto}.brand img.wm{height:20px}
    .nav-links{display:flex;gap:32px;font-size:13.5px;font-weight:600;color:var(--silver-300)}
    .nav-links a:hover,.nav-links a[aria-current="page"]{color:var(--silver-100)}
    @media(max-width:920px){.nav-links{display:none}}
    @media(max-width:380px){.brand img.wm{height:15px}.brand{gap:8px}}
    .nav-end{display:flex;align-items:center;gap:10px;}
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
    .lang-menu{position:relative}
    .lang-menu summary{list-style:none;cursor:pointer;padding:8px 14px;border:1px solid var(--line);border-radius:100px;font-family:var(--f-mono);font-size:11.5px;letter-spacing:.1em;color:var(--silver-300);display:flex;gap:8px;align-items:center}
    .lang-menu summary::-webkit-details-marker{display:none}
    .lang-menu summary::before{content:'';width:13px;height:13px;border:1.4px solid currentColor;border-radius:50%;box-shadow:inset 0 0 0 3px var(--void),inset 0 0 0 4.4px currentColor;opacity:.8}
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

    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;padding:32px 0 30px}
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

    .tabs{display:flex;gap:8px;overflow-x:auto;padding:30px 0 4px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
    .tabs::-webkit-scrollbar{display:none}
    .tab{white-space:nowrap;padding:10px 18px;border:1px solid var(--line);border-radius:100px;font-size:13.5px;font-weight:600;color:var(--silver-300);transition:border-color .2s ease,color .2s ease}
    .tab:hover{border-color:var(--silver-500);color:var(--silver-100)}
    .tab[aria-current="page"]{background:var(--silver-100);color:#0a0b0d;border-color:transparent}
    .chip{display:inline-block;font-family:var(--f-mono);font-size:10.5px;letter-spacing:.06em;color:var(--ice);border:1px solid rgba(143,227,238,.35);padding:3px 9px;border-radius:100px;margin-inline-end:8px;vertical-align:1px}
    .post-head .chip{margin-bottom:18px;font-size:11.5px;padding:5px 12px}
    .post-head .chip:hover{border-color:var(--ice)}
    .about-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:28px;padding:56px 0 30px}
    @media(max-width:860px){.about-grid{grid-template-columns:1fr}}
    .about-card{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:30px;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
    .about-card h2{font-family:var(--f-mono);font-size:12px;letter-spacing:.2em;color:var(--ice);text-transform:uppercase;margin-bottom:20px;font-weight:400}
    .person{display:flex;gap:18px;align-items:center;margin-bottom:18px}
    .avatar{width:56px;height:56px;flex-shrink:0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--f-display);font-weight:600;font-size:17px;color:#0a0b0d;background:linear-gradient(160deg,#f6f7f9 0%,#9ba0a8 45%,#5c6068 70%,#d4d7dc 100%)}
    .person .name{font-family:var(--f-display);font-size:18px;font-weight:600}
    .person .role{font-size:13.5px;color:var(--silver-500);margin-top:4px}
    .about-card p{color:var(--silver-300);font-size:15px;line-height:1.75}
    .facts{display:grid;gap:14px}
    .facts div{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid var(--line-soft);padding-bottom:12px;font-size:14.5px}
    .facts span:first-child{color:var(--text-dim);font-family:var(--f-mono);font-size:12px;letter-spacing:.06em}
    .facts a{color:var(--ice)}
    .mission{max-width:760px;padding-top:28px}
    .mission p{color:var(--silver-300);font-size:17px;line-height:1.8}
    .mission p + p{margin-top:16px}
    .author-box{max-width:720px;margin:0 auto 34px;display:flex;gap:16px;align-items:center;padding:22px 24px;background:var(--panel);border:1px solid var(--line);border-radius:var(--radius)}
    .author-box .lbl{font-family:var(--f-mono);font-size:11px;letter-spacing:.08em;color:var(--text-dim);text-transform:uppercase}
    .author-box .nm{font-family:var(--f-display);font-size:15px;font-weight:600;display:inline-block;margin:4px 0 6px}
    .author-box .nm:hover{color:var(--ice)}
    .author-box p{font-size:13.5px;color:var(--silver-500);line-height:1.6}
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

    .sol-hero p.lede{max-width:680px;margin:18px auto 0;color:var(--silver-300);font-size:17px;line-height:1.75}
    .sol-hero .cta-row{margin-top:30px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
    .sol{max-width:820px;margin:0 auto;padding:10px 0 40px}
    .sol section{margin-top:54px}
    .sol h2{font-family:var(--f-display);font-size:22px;line-height:1.3;color:var(--silver-100);margin-bottom:16px}
    .sol p{color:var(--silver-300);font-size:16px;line-height:1.8}
    .sol-list{list-style:none;display:grid;gap:12px}
    .sol-list li{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 18px;color:var(--silver-300);font-size:15.5px;line-height:1.6;padding-inline-start:44px;position:relative}
    .sol-list li::before{content:"";position:absolute;inset-inline-start:18px;top:23px;width:8px;height:8px;border-radius:50%;background:var(--ice)}
    .sol-steps{list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;counter-reset:s}
    @media(max-width:760px){.sol-steps{grid-template-columns:1fr}}
    .sol-steps li{counter-increment:s;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px;color:var(--silver-300);font-size:15px;line-height:1.6}
    .sol-steps li::before{content:"0" counter(s);display:block;font-family:var(--f-mono);color:var(--ice);font-size:12px;letter-spacing:.15em;margin-bottom:10px}
    .sol-faq details{border-bottom:1px solid var(--line);padding:18px 0}
    .sol-faq summary{cursor:pointer;font-weight:600;color:var(--silver-100);font-size:16px;line-height:1.5}
    .sol-faq details p{margin-top:12px;font-size:15.5px}
    .sol-cta{margin-top:60px;background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:34px;text-align:center}
    .sol-cta h2{margin-bottom:20px}
    .sol-note{margin-top:22px;font-size:13px !important;color:var(--text-dim) !important;line-height:1.6 !important}
    .sol-more{display:flex;gap:10px;flex-wrap:wrap}
    footer{padding:44px 0;border-top:1px solid var(--line);background:var(--panel-3);font-family:var(--f-mono);font-size:11px;color:var(--text-dim)}
    footer .wrap{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}
    footer a:hover{color:var(--silver-100)}
  </style>
  <!-- Vercel Web Analytics -->
  <script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
  <script defer src="/_vercel/insights/script.js"></script>
</head>
<body>
<header>
  <nav>
    <a href="/${lang}/" class="brand" aria-label="Xerovan">
      <img src="/images/logo-icon.png" alt="Xerovan">
      <img src="/images/logo-wordmark.png" alt="XEROVAN" class="wm">
    </a>
    <div class="nav-links">${menuLinks}</div>
    <div class="nav-end">
      <details class="lang-menu">
        <summary aria-label="Language">${L.short}</summary>
        <div class="lang-list">${langLinks}</div>
      </details>
      <button type="button" class="menu-btn" aria-label="${esc(MENU_LABEL[lang])}" aria-expanded="false" aria-controls="mobileMenu"><span></span><span></span><span></span></button>
    </div>
  </nav>
  <div class="mobile-menu" id="mobileMenu" hidden>${menuLinks}</div>
</header>
<main>
${body}
</main>
<footer>
  <div class="wrap">
    <span>© ${new Date().getFullYear()} Xerovan. All rights reserved.</span>
    <span>${SOL.SLUGS.map((k, i) => `<a href="/${lang}/solutions/${k}">${esc(SOL.UI[lang].short[i])}</a>`).join(' · ')}</span>
    <span><a href="/${lang}/">xerovan.com</a> · <a href="/${lang}/about">${esc(ABOUT[lang].eyebrow)}</a> · <a href="/${lang}/blog/feed.xml">RSS</a></span>
  </div>
</footer>
<script>
  document.querySelectorAll('.lang-list a').forEach(function(a){
    a.addEventListener('click', function(){ document.cookie = 'xv_lang=' + a.dataset.lang + '; path=/; max-age=31536000; SameSite=Lax'; });
  });
  document.addEventListener('click', function(e){ var m=document.querySelector('.lang-menu'); if(m && m.open && !m.contains(e.target)) m.open=false; });
  /* Mobile menu (☰) */
  (function () {
    var b = document.querySelector('.menu-btn'), m = document.getElementById('mobileMenu');
    if (!b || !m) return;
    function set(open) { m.hidden = !open; b.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    b.addEventListener('click', function (e) { e.stopPropagation(); set(m.hidden); var l = document.querySelector('.lang-menu'); if (l) l.open = false; });
    m.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    document.addEventListener('click', function (e) { if (!m.hidden && !m.contains(e.target) && !b.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  })();
</script>
</body>
</html>`;
}

const crumbs = (items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })),
});

// ---------------------------------------------------------------- views
function listView(lang, posts, page, pages, topic) {
  const t = T[lang], TL = TOPIC_LABEL[lang], rtl = LANGS[lang].rtl;
  const base = topic ? `/${lang}/blog/category/${topic}` : `/${lang}/blog`;
  const card = (p, featured) => `
    <a class="card${featured ? ' featured' : ''}" href="/${lang}/blog/${esc(p.slug)}">
      <div class="thumb${p.image ? '' : ' ph'}">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.imageAlt)}" loading="${featured ? 'eager' : 'lazy'}">` : ''}</div>
      <div class="body">
        <div class="meta">${p.topic && !topic ? `<span class="chip">${esc(TL[p.topic])}</span>` : ''}${esc(fmtDate(p.date, lang))} · ${p.minutes} ${esc(t.min)}</div>
        <h2>${esc(p.title)}</h2>
        <p>${esc(p.excerpt)}</p>
        <span class="more">${esc(t.read)} ${rtl ? '←' : '→'}</span>
      </div>
    </a>`;
  const tabs = `<div class="tabs" role="navigation" aria-label="${esc(t.blog)}">
      <a class="tab" href="/${lang}/blog"${!topic ? ' aria-current="page"' : ''}>${esc(TL.all)}</a>
      ${TOPICS.map((k) => `<a class="tab" href="/${lang}/blog/category/${k}"${topic === k ? ' aria-current="page"' : ''}>${esc(TL[k])}</a>`).join('')}
    </div>`;
  const cards = posts.length
    ? `<div class="grid">${posts.map((p, i) => card(p, page === 1 && i === 0 && posts.length > 2)).join('')}</div>`
    : `<p class="empty">${esc(t.empty)}</p>`;
  const prev = page > 1 ? `<a href="${base}${page - 1 > 1 ? `/page/${page - 1}` : ''}">${rtl ? '→' : '←'} ${esc(t.newer)}</a>` : '<span></span>';
  const next = page < pages ? `<a href="${base}/page/${page + 1}">${esc(t.older)} ${rtl ? '←' : '→'}</a>` : '<span></span>';
  return `
  <section class="blog-hero"><div class="wrap">
    <span class="eyebrow">${esc(topic ? t.title : t.blog)}</span>
    <h1 class="metal">${esc(topic ? TL[topic] : t.title)}</h1>
    <p>${esc(topic ? TOPIC_INTRO[lang][topic] : t.intro)}</p>
  </div></section>
  <div class="wrap">
    ${tabs}
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
        <div class="crumb"><a href="/${lang}/">${esc(t.home)}</a><span>/</span><a href="/${lang}/blog">${esc(t.blog)}</a>${p.topic ? `<span>/</span><a href="/${lang}/blog/category/${p.topic}">${esc(TOPIC_LABEL[lang][p.topic])}</a>` : ''}</div>
        ${p.topic ? `<a class="chip" href="/${lang}/blog/category/${p.topic}">${esc(TOPIC_LABEL[lang][p.topic])}</a>` : ''}
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

function aboutView(lang) {
  const A = ABOUT[lang], t = T[lang];
  return `
  <section class="blog-hero"><div class="wrap">
    <div class="crumb" style="font-family:var(--f-mono);font-size:12px;color:var(--text-dim);margin-bottom:26px"><a href="/${lang}/">${esc(t.home)}</a> / ${esc(A.eyebrow)}</div>
    <span class="eyebrow">${esc(A.eyebrow)}</span>
    <h1 class="metal">${esc(A.h1)}</h1>
    <div class="mission">${A.p.map((x) => `<p>${esc(x)}</p>`).join('')}</div>
  </div></section>
  <div class="wrap">
    <div class="about-grid">
      <section class="about-card">
        <h2>${esc(A.founder)}</h2>
        <div class="person"><div class="avatar">JY</div><div><div class="name">${esc(FOUNDER)}</div><div class="role">${esc(A.role)}</div></div></div>
        <p>${esc(A.bio)}</p>
      </section>
      <section class="about-card">
        <h2>${esc(A.company)}</h2>
        <div class="facts">
          <div><span>${esc(A.hq)}</span><span>${esc(HQ)}</span></div>
          <div><span>${esc(A.contact)}</span><a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></div>
        </div>
        <p style="margin-top:26px"><a class="btn primary" href="/${lang}/#waitlist">${esc(A.cta)}</a></p>
      </section>
    </div>
    <div style="height:70px"></div>
  </div>`;
}

function legalView(lang, doc, slug) {
  const N = LEGAL_NAMES[lang], t = T[lang];
  const name = doc ? (lang === 'en' ? doc.title : N[slug]) : N[slug];
  const paras = doc ? doc.content.split(/\n{2,}/).map((x) => `<p>${esc(x).replace(/\n/g, '<br>')}</p>`).join('') : `<p>${esc(N.soon)}</p>`;
  const other = Object.keys(LEGAL_DOCS).filter((k) => k !== slug)
    .map((k) => `<a class="chip" href="/${lang}/legal/${k}">${esc(N[k])}</a>`).join('');
  return `
  <article>
    <div class="wrap">
      <header class="post-head">
        <div class="crumb"><a href="/${lang}/">${esc(t.home)}</a><span>/</span><span>${esc(N.legal)}</span></div>
        <h1>${esc(name)}</h1>
        ${doc && N.note ? `<div class="meta">${esc(N.note)}</div>` : ''}
      </header>
      <div class="prose"${lang !== 'en' && doc ? ' lang="en" dir="ltr"' : ''}>${paras}</div>
      <div class="post-foot" style="justify-content:flex-start">${other}</div>
    </div>
  </article>`;
}

function solutionView(lang, slug) {
  const U = SOL.UI[lang], t = T[lang];
  const [, , h1, lede, problemH, problem, features, steps, faq] = SOL.P[slug][lang];
  const name = U.short[SOL.SLUGS.indexOf(slug)];
  const more = SOL.SLUGS.filter((k) => k !== slug).map((k) => `<a class="chip" href="/${lang}/solutions/${k}">${esc(U.short[SOL.SLUGS.indexOf(k)])}</a>`).join('');
  return `
  <section class="blog-hero sol-hero"><div class="wrap">
    <div class="crumb" style="font-family:var(--f-mono);font-size:12px;color:var(--text-dim);margin-bottom:26px"><a href="/${lang}/">${esc(t.home)}</a> / ${esc(U.eyebrow)} / ${esc(name)}</div>
    <span class="eyebrow">${esc(U.eyebrow)}</span>
    <h1 class="metal">${esc(h1)}</h1>
    <p class="lede">${esc(lede)}</p>
    <div class="cta-row"><a class="btn primary" href="/${lang}/#waitlist">${esc(U.cta)}</a></div>
  </div></section>
  <div class="wrap"><div class="sol">
    <section><h2>${esc(problemH)}</h2><p>${esc(problem)}</p></section>
    <section><h2>${esc(U.featuresH)}</h2><ul class="sol-list">${features.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
    <section><h2>${esc(U.stepsH)}</h2><ol class="sol-steps">${steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>
    <section class="sol-faq"><h2>${esc(U.faqH)}</h2>${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>
    <div class="sol-cta"><h2>${esc(U.ctaH)}</h2><a class="btn primary" href="/${lang}/#waitlist">${esc(U.cta)}</a><p class="sol-note">${esc(U.note)}</p></div>
    <section><h2>${esc(U.moreH)}</h2><div class="sol-more">${more}<a class="chip" href="/${lang}/blog/category/guide">${esc(TOPIC_LABEL[lang].guide)}</a></div></section>
    <div style="height:60px"></div>
  </div></div>`;
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
    urls.push({ loc: `${SITE}/${lang}/about`, lastmod: null });
    SOL.SLUGS.forEach((k) => urls.push({ loc: `${SITE}/${lang}/solutions/${k}`, lastmod: null }));
    urls.push({ loc: `${SITE}/${lang}/blog`, lastmod: null });
    try {
      const cat = await categoryId(lang);
      if (!cat) continue;
      const tmap = await topicIds().catch(() => ({}));
      const used = new Set();
      for (let page = 1; page <= 20; page++) {
        const { data, pages } = await wp(`posts?categories=${cat}&per_page=100&page=${page}&_fields=slug,modified_gmt,categories`);
        data.forEach((p) => {
          urls.push({ loc: `${SITE}/${lang}/blog/${p.slug}`, lastmod: p.modified_gmt ? p.modified_gmt + 'Z' : null });
          const tp = topicOf(p, tmap); if (tp) used.add(tp);
        });
        if (page >= pages) break;
      }
      TOPICS.filter((k) => used.has(k)).forEach((k) => urls.push({ loc: `${SITE}/${lang}/blog/category/${k}`, lastmod: null }));
    } catch (e) {
      console.error('[blog-sitemap]', lang, e.message);
    }
  }
  try {
    const docs = await legalDocs();
    Object.keys(docs).forEach((k) => urls.push({ loc: `${SITE}/en/legal/${k}`, lastmod: null }));
  } catch (e) { console.error('[blog-sitemap] legal', e.message); }
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

  if (q.solution) {
    const sslug = String(q.solution).toLowerCase();
    if (!SOL.P[sslug]) {
      return send(404, layout({ lang, title: `${t.notFound} | Xerovan`, description: t.notFoundText, canonical: `${SITE}/${lang}/`, body: messageView(lang, t.notFound, t.notFoundText), noindex: true }));
    }
    const [title, description, h1, , , , , , faq] = SOL.P[sslug][lang];
    const url = `${SITE}/${lang}/solutions/${sslug}`;
    const U = SOL.UI[lang];
    return send(200, layout({
      lang, title, description, canonical: url,
      alternates: [...Object.keys(LANGS).map((k) => [k, `${SITE}/${k}/solutions/${sslug}`]), ['x-default', `${SITE}/en/solutions/${sslug}`]],
      body: solutionView(lang, sslug),
      jsonLd: [crumbs([['Xerovan', `${SITE}/${lang}/`], [U.short[SOL.SLUGS.indexOf(sslug)], url]]),
        { '@context': 'https://schema.org', '@type': 'WebPage', name: h1, description, url, inLanguage: LANGS[lang].hl,
          isPartOf: { '@type': 'WebSite', name: 'Xerovan', url: `${SITE}/` } },
        { '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: LANGS[lang].hl,
          mainEntity: faq.map(([q2, a]) => ({ '@type': 'Question', name: q2, acceptedAnswer: { '@type': 'Answer', text: a } })) }],
    }), 'text/html; charset=utf-8', 's-maxage=3600, stale-while-revalidate=86400');
  }

  if (q.about) {
    const A = ABOUT[lang];
    return send(200, layout({
      lang, title: `${A.title} | Xerovan`, description: A.p[0], canonical: `${SITE}/${lang}/about`,
      alternates: Object.keys(LANGS).map((k) => [k, `${SITE}/${k}/about`]),
      body: aboutView(lang),
      jsonLd: [crumbs([['Xerovan', `${SITE}/${lang}/`], [A.eyebrow, `${SITE}/${lang}/about`]]), {
        '@context': 'https://schema.org', '@type': 'AboutPage', name: A.title, url: `${SITE}/${lang}/about`, inLanguage: LANGS[lang].hl,
        mainEntity: { '@type': 'Organization', name: 'Xerovan', url: `${SITE}/`, logo: `${SITE}/images/logo-icon.png`, email: CONTACT_EMAIL,
          address: { '@type': 'PostalAddress', addressLocality: 'Dubai', addressCountry: 'AE' }, founder: founderLD(lang),
          sameAs: ['https://x.com/XerovanC', 'https://www.instagram.com/xerovancard/', 'https://www.facebook.com/profile.php?id=61594055002981'] },
      }],
    }), 'text/html; charset=utf-8', 's-maxage=3600, stale-while-revalidate=86400');
  }

  if (q.legal) {
    const slug2 = String(q.legal).toLowerCase();
    if (!LEGAL_DOCS[slug2]) {
      return send(404, layout({ lang, title: `${t.notFound} | Xerovan`, description: t.notFoundText, canonical: `${SITE}/${lang}/`, body: messageView(lang, t.notFound, t.notFoundText), noindex: true }));
    }
    let doc = null;
    try { doc = (await legalDocs())[slug2] || null; } catch (e) { console.error('[legal]', e.message); }
    const N = LEGAL_NAMES[lang];
    const title = `${doc && lang === 'en' ? doc.title : N[slug2]} | Xerovan`;
    return send(200, layout({
      lang, title, description: doc ? clip(doc.content.replace(/\s+/g, ' '), 155) : N.soon,
      canonical: `${SITE}/en/legal/${slug2}`,                       // one English original; other languages point to it
      alternates: Object.keys(LANGS).map((k) => [k, `${SITE}/${k}/legal/${slug2}`]), hreflang: false,
      noindex: !doc || lang !== 'en',
      body: legalView(lang, doc, slug2),
      jsonLd: crumbs([['Xerovan', `${SITE}/${lang}/`], [N[slug2], `${SITE}/${lang}/legal/${slug2}`]]),
    }), 'text/html; charset=utf-8', 's-maxage=600, stale-while-revalidate=86400');
  }

  try {
    const cat = await categoryId(lang);

    if (q.latest) {
      const tmap = cat ? await topicIds().catch(() => ({})) : {};
      // Only posts written in this page's language (hidden on the page when there are none)
      const posts = cat ? (await langPosts(lang, cat)).slice(0, 3).map((p) => shape(p, lang, tmap)) : [];
      return send(200, JSON.stringify(posts.map((p) => ({
        title: p.title, excerpt: clip(p.excerpt, 120), url: `/${lang}/blog/${p.slug}`, image: p.image,
        date: fmtDate(p.date, lang), topic: p.topic ? TOPIC_LABEL[lang][p.topic] : null,
      }))), 'application/json; charset=utf-8');
    }

    if (q.feed) {
      const { data } = cat ? await wp(`posts?categories=${cat}&per_page=20&_embed=wp:featuredmedia`) : { data: [] };
      return send(200, rss(lang, data.map((p) => shape(p, lang))), 'application/rss+xml; charset=utf-8');
    }

    if (slug) {
      const { data } = await wp(`posts?slug=${encodeURIComponent(slug)}&_embed=wp:featuredmedia,author`);
      const raw = data.find((p) => cat && (p.categories || []).includes(cat));
      const tmap = raw ? await topicIds().catch(() => ({})) : {};
      if (!raw) {
        return send(404, layout({ lang, title: `${t.notFound} | Xerovan`, description: t.notFoundText, canonical: `${SITE}/${lang}/blog`, body: messageView(lang, t.notFound, t.notFoundText) }));
      }
      const p = shape(raw, lang, tmap);
      const canonical = `${SITE}/${lang}/blog/${p.slug}`;
      const alternates = [[lang, canonical], ...Object.entries(p.translations).map(([k, s]) => [k, `${SITE}/${k}/blog/${s}`])];
      return send(200, layout({
        lang, title: `${p.title} | Xerovan`, description: p.excerpt, canonical, alternates,
        ogImage: p.image ? `${SITE}${p.image}` : null, ogType: 'article',
        body: postView(lang, p),
        jsonLd: [crumbs([
          ['Xerovan', `${SITE}/${lang}/`], [t.blog, `${SITE}/${lang}/blog`],
          ...(p.topic ? [[TOPIC_LABEL[lang][p.topic], `${SITE}/${lang}/blog/category/${p.topic}`]] : []),
          [p.title, canonical],
        ]), {
          '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.excerpt,
          datePublished: p.date, dateModified: p.modified, inLanguage: LANGS[lang].hl,
          mainEntityOfPage: canonical, image: p.image ? `${SITE}${p.image}` : `${SITE}/images/og-preview.jpg`,
          author: { '@type': 'Organization', name: 'Xerovan', url: `${SITE}/${lang}/about` },
          publisher: { '@type': 'Organization', name: 'Xerovan', logo: { '@type': 'ImageObject', url: `${SITE}/images/logo-icon.png` } },
        }],
      }));
    }

    const topic = q.topic ? String(q.topic).toLowerCase() : null;
    if (topic && !TOPICS.includes(topic)) {
      return send(404, layout({ lang, title: `${t.notFound} | Xerovan`, description: t.notFoundText, canonical: `${SITE}/${lang}/blog`, body: messageView(lang, t.notFound, t.notFoundText) }));
    }
    const tmap = cat ? await topicIds().catch(() => ({})) : {};
    let all = cat ? await langPosts(lang, cat) : [];
    if (topic) all = tmap[topic] ? all.filter((p) => (p.categories || []).includes(tmap[topic])) : [];
    const pages = Math.ceil(all.length / PER_PAGE);
    const data = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    if (page > 1 && !data.length) {
      return send(404, layout({ lang, title: `${t.notFound} | Xerovan`, description: t.notFoundText, canonical: `${SITE}/${lang}/blog`, body: messageView(lang, t.notFound, t.notFoundText) }));
    }
    const basePath = topic ? `/blog/category/${topic}` : '/blog';
    const canonical = `${SITE}/${lang}${basePath}${page > 1 ? `/page/${page}` : ''}`;
    const heading = topic ? `${TOPIC_LABEL[lang][topic]} | ${t.title}` : t.title;
    return send(200, layout({
      lang, title: page > 1 ? `${heading} — ${t.page} ${page}` : heading,
      description: topic ? TOPIC_INTRO[lang][topic] : t.intro, canonical,
      alternates: Object.keys(LANGS).map((k) => [k, `${SITE}/${k}${basePath}`]),
      body: listView(lang, data.map((p) => shape(p, lang, tmap)), page, pages, topic),
      jsonLd: [crumbs([
        ['Xerovan', `${SITE}/${lang}/`], [t.blog, `${SITE}/${lang}/blog`],
        ...(topic ? [[TOPIC_LABEL[lang][topic], `${SITE}/${lang}${basePath}`]] : []),
      ]), { '@context': 'https://schema.org', '@type': topic ? 'CollectionPage' : 'Blog', name: heading, url: `${SITE}/${lang}${basePath}`, inLanguage: LANGS[lang].hl }],
    }));
  } catch (e) {
    console.error('[blog]', e);
    if (q.latest) return send(200, '[]', 'application/json; charset=utf-8', 's-maxage=60');
    return send(503, layout({ lang, title: `${t.down} | Xerovan`, description: t.downText, canonical: `${SITE}/${lang}/blog`, body: messageView(lang, t.down, t.downText) }));
  }
};
