// Support chat inside the waitlist bot (@Xerovan_ai), opened from the site's chat button.
//
// Flow:
//   site button  -> t.me/Xerovan_ai?start=help_<lang>_<page>   topic menu (card / business / other / waitlist)
//   topic button -> t.me/Xerovan_ai?start=ask_<topic>_<lang>    prompt that asks for one message
//   any other text or media the user sends                      forwarded to the team chat, user gets an acknowledgement
//   team replies to the forwarded header (swipe-reply)          relayed back to the user from the bot
//
// Team chat: env TG_SUPPORT_CHAT (a chat or group id where this bot can post), falling back to TG_WAITLIST_REPORT_CHAT
// (the owner DM that already gets the weekly report). With neither set, users are pointed to @xerovan_card instead.
// Stateless for threads: the user's id is written into each forwarded header as "#id<number>", and a reply to that
// header is sent to that id. Only a short rate-limit counter is stored.

const SITE = 'https://www.xerovan.com';
const SUPPORT_URL = 'https://t.me/xerovan_card';
const TOPICS = ['card', 'biz', 'other'];
const LANGS = ['en', 'kr', 'ja', 'es', 'pt', 'ar'];
const TG_LANG = { ko: 'kr', ja: 'ja', es: 'es', pt: 'pt', ar: 'ar' };
const LIMIT = 8; // messages per user per hour that reach the team
const ID_TAG = /#id(\d{1,20})\b/;
const TOPIC_TAG = /\[topic:(card|biz|other)\]/;

