// Telegram bot webhook: early-access signup by email, plus official links and a safety notice.
//
// Off until both env vars are set in Vercel:
//   TELEGRAM_BOT_TOKEN       token from @BotFather
//   TELEGRAM_WEBHOOK_SECRET  any random string; Telegram sends it back in a header on every update
//
// Stateless by design: the source tag from a deep link (t.me/<bot>?start=<src>) is written into the
// prompt message, and the user's reply quotes that message, so the email arrives with its source.

const API = 'https://api.telegram.org/bot';
const SHEET = 'https://script.google.com/macros/s/AKfycbxKNLj0A3U9I-49Yh6bO_7oZltUSemfqj8RjVvyMoUEJLVLKiVxt2YS68BLVX0I4TY1/exec';
const SITE = 'https://www.xerovan.com';
const CHANNEL = 'https://t.me/xerovan';
const SUPPORT = 'https://t.me/xerovan_card';
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const REF = /\[ref:([a-z0-9_-]{1,40})\]/i;

// Telegram language_code -> site language
const LANG = { ko: 'kr', ja: 'ja', es: 'es', pt: 'pt', ar: 'ar' };

const T = {
  en: {
    hi: 'Hi, this is the Xerovan bot.\nXerovan is a Visa card that pays straight from your own crypto wallet, with no top-up.',
    ask: 'To apply for early access, reply to this message with your email.',
    ok: 'Thanks, your application has been received. We will email you the next steps, including availability in your country.',
    bad: 'That doesn\'t look like an email address. Please reply with an address such as name@example.com.',
    seed: 'Please never share a seed phrase, private key or password with anyone, including us. Xerovan will never ask for them. If you sent one by mistake, move your funds to a new wallet.',
    safety: 'Official accounts: channel @xerovan, support @xerovan_card, this bot. Xerovan staff never message you first and never ask for a seed phrase, private key or password.',
    b: ['Apply for early access', 'How it works', 'Official channel', 'Support'],
  },
  kr: {
    hi: '안녕하세요, 제로반(Xerovan) 봇입니다.\n제로반은 충전 없이 내 크립토 지갑에서 바로 결제되는 Visa 카드입니다.',
    ask: '이용 신청을 하시려면 이 메시지에 답장으로 이메일 주소를 보내 주세요.',
    ok: '신청이 접수되었습니다. 거주 국가의 이용 가능 여부를 포함한 다음 단계를 이메일로 안내해 드립니다.',
    bad: '이메일 주소 형식이 아닙니다. name@example.com 같은 형식으로 답장해 주세요.',
    seed: '시드 문구, 개인 키, 비밀번호는 누구에게도, 저희에게도 보내지 마세요. 제로반은 절대 이를 묻지 않습니다. 실수로 보내셨다면 자산을 새 지갑으로 옮기세요.',
    safety: '공식 계정: 채널 @xerovan, 고객지원 @xerovan_card, 이 봇. 제로반 직원은 먼저 메시지를 보내지 않으며, 시드 문구·개인 키·비밀번호를 절대 묻지 않습니다.',
    b: ['이용 신청', '작동 방식', '공식 채널', '고객지원'],
  },
  ja: {
    hi: 'こんにちは、Xerovanボットです。\nXerovanはチャージ不要で、自分の暗号資産ウォレットから直接支払えるVisaカードです。',
    ask: '先行利用のお申し込みは、このメッセージにメールアドレスを返信してください。',
    ok: 'お申し込みを受け付けました。お住まいの国での利用可否を含む次の手順をメールでご案内します。',
    bad: 'メールアドレスの形式ではありません。name@example.com のような形式で返信してください。',
    seed: 'シードフレーズ・秘密鍵・パスワードは、当社を含め誰にも送らないでください。Xerovanがこれらを尋ねることはありません。誤って送った場合は、資産を新しいウォレットに移してください。',
    safety: '公式アカウント: チャンネル @xerovan、サポート @xerovan_card、このボット。Xerovanのスタッフから先にメッセージを送ることはなく、シードフレーズ・秘密鍵・パスワードを尋ねることもありません。',
    b: ['先行利用を申し込む', '仕組み', '公式チャンネル', 'サポート'],
  },
  es: {
    hi: 'Hola, soy el bot de Xerovan.\nXerovan es una tarjeta Visa que paga directamente desde tu propia wallet cripto, sin recargas.',
    ask: 'Para solicitar acceso anticipado, responde a este mensaje con tu correo electrónico.',
    ok: 'Hemos recibido tu solicitud. Te enviaremos por correo los siguientes pasos, incluida la disponibilidad en tu país.',
    bad: 'Eso no parece un correo electrónico. Responde con una dirección como nombre@ejemplo.com.',
    seed: 'Nunca compartas tu frase semilla, clave privada o contraseña con nadie, tampoco con nosotros. Xerovan nunca te las pedirá. Si enviaste una por error, mueve tus fondos a una wallet nueva.',
    safety: 'Cuentas oficiales: canal @xerovan, soporte @xerovan_card y este bot. El equipo de Xerovan nunca te escribe primero ni te pide tu frase semilla, clave privada o contraseña.',
    b: ['Solicitar acceso anticipado', 'Cómo funciona', 'Canal oficial', 'Soporte'],
  },
  pt: {
    hi: 'Olá, este é o bot da Xerovan.\nA Xerovan é um cartão Visa que paga direto da sua própria carteira cripto, sem recarga.',
    ask: 'Para solicitar acesso antecipado, responda a esta mensagem com o seu e-mail.',
    ok: 'Recebemos sua solicitação. Enviaremos por e-mail os próximos passos, incluindo a disponibilidade no seu país.',
    bad: 'Isso não parece um e-mail. Responda com um endereço como nome@exemplo.com.',
    seed: 'Nunca compartilhe sua frase-semente, chave privada ou senha com ninguém, nem conosco. A Xerovan nunca vai pedir isso. Se enviou por engano, mova seus fundos para uma carteira nova.',
    safety: 'Contas oficiais: canal @xerovan, suporte @xerovan_card e este bot. A equipe da Xerovan nunca envia mensagem primeiro e nunca pede sua frase-semente, chave privada ou senha.',
    b: ['Solicitar acesso antecipado', 'Como funciona', 'Canal oficial', 'Suporte'],
  },
  ar: {
    hi: 'مرحبًا، هذا بوت Xerovan.\nXerovan بطاقة Visa تدفع مباشرة من محفظتك المشفرة الخاصة دون شحن.',
    ask: 'للتقديم على الوصول المبكر، ردّ على هذه الرسالة ببريدك الإلكتروني.',
    ok: 'تم استلام طلبك. سنرسل إليك الخطوات التالية عبر البريد الإلكتروني، بما في ذلك مدى التوفر في بلدك.',
    bad: 'لا يبدو هذا عنوان بريد إلكتروني. ردّ بعنوان مثل name@example.com.',
    seed: 'لا تشارك عبارة الاسترداد أو المفتاح الخاص أو كلمة المرور مع أي أحد، ولا معنا. لن تطلبها Xerovan أبدًا. إن أرسلتها بالخطأ فانقل أموالك إلى محفظة جديدة.',
    safety: 'الحسابات الرسمية: القناة ‎@xerovan، والدعم ‎@xerovan_card، وهذا البوت. لا يراسلك فريق Xerovan أولًا أبدًا، ولا يطلب عبارة الاسترداد أو المفتاح الخاص أو كلمة المرور.',
    b: ['التقديم على الوصول المبكر', 'كيف تعمل', 'القناة الرسمية', 'الدعم'],
  },
};

