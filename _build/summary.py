# New "Summary" section (2 screens): Xerovan one-line definition + 7 core features.
# Korean text is the owner's original copy (do not edit); other languages are translations.
import html as _html

E = lambda s: _html.escape(s, quote=True)

# feature: (English name, {lang: (title, description)})
FEATURES = [
    ("Direct Wallet Payments", {
        "kr": ("지갑에서 바로 결제", "별도의 충전 없이, 사용자가 직접 관리하는 비수탁 지갑의 자산으로 결제할 수 있습니다."),
        "en": ("Direct Wallet Payments", "Pay with the assets in your own non-custodial wallet. No top-ups needed."),
        "ja": ("ウォレットから直接決済", "事前のチャージは不要。ご自身で管理するノンカストディアルウォレットの資産で、そのまま支払えます。"),
        "es": ("Pagos directos desde tu wallet", "Paga con los activos de tu propia wallet sin custodia, sin necesidad de recargas previas."),
        "ar": ("الدفع مباشرة من المحفظة", "ادفع بالأصول الموجودة في محفظتك غير الاحتجازية التي تديرها بنفسك، دون الحاجة إلى شحن مسبق."),
        "pt": ("Pagamentos direto da carteira", "Pague com os ativos da sua própria carteira sem custódia, sem precisar recarregar antes."),
    }),
    ("Business Spend Management — Media Buyer Suite", {
        "kr": ("기업 지출 관리 — Media Buyer Suite", "고객과 계정별로 카드를 발급하고 영수증, 승인 절차, 지출 한도를 통합 관리합니다. 마케팅 에이전시와 기업이 지출을 효율적이고 투명하게 운영할 수 있도록 지원합니다."),
        "en": ("Business Spend Management — Media Buyer Suite", "Issue cards for each client and account, and manage receipts, approvals and spending limits in one place. Built to help marketing agencies and businesses run their spending efficiently and transparently."),
        "ja": ("法人支出管理 — Media Buyer Suite", "クライアントやアカウントごとにカードを発行し、領収書、承認フロー、利用限度額を一元管理。マーケティングエージェンシーや企業の支出を、効率的かつ透明に運用できます。"),
        "es": ("Gestión del gasto empresarial — Media Buyer Suite", "Emite tarjetas por cliente y por cuenta, y gestiona recibos, aprobaciones y límites de gasto en un solo lugar. Ayuda a agencias de marketing y empresas a gestionar su gasto de forma eficiente y transparente."),
        "ar": ("إدارة نفقات الأعمال — Media Buyer Suite", "أصدر بطاقات لكل عميل وكل حساب، وأدِر الإيصالات ومسارات الاعتماد وحدود الإنفاق في مكان واحد. صُممت لمساعدة وكالات التسويق والشركات على إدارة إنفاقها بكفاءة وشفافية."),
        "pt": ("Gestão de gastos empresariais — Media Buyer Suite", "Emita cartões por cliente e por conta e gerencie comprovantes, aprovações e limites de gastos em um só lugar. Ajuda agências de marketing e empresas a gerir seus gastos com eficiência e transparência."),
    }),
    ("Global Payouts", {
        "kr": ("글로벌 Payout", "기업과 개인이 전 세계의 파트너, 고객 및 구성원의 은행 통장으로 크립토 자산을 빠르고 간편하게 지급할 수 있습니다. 국경을 넘어 확장 가능한 지급 환경을 제공합니다."),
        "en": ("Global Payouts", "Businesses and individuals can pay out crypto quickly and easily to the bank accounts of partners, customers and team members around the world, with a payout setup that scales across borders."),
        "ja": ("グローバルペイアウト", "企業や個人が、世界中のパートナー、顧客、メンバーの銀行口座へ暗号資産をすばやく簡単に支払えます。国境を越えて拡張できる支払い環境を提供します。"),
        "es": ("Pagos globales", "Empresas y particulares pueden pagar en cripto, de forma rápida y sencilla, a las cuentas bancarias de socios, clientes y miembros del equipo en todo el mundo, con un sistema de pagos que escala más allá de las fronteras."),
        "ar": ("المدفوعات العالمية", "يمكن للشركات والأفراد تحويل الأصول المشفرة بسرعة وسهولة إلى الحسابات المصرفية للشركاء والعملاء وأعضاء الفريق حول العالم، عبر بيئة دفع قابلة للتوسع عبر الحدود."),
        "pt": ("Pagamentos globais", "Empresas e pessoas podem pagar em cripto, de forma rápida e simples, nas contas bancárias de parceiros, clientes e membros da equipe no mundo todo, com uma estrutura de pagamentos que cresce além das fronteiras."),
    }),
    ("Unified Asset Management", {
        "kr": ("통합 자산 관리", "무료 비수탁 지갑과 외부 지갑을 한곳에서 관리하고, 사용하지 않는 자산을 스테이킹 등 다양한 자산 운용 상품과 연결할 수 있습니다."),
        "en": ("Unified Asset Management", "Manage your free non-custodial wallet and external wallets in one place, and put idle assets to work with staking and other earning products."),
        "ja": ("資産の一元管理", "無料のノンカストディアルウォレットと外部ウォレットをひとつの場所で管理し、使っていない資産をステーキングなどさまざまな運用商品につなげられます。"),
        "es": ("Gestión unificada de activos", "Gestiona tu wallet gratuita sin custodia y tus wallets externas en un solo lugar, y pon a trabajar tus activos inactivos con staking y otros productos de rendimiento."),
        "ar": ("إدارة موحدة للأصول", "أدِر محفظتك المجانية غير الاحتجازية ومحافظك الخارجية في مكان واحد، واربط أصولك غير المستخدمة بمنتجات استثمار متنوعة مثل التخزين (Staking)."),
        "pt": ("Gestão unificada de ativos", "Gerencie sua carteira gratuita sem custódia e suas carteiras externas em um só lugar, e coloque ativos parados para render com staking e outros produtos."),
    }),
    ("Smart Routing", {
        "kr": ("스마트 라우팅", "크립토 송금, 수신 및 변환 시 최적의 경로를 자동으로 탐색하여 효율적인 거래와 경쟁력 있는 수수료를 제공합니다."),
        "en": ("Smart Routing", "When you send, receive or convert crypto, Xerovan automatically finds the best route for efficient transactions and competitive fees."),
        "ja": ("スマートルーティング", "暗号資産の送金・受取・交換時に最適なルートを自動で探し、効率的な取引と競争力のある手数料を実現します。"),
        "es": ("Enrutamiento inteligente", "Al enviar, recibir o convertir cripto, Xerovan encuentra automáticamente la mejor ruta para operaciones eficientes y comisiones competitivas."),
        "ar": ("التوجيه الذكي", "عند إرسال الأصول المشفرة أو استلامها أو تحويلها، يبحث Xerovan تلقائيًا عن أفضل مسار لمعاملات فعّالة ورسوم تنافسية."),
        "pt": ("Roteamento inteligente", "Ao enviar, receber ou converter cripto, a Xerovan encontra automaticamente a melhor rota para transações eficientes e taxas competitivas."),
    }),
    ("Secure Card Sharing", {
        "kr": ("안전한 카드 공유", "가족이나 다른 Xerovan 사용자에게 카드 사용 권한을 안전하게 공유하고, 사용 한도와 권한을 언제든지 관리할 수 있습니다. 카드에 대한 최종 관리 권한은 카드 소유자에게 유지됩니다."),
        "en": ("Secure Card Sharing", "Safely share card access with family or other Xerovan users, and adjust spending limits and permissions at any time. The card owner always keeps final control."),
        "ja": ("安全なカード共有", "家族やほかのXerovanユーザーとカードの利用権限を安全に共有し、利用限度額や権限をいつでも管理できます。カードの最終的な管理権限はカード所有者に残ります。"),
        "es": ("Tarjetas compartidas con seguridad", "Comparte de forma segura el uso de tu tarjeta con tu familia u otros usuarios de Xerovan y ajusta los límites y permisos cuando quieras. El titular de la tarjeta conserva siempre el control final."),
        "ar": ("مشاركة آمنة للبطاقة", "شارك صلاحية استخدام بطاقتك بأمان مع عائلتك أو مستخدمي Xerovan الآخرين، وعدّل حدود الإنفاق والصلاحيات في أي وقت. ويحتفظ مالك البطاقة دائمًا بالتحكم النهائي فيها."),
        "pt": ("Compartilhamento seguro de cartões", "Compartilhe com segurança o uso do cartão com sua família ou outros usuários da Xerovan e ajuste limites e permissões quando quiser. O titular do cartão mantém sempre o controle final."),
    }),
    ("Travel & Rewards Ecosystem", {
        "kr": ("여행 및 리워드 생태계", "Xerovan 토큰 기반 마켓플레이스를 통해 여행 예약과 eSIM 서비스를 이용하고, 캐시백, 보너스, 제휴 프로그램 및 dApp 서비스를 하나의 생태계에서 경험할 수 있습니다."),
        "en": ("Travel & Rewards Ecosystem", "Book travel and eSIM services on the Xerovan token-based marketplace, and enjoy cashback, bonuses, partner programs and dApp services in one ecosystem."),
        "ja": ("旅行とリワードのエコシステム", "Xerovanトークンを基盤としたマーケットプレイスで旅行予約やeSIMサービスを利用し、キャッシュバック、ボーナス、提携プログラム、dAppサービスをひとつのエコシステムで体験できます。"),
        "es": ("Ecosistema de viajes y recompensas", "Reserva viajes y servicios eSIM en el marketplace basado en el token de Xerovan, y disfruta de cashback, bonificaciones, programas de socios y servicios dApp en un solo ecosistema."),
        "ar": ("منظومة السفر والمكافآت", "احجز رحلاتك وخدمات eSIM عبر سوق Xerovan القائم على الرموز، واستمتع بالاسترداد النقدي والمكافآت وبرامج الشركاء وخدمات dApp في منظومة واحدة."),
        "pt": ("Ecossistema de viagens e recompensas", "Reserve viagens e serviços de eSIM no marketplace baseado no token da Xerovan e aproveite cashback, bônus, programas de parceiros e serviços dApp em um só ecossistema."),
    }),
]