const S = {
  en: {
    menu: 'Hi, this is XEROVAN. How can we help?\n\nPick a topic, then write your message here. A person from our team reads every message and replies in this chat.\n\nSafety: never send a seed phrase, private key or password. We will never ask for them.',
    topics: { card: 'Card & app question', biz: 'Business / partnership', other: 'Something else' },
    waitlist: 'Join the waitlist', how: 'How it works',
    ask: { card: 'Card & app question', biz: 'Business / partnership', other: 'Your question' },
    prompt: 'Write your message in one reply below. For business, add your company name and website. If you prefer email, add your address.',
    ack: 'Thanks, your message reached the XEROVAN team. We will reply here in this chat. Fees, launch dates and country availability are not final yet, so we can only share what is confirmed.',
    slow: 'You have sent several messages in the last hour. The team has them all and will reply here soon.',
    off: 'Live support in this bot is not open yet. Please message our support account @xerovan_card.',
    reply: 'XEROVAN support:',
  },
  kr: {
    menu: '안녕하세요, 제로반(XEROVAN)입니다. 무엇을 도와드릴까요?\n\n주제를 고른 뒤 여기에 메시지를 남겨 주세요. 팀원이 모든 메시지를 직접 읽고 이 채팅으로 답장합니다.\n\n보안 안내: 시드 문구, 개인 키, 비밀번호는 보내지 마세요. 저희는 절대 묻지 않습니다.',
    topics: { card: '카드·앱 문의', biz: '비즈니스·제휴 문의', other: '기타 문의' },
    waitlist: '이용 신청', how: '작동 방식',
    ask: { card: '카드·앱 문의', biz: '비즈니스·제휴 문의', other: '문의 내용' },
    prompt: '아래에 한 번의 답장으로 메시지를 적어 주세요. 비즈니스 문의는 회사명과 웹사이트를 함께 적어 주세요. 이메일 답변을 원하시면 주소를 남겨 주세요.',
    ack: '메시지가 제로반 팀에 전달되었습니다. 이 채팅으로 답장드리겠습니다. 수수료, 출시일, 국가별 이용 가능 여부는 아직 확정 전이라 확정된 내용만 안내해 드릴 수 있습니다.',
    slow: '최근 1시간 동안 여러 메시지를 보내셨습니다. 모두 팀에 전달되었으니 곧 이곳으로 답장드리겠습니다.',
    off: '봇 상담은 아직 열리지 않았습니다. 고객지원 계정 @xerovan_card 로 메시지를 보내 주세요.',
    reply: '제로반 고객지원:',
  },
  ja: {
    menu: 'こんにちは、XEROVANです。ご用件をお選びください。\n\nトピックを選んで、ここにメッセージをお送りください。チームの担当者がすべてのメッセージを読み、このチャットで返信します。\n\n安全のために: シードフレーズ・秘密鍵・パスワードは送らないでください。当社がこれらを尋ねることはありません。',
    topics: { card: 'カード・アプリについて', biz: 'ビジネス・提携', other: 'その他' },
    waitlist: 'ウェイトリストに登録', how: '仕組み',
    ask: { card: 'カード・アプリについて', biz: 'ビジネス・提携', other: 'お問い合わせ内容' },
    prompt: '下の返信欄にメッセージを1通でお書きください。ビジネスのご相談は会社名とウェブサイトも添えてください。メールでの返信をご希望の場合はアドレスをお書きください。',
    ack: 'メッセージはXEROVANチームに届きました。このチャットで返信します。手数料・提供開始日・国ごとの提供状況はまだ確定していないため、確定した内容のみご案内できます。',
    slow: '直近1時間に複数のメッセージをいただきました。すべてチームに届いていますので、まもなくこちらで返信します。',
    off: 'このボットでのサポートはまだ開始していません。サポートアカウント @xerovan_card にメッセージをお送りください。',
    reply: 'XEROVANサポート:',
  },
  es: {
    menu: 'Hola, somos XEROVAN. ¿En qué podemos ayudarte?\n\nElige un tema y escribe tu mensaje aquí. Una persona del equipo lee cada mensaje y responde en este chat.\n\nSeguridad: nunca envíes tu frase semilla, clave privada o contraseña. Nunca te las pediremos.',
    topics: { card: 'Tarjeta y app', biz: 'Empresas / alianzas', other: 'Otra consulta' },
    waitlist: 'Unirme a la lista', how: 'Cómo funciona',
    ask: { card: 'Tarjeta y app', biz: 'Empresas / alianzas', other: 'Tu consulta' },
    prompt: 'Escribe tu mensaje en una sola respuesta aquí abajo. Para empresas, añade el nombre y la web de tu compañía. Si prefieres correo, añade tu dirección.',
    ack: 'Gracias, tu mensaje llegó al equipo de XEROVAN. Te responderemos en este chat. Las comisiones, fechas de lanzamiento y la disponibilidad por país aún no son definitivas, así que solo podemos compartir lo confirmado.',
    slow: 'Has enviado varios mensajes en la última hora. El equipo los tiene todos y te responderá aquí pronto.',
    off: 'El soporte en este bot aún no está abierto. Escribe a nuestra cuenta de soporte @xerovan_card.',
    reply: 'Soporte XEROVAN:',
  },
  pt: {
    menu: 'Olá, aqui é a XEROVAN. Como podemos ajudar?\n\nEscolha um tema e escreva sua mensagem aqui. Uma pessoa da equipe lê cada mensagem e responde neste chat.\n\nSegurança: nunca envie sua frase-semente, chave privada ou senha. Nunca vamos pedir isso.',
    topics: { card: 'Cartão e app', biz: 'Empresas / parcerias', other: 'Outro assunto' },
    waitlist: 'Entrar na lista', how: 'Como funciona',
    ask: { card: 'Cartão e app', biz: 'Empresas / parcerias', other: 'Sua pergunta' },
    prompt: 'Escreva sua mensagem em uma única resposta abaixo. Para empresas, inclua o nome e o site da empresa. Se preferir e-mail, inclua seu endereço.',
    ack: 'Obrigado, sua mensagem chegou à equipe da XEROVAN. Vamos responder neste chat. Taxas, datas de lançamento e disponibilidade por país ainda não são definitivas, então só podemos compartilhar o que já está confirmado.',
    slow: 'Você enviou várias mensagens na última hora. A equipe recebeu todas e vai responder aqui em breve.',
    off: 'O suporte por este bot ainda não está aberto. Envie mensagem para nossa conta de suporte @xerovan_card.',
    reply: 'Suporte XEROVAN:',
  },
  ar: {
    menu: 'مرحبًا، هنا XEROVAN. كيف يمكننا مساعدتك؟\n\nاختر موضوعًا ثم اكتب رسالتك هنا. يقرأ أحد أعضاء الفريق كل رسالة ويرد في هذه المحادثة.\n\nللأمان: لا ترسل عبارة الاسترداد أو المفتاح الخاص أو كلمة المرور. لن نطلبها أبدًا.',
    topics: { card: 'البطاقة والتطبيق', biz: 'الأعمال والشراكات', other: 'موضوع آخر' },
    waitlist: 'الانضمام إلى قائمة الانتظار', how: 'كيف تعمل',
    ask: { card: 'البطاقة والتطبيق', biz: 'الأعمال والشراكات', other: 'سؤالك' },
    prompt: 'اكتب رسالتك في رد واحد أدناه. لاستفسارات الأعمال، أضف اسم شركتك وموقعها. إن كنت تفضّل البريد الإلكتروني فأضف عنوانك.',
    ack: 'شكرًا، وصلت رسالتك إلى فريق XEROVAN. سنرد عليك في هذه المحادثة. الرسوم ومواعيد الإطلاق والتوفر حسب البلد ليست نهائية بعد، لذا نشارك فقط ما تم تأكيده.',
    slow: 'أرسلت عدة رسائل خلال الساعة الماضية. وصلت جميعها إلى الفريق وسنرد هنا قريبًا.',
    off: 'الدعم عبر هذا البوت غير متاح بعد. يرجى مراسلة حساب الدعم ‎@xerovan_card.',
    reply: 'دعم XEROVAN:',
  },
};

const teamChat = () => process.env.TG_SUPPORT_CHAT || process.env.TG_WAITLIST_REPORT_CHAT || '';
const langOf = (from, hint) => (LANGS.includes(hint) ? hint : TG_LANG[((from && from.language_code) || '').slice(0, 2)] || 'en');