const langOf = (from) => LANG[((from && from.language_code) || '').slice(0, 2)] || 'en';
const cleanRef = (s) => ((s || '').toLowerCase().match(/^[a-z0-9_-]{1,40}$/) || ['direct'])[0];
// 12+ lowercase words with nothing else looks like a seed phrase
const looksLikeSeed = (s) => /^([a-z]{3,8}\s+){11,23}[a-z]{3,8}$/.test((s || '').trim());

async function tg(method, body) {
  const r = await fetch(`${API}${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) console.error('telegram', method, r.status, await r.text().catch(() => ''));
}

function menu(lang) {
  const b = T[lang].b;
  return { inline_keyboard: [
    [{ text: b[0], callback_data: 'apply' }],
    [{ text: b[1], url: `${SITE}/${lang}/facts` }, { text: b[2], url: CHANNEL }],
    [{ text: b[3], url: SUPPORT }],
  ] };
}

const askEmail = (chat, lang, ref) => tg('sendMessage', {
  chat_id: chat, text: `${T[lang].ask}\n[ref:${ref}]`, reply_markup: { force_reply: true, input_field_placeholder: 'name@example.com' },
});

async function handle(u) {
  if (u.callback_query) {
    const q = u.callback_query, lang = langOf(q.from);
    await tg('answerCallbackQuery', { callback_query_id: q.id });
    const ref = ((q.message && q.message.text) || '').match(REF);
    if (q.data === 'apply' && q.message) await askEmail(q.message.chat.id, lang, ref ? ref[1] : 'direct');
    return;
  }
  const m = u.message;
  if (!m || !m.chat || m.chat.type !== 'private') return; // private chats only
  const lang = langOf(m.from), t = T[lang], text = (m.text || '').trim(), chat = m.chat.id;

  if (looksLikeSeed(text)) return tg('sendMessage', { chat_id: chat, text: t.seed });

  if (text.startsWith('/start')) {
    const ref = cleanRef(text.split(/\s+/)[1]);
    return tg('sendMessage', { chat_id: chat, text: `${t.hi}\n\n${t.safety}\n[ref:${ref}]`, reply_markup: menu(lang) });
  }
  if (text.startsWith('/safety')) return tg('sendMessage', { chat_id: chat, text: t.safety });
  if (text.startsWith('/apply')) return askEmail(chat, lang, 'direct');

  const email = text.match(EMAIL);
  if (email) {
    const quoted = (m.reply_to_message && m.reply_to_message.text) || '';
    const ref = (quoted.match(REF) || [, 'direct'])[1];
    const body = new URLSearchParams({ email: email[0], lang, source: `telegram:${ref}` });
    await fetch(SHEET, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(8000) })
      .catch((e) => console.error('sheet', e.message));
    return tg('sendMessage', { chat_id: chat, text: t.ok, reply_markup: menu(lang) });
  }
  if (m.reply_to_message && REF.test(m.reply_to_message.text || '')) return tg('sendMessage', { chat_id: chat, text: t.bad });
  return tg('sendMessage', { chat_id: chat, text: `${t.hi}\n\n${t.safety}`, reply_markup: menu(lang) });
}

module.exports = async (req, res) => {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_WEBHOOK_SECRET) return res.status(503).end('bot not configured');
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers['x-telegram-bot-api-secret-token'] !== process.env.TELEGRAM_WEBHOOK_SECRET) return res.status(401).end();
  try {
    const u = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    await handle(u || {});
  } catch (e) { console.error('telegram update failed', e.message); }
  res.status(200).end('ok'); // always 200 so Telegram doesn't retry a bad update forever
};

module.exports._test = { handle, langOf, cleanRef, looksLikeSeed, T };