DEFINITION = {
    "kr": "Xerovan은 결제, 글로벌 지급, 기업 지출, 자산 관리와 리워드를 하나로 연결하는 올인원 크립토 금융 플랫폼입니다.",
    "en": "Xerovan is an all-in-one crypto finance platform connecting payments, global payouts, business spending, asset management, and rewards.",
    "ja": "Xerovanは、決済、グローバルな支払い、法人支出、資産管理、リワードをひとつにつなぐ、オールインワンの暗号資産金融プラットフォームです。",
    "es": "Xerovan es una plataforma financiera cripto todo en uno que conecta pagos, pagos globales, gasto empresarial, gestión de activos y recompensas.",
    "ar": "Xerovan منصة مالية متكاملة للعملات المشفرة تجمع المدفوعات والتحويلات العالمية ونفقات الأعمال وإدارة الأصول والمكافآت في مكان واحد.",
    "pt": "A Xerovan é uma plataforma financeira cripto completa que conecta pagamentos, pagamentos globais, gastos empresariais, gestão de ativos e recompensas.",
}
EYEBROW = {"kr": "Xerovan 핵심 기능", "en": "Xerovan core features", "ja": "Xerovanの主な機能",
           "es": "Funciones clave de Xerovan", "ar": "المزايا الأساسية لـ Xerovan", "pt": "Principais recursos da Xerovan"}