// "/start help_kr_blog" -> { kind: 'help', lang: 'kr', page: 'blog' }; "/start ask_biz_es" -> { kind: 'ask', topic: 'biz', lang: 'es' }
function parseStart(arg) {
  let m = /^help_([a-z]{2})(?:_([a-z0-9-]{1,20}))?$/.exec(arg || '');
  if (m) return { kind: 'help', lang: m[1], page: m[2] || 'site' };
  m = /^ask_(card|biz|other)_([a-z]{2})$/.exec(arg || '');
  if (m) return { kind: 'ask', topic: m[1], lang: m[2] };
  return null;
}

function create({ tg, kv, getUser, place, botUser, appButton }) {
  const deep = (arg) => `https://t.me/${botUser()}?start=${arg}`;

  const menu = (chat, lang) => {
    const t = S[lang];
    return tg('sendMessage', { chat_id: chat, text: t.menu, reply_markup: { inline_keyboard: [
      ...TOPICS.map((k) => [{ text: t.topics[k], url: deep(`ask_${k}_${lang}`) }]),
      [appButton(t.waitlist)],
      [{ text: t.how, url: `${SITE}/${lang}/facts` }],
    ] } });
  };

  const ask = (chat, lang, topic) => tg('sendMessage', {
    chat_id: chat, text: `${S[lang].ask[topic]}\n\n${S[lang].prompt}\n[topic:${topic}]`,
    reply_markup: { force_reply: true },
  });

  // Plain text only (no parse_mode), so nothing the user typed can be read as markup.
  async function header(m, topic, lang) {
    const f = m.from, u = await getUser(f.id).catch(() => null);
    const src = (await kv('GET', `src:${f.id}`).catch(() => null)) || (u && u.source) || 'bot';
    let wl = 'not on waitlist';
    if (u) {
      const p = await place(u).catch(() => null);
      wl = `${u.country}${u.state ? ` / ${u.state}` : ''}${p ? ` · #${p} in line` : ''} · ${u.email}`;
    }
    const name = [f.first_name, f.last_name].filter(Boolean).join(' ');
    return [`💬 ${topic.toUpperCase()} · ${lang}`, `${name}${f.username ? ` @${f.username}` : ''} · #id${f.id}`,
      `source: ${src} · waitlist: ${wl}`, '↩️ Reply to this message to answer.'].join('\n');
  }

  // A rolling hour: each message resets the window, so a burst is capped and the counter clears after an hour of quiet.
  async function overLimit(id) {
    const k = `sup:${id}`;
    const n = Number(await kv('GET', k).catch(() => 0)) || 0;
    await kv('SET', k, String(n + 1), 'EX', 3600).catch(() => {});
    return n >= LIMIT;
  }

  // From the user: forward to the team chat, acknowledge.
  async function forward(m) {
    const quoted = (m.reply_to_message && m.reply_to_message.text) || '';
    const topic = (quoted.match(TOPIC_TAG) || [, 'other'])[1];
    const lang = langOf(m.from);
    const chat = teamChat();
    if (!chat) return tg('sendMessage', { chat_id: m.chat.id, text: S[lang].off });
    if (await overLimit(m.from.id)) return tg('sendMessage', { chat_id: m.chat.id, text: S[lang].slow });
    const head = await header(m, topic, lang);
    const r = m.text
      ? await tg('sendMessage', { chat_id: chat, text: `${head}\n\n${m.text}`.slice(0, 4096), link_preview_options: { is_disabled: true } })
      : await tg('sendMessage', { chat_id: chat, text: head }).then(async (h) => (h.ok
        ? tg('copyMessage', { chat_id: chat, from_chat_id: m.chat.id, message_id: m.message_id, reply_to_message_id: h.result.message_id })
        : h));
    if (!r.ok) return tg('sendMessage', { chat_id: m.chat.id, text: S[lang].off });
    return tg('sendMessage', { chat_id: m.chat.id, text: S[lang].ack });
  }

  // From the team chat: a reply to a forwarded header goes back to that user. Returns true if handled.
  async function relay(m) {
    const chat = teamChat();
    if (!chat || String(m.chat.id) !== String(chat)) return false;
    const target = m.reply_to_message && (m.reply_to_message.text || m.reply_to_message.caption || '');
    const id = target && (target.match(ID_TAG) || [])[1];
    if (!id) return false;
    if ((m.text || '').startsWith('/')) return false;
    const lang = (target.match(/^💬 \S+ · (en|kr|ja|es|pt|ar)$/m) || [, 'en'])[1];
    const r = m.text
      ? await tg('sendMessage', { chat_id: id, text: `${S[lang].reply}\n\n${m.text}`, link_preview_options: { is_disabled: true } })
      : await tg('copyMessage', { chat_id: id, from_chat_id: m.chat.id, message_id: m.message_id });
    await tg('sendMessage', { chat_id: m.chat.id, reply_to_message_id: m.message_id,
      text: r.ok ? '✓ Sent' : `✗ Not sent: ${r.description || 'unknown error'} (the user may have blocked the bot)` });
    return true;
  }

  return { menu, ask, forward, relay };
}

module.exports = { create, parseStart, langOf, teamChat, S, TOPICS, ID_TAG };