CSS = """  /* ---------- Features: one continuous section, 7 core features, crypto image behind, text in front ---------- */
  .sx{position:relative;overflow:hidden;min-height:100vh;display:flex;align-items:center;padding:100px 0 70px;isolation:isolate;}
  .sx-bg{position:absolute;inset:0;z-index:-2;background:#0b0c0e url("/images/bg-features.webp") right center / cover no-repeat;}
  .sx::before{content:'';position:absolute;inset:0;z-index:-1;background:
      linear-gradient(90deg,rgba(10,11,13,.92) 0%,rgba(10,11,13,.7) 45%,rgba(10,11,13,.35) 75%,rgba(10,11,13,.55) 100%),
      linear-gradient(180deg,rgba(10,11,13,.9) 0%,rgba(10,11,13,0) 20%,rgba(10,11,13,0) 80%,rgba(10,11,13,.9) 100%);}
  .sx .wrap{width:100%;}
  .sx-head{max-width:900px;margin-bottom:34px;}
  .sx-head h2{font-family:'Unbounded'; font-weight:600; font-size:clamp(20px,2.3vw,30px); line-height:1.35; margin-top:16px; text-shadow:0 2px 24px rgba(0,0,0,.7);}
  .sx-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
  .sx-grid .sx-card:nth-child(n+5){grid-column:span 1;}
  .sx-grid .sx-card:nth-child(5){grid-column:1 / span 1;}
  @media(max-width:1100px){ .sx-grid{grid-template-columns:repeat(2,1fr);} .sx-grid .sx-card:nth-child(5){grid-column:auto;} }
  @media(max-width:640px){ .sx-grid{grid-template-columns:1fr;} .sx{min-height:auto;padding:90px 0 60px;} }
  .sx-card{border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:20px 20px 22px;background:rgba(14,15,18,.66);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:inset 0 1px 0 rgba(255,255,255,.06);}
  .sx-num{font-family:'JetBrains Mono';font-size:11px;letter-spacing:.16em;color:var(--ice);}
  .sx-card h3{font-family:'Unbounded';font-size:15px;font-weight:600;line-height:1.35;margin:9px 0 3px;}
  .sx-en{font-family:'JetBrains Mono';font-size:10.5px;letter-spacing:.03em;color:var(--silver-500);margin-bottom:10px;}
  .sx-card p{font-size:13.5px;line-height:1.65;color:var(--silver-300);}
  /* 8th cell: Xerovan crypto card visual next to feature 07 */
  .sx-visual{position:relative;display:flex;align-items:center;justify-content:center;min-height:200px;}
  .sx-visual img{width:min(118%,380px);max-width:none;height:auto;margin:-6% -9%;filter:drop-shadow(0 18px 40px rgba(0,0,0,.6));}
  @media(max-width:640px){ .sx-visual{display:none;} }
"""


VISUAL = ('<div class="sx-visual"><img src="/images/feature-cards.webp" width="900" height="700" '
          'alt="Xerovan Visa crypto cards with USDC and USDT"></div>')


def section(lang):
    cards = []
    for i, (en_name, tr) in enumerate(FEATURES):
        title, desc = tr[lang]
        sub = "" if lang == "en" else f'<div class="sx-en">{E(en_name)}</div>'
        cards.append(f'<article class="sx-card"><div class="sx-num">{i+1:02d}</div><h3>{E(title)}</h3>{sub}<p>{E(desc)}</p></article>')
    return (f'<section id="features" class="sx"><div class="sx-bg" role="img" aria-label="Xerovan app and card"></div><div class="wrap">'
            f'<div class="sx-head"><span class="eyebrow">{E(EYEBROW[lang])}</span><h2>{E(DEFINITION[lang])}</h2></div>'
            f'<div class="sx-grid">{"".join(cards)}{VISUAL}</div></div></section>')

HOME = {"en": "Home", "kr": "홈", "ja": "ホーム", "es": "Inicio", "ar": "الرئيسية", "pt": "Início"}

SITE_BG_CSS = """  /* Page backgrounds scroll with the content: one image per section, each showing that section's subject,
     edges faded into the same base color so the page reads as one long continuous background. */
  body{background:#0b0c0e;}
  .hero, #usecases, #faq, #waitlist{background-color:#0b0c0e;background-repeat:no-repeat;background-size:cover;}
  .hero{background-image:url("/images/bg-hero.webp");background-position:center;}
  #usecases{background-image:url("/images/bg-usecases.webp");background-position:center;}
  #usecases .uc-item{background:rgba(16,17,20,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-color:rgba(255,255,255,.1);}
  #faq{background-image:url("/images/bg-faq.webp");background-position:center;}
  #waitlist{background-image:url("/images/bg-cta.webp");background-position:center bottom;padding-bottom:430px;}
  @media(max-width:760px){ #waitlist{padding-bottom:340px;background-size:auto 100%;} }
  @media(max-width:760px){ .hero{background-position:84% 30%;} .hero::after{background:radial-gradient(ellipse 70% 40% at 50% 52%,rgba(8,8,10,.82),rgba(8,8,10,.4) 70%,transparent 90%) !important;} #usecases{background-position:center;} }
  .divider{background:rgba(19,20,23,0.7) !important;}
  /* calm pool behind the hero copy */
  .hero::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse 40% 44% at 50% 54%,rgba(8,8,10,.7),rgba(8,8,10,.3) 60%,transparent 80%);}
  .hero > *{position:relative;z-index:1;}
  .hero .btn-ghost{background:rgba(10,11,13,.6);backdrop-filter:blur(6px);}
"""

# ---------------------------------------------------------------- app download
# Paste the store URLs here when the app is live; until then the button shows "coming soon" + waitlist.
APP_STORE_URL = ""     # e.g. "https://apps.apple.com/app/xerovan/id0000000000"
PLAY_STORE_URL = ""    # e.g. "https://play.google.com/store/apps/details?id=com.xerovan.app"

APP_T = {
    "en": ("Get the Xerovan app", "Download Xerovan on your phone.", "Coming soon", "Xerovan is launching soon on the App Store and Google Play. Join the waitlist to be notified first.", "Join the Waitlist", "Close"),
    "kr": ("Xerovan 앱 받기", "휴대폰에서 Xerovan을 다운로드하세요.", "출시 예정", "Xerovan은 곧 App Store와 Google Play에 출시됩니다. 대기자 명단에 등록하고 가장 먼저 소식을 받아보세요.", "대기자 명단 등록", "닫기"),
    "ja": ("Xerovanアプリを入手", "スマートフォンにXerovanをダウンロード。", "近日公開", "XerovanはまもなくApp StoreとGoogle Playで公開予定です。ウェイトリストに登録して、いち早くお知らせを受け取りましょう。", "ウェイトリストに登録", "閉じる"),
    "es": ("Descarga la app de Xerovan", "Descarga Xerovan en tu móvil.", "Próximamente", "Xerovan llegará pronto a App Store y Google Play. Únete a la lista de espera para enterarte primero.", "Únete a la lista de espera", "Cerrar"),
    "ar": ("احصل على تطبيق Xerovan", "حمّل Xerovan على هاتفك.", "قريبًا", "سيُطلق Xerovan قريبًا على App Store وGoogle Play. انضم إلى قائمة الانتظار لتكون أول من يعلم.", "انضم إلى قائمة الانتظار", "إغلاق"),
    "pt": ("Baixe o app da Xerovan", "Baixe a Xerovan no seu celular.", "Em breve", "A Xerovan chega em breve à App Store e ao Google Play. Entre na lista de espera para saber primeiro.", "Entrar na lista de espera", "Fechar"),
}

APP_CSS = """  .app-dl{position:fixed;inset:0;z-index:400;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(5,7,11,.72);backdrop-filter:blur(8px);}
  .app-dl[hidden]{display:none;}
  .app-dl-box{position:relative;width:min(440px,100%);border:1px solid var(--line);border-radius:22px;padding:34px 30px 30px;text-align:center;background:linear-gradient(180deg,#14161b,#0d0e11);box-shadow:0 40px 90px -30px rgba(0,0,0,.9);}
  .app-dl-box h3{font-family:'Unbounded';font-size:20px;font-weight:600;margin:6px 0 8px;}
  .app-dl-box p{color:var(--silver-500);font-size:14.5px;line-height:1.6;}
  .app-dl-stores{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:22px 0 4px;}
  .app-dl-stores .store-badge{padding:12px 18px;}
  .app-dl-stores .store-badge.soon{opacity:.55;pointer-events:none;}
  .app-dl-soon{margin-top:14px;}
  .app-dl-soon .btn-primary{margin-top:16px;display:inline-flex;}
  .app-dl-x{position:absolute;top:12px;right:14px;width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--silver-300);font-size:18px;cursor:pointer;}
  [dir="rtl"] .app-dl-x{right:auto;left:14px;}
"""

def app_modal(lang, badges_html):
    t = APP_T[lang]
    live = APP_STORE_URL or PLAY_STORE_URL
    return (f'<div class="app-dl" id="appDl" hidden role="dialog" aria-modal="true" aria-labelledby="appDlTitle"><div class="app-dl-box">'
            f'<button type="button" class="app-dl-x" id="appDlClose" aria-label="{E(t[5])}">&times;</button>'
            f'<span class="eyebrow center">Xerovan</span><h3 id="appDlTitle">{E(t[0])}</h3><p>{E(t[1]) if live else ""}</p>'
            f'<div class="app-dl-stores">{badges_html}</div>'
            + ("" if live else f'<div class="app-dl-soon"><p>{E(t[3])}</p><a href="#waitlist" class="btn-primary" id="appDlWait">{E(t[4])}</a></div>')
            + '</div></div>')

def app_js():
    return f"""  /* App download: iOS -> App Store, Android -> Google Play, otherwise a panel with both stores */
  (function () {{
    var IOS = {APP_STORE_URL!r}, ANDROID = {PLAY_STORE_URL!r};
    var ua = navigator.userAgent || '', isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1), isAndroid = /Android/i.test(ua);
    function box() {{ return document.getElementById('appDl'); }}
    function show(o) {{ var b = box(); if (b) b.hidden = !o; }}
    function openApp(e) {{
      if (e) e.preventDefault();
      if (isIOS && IOS) {{ location.href = IOS; return; }}
      if (isAndroid && ANDROID) {{ location.href = ANDROID; return; }}
      show(true);
    }}
    var ex = document.getElementById('exploreBtn'); if (ex) ex.addEventListener('click', openApp, true);
    document.querySelectorAll('.store-badges .store-badge').forEach(function (a) {{
      var url = a.dataset.store === 'ios' ? IOS : ANDROID;
      if (url) {{ a.href = url; a.target = '_blank'; a.rel = 'noopener'; }} else a.addEventListener('click', openApp);
    }});
    document.addEventListener('click', function (e) {{
      var b = box(); if (!b || b.hidden) return;
      if (e.target === b || e.target.closest('#appDlClose') || e.target.closest('#appDlWait')) show(false);
    }});
    document.addEventListener('keydown', function (e) {{ if (e.key === 'Escape') show(false); }});
  }})();
"""
