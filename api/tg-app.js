// XEROVAN waitlist bot (@Xerovan_ai) + Telegram Mini App backend (/tg).
//
// Separate from api/telegram.js (channel posts and the older email-reply bot): this one uses its own bot.
// Off until these env vars are set in Vercel:
//   TG_WAITLIST_BOT_TOKEN       token of @Xerovan_ai from @BotFather
//   TG_WAITLIST_WEBHOOK_SECRET  any random string; Telegram sends it back on every update
//   Storage, one of:
//     POSTGRES_URL                 Postgres, e.g. the Supabase store connected to this project (tables in schema "xerovan")
//     UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN   (or KV_REST_API_URL / KV_REST_API_TOKEN) Upstash Redis
// Optional: CRON_SECRET (already used by the channel cron) protects the admin export and broadcast.
//
// One-time setup, run on the server so the token never leaves Vercel (safe to rerun):
//   curl -H "x-setup-key: $TG_WAITLIST_WEBHOOK_SECRET" "https://www.xerovan.com/api/tg-app?setup=1"
//
// Routes (all on /api/tg-app):
//   POST (Telegram webhook, secret header)        bot updates: /start, /status, /invite, /help
//   GET  ?action=me        (X-Tg-Init-Data)        my record, place in line, invite link
//   POST ?action=signup    (X-Tg-Init-Data)        {country, state?, email, privacy, updates}
//   POST ?action=channel   (X-Tg-Init-Data)        check that I joined @xerovan, +3 places
//   GET  ?admin=export     (Bearer CRON_SECRET)    CSV of everyone
//   POST ?admin=broadcast  (Bearer CRON_SECRET)    {text, limit, dry} message the top of the line, once each
//   POST ?admin=delete     (Bearer CRON_SECRET)    {id} remove one signup (tests, deletion requests)

const crypto = require('crypto');

const KV_URL = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const KV_TOKEN = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const SITE = 'https://www.xerovan.com';
const APP_URL = `${SITE}/tg/`;
const CHANNEL = '@xerovan';
const CHANNEL_URL = 'https://t.me/xerovan';
const SUPPORT_URL = 'https://t.me/xerovan_card';
// Existing waitlist pipeline (Google Sheet via Apps Script), same as the site form and api/telegram.js.
const SHEET = 'https://script.google.com/macros/s/AKfycbxKNLj0A3U9I-49Yh6bO_7oZltUSemfqj8RjVvyMoUEJLVLKiVxt2YS68BLVX0I4TY1/exec';

const PTS_REFERRAL = 5;
const PTS_CHANNEL = 3;
const MAX_REFERRALS = 50; // referrals counted for points; more are recorded but don't move you further

// Card program countries, from the site FAQ (en/index.html, "Which countries are currently supported?").
const COUNTRIES = ['Antigua and Barbuda', 'Argentina', 'Australia', 'Bahamas', 'Bangladesh', 'Barbados', 'Belize', 'Bolivia', 'Brazil',
  'Cayman Islands', 'Colombia', 'Costa Rica', "Côte d'Ivoire", 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Ghana',
  'Grenada', 'Guatemala', 'Guyana', 'Honduras', 'Japan', 'Kenya', 'Malaysia', 'Mexico', 'Morocco', 'New Zealand', 'Pakistan', 'Panama',
  'Paraguay', 'Peru', 'Philippines', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Senegal', 'Singapore',
  'South Africa', 'Suriname', 'Thailand', 'Trinidad and Tobago', 'Turks and Caicos Islands', 'Uganda', 'United Arab Emirates', 'Uruguay', 'Zambia'];
const REVIEW = ['Nigeria']; // enhanced review, needs approval
const US_STATES = ['Alabama', 'Alaska', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Florida', 'Hawaii', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Maine', 'Massachusetts', 'Michigan', 'Minnesota', 'Montana', 'Nebraska', 'New Hampshire', 'New Jersey', 'New York',
  'North Carolina', 'Oklahoma', 'Pennsylvania', 'South Carolina', 'Texas', 'Utah', 'Virginia', 'West Virginia', 'Wyoming'];
const US = 'United States';
const OTHER = 'Other';

const EMAIL = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const DISPOSABLE = new Set(['mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org', 'yopmail.com',
  'trashmail.com', 'getnada.com', 'sharklasers.com', 'dispostable.com', 'maildrop.cc', 'throwawaymail.com', 'fakeinbox.com', 'mintemail.com']);

const T = {
  welcome: 'Welcome to XEROVAN 👋\n\nXEROVAN is a Visa card that pays straight from your own crypto wallet, with no top-up.\n\nThe private beta opens soon. Join the waitlist in under a minute, and move up the line by inviting friends.\n\nSafety: XEROVAN staff never message you first and never ask for a seed phrase, private key or password.',
  open: 'Open XEROVAN',
  channel: 'Official channel',
  help: 'Questions? See how XEROVAN works, or contact support.\n\nOfficial accounts: channel @xerovan, support @xerovan_card, and this bot.',
  notJoined: "You're not on the waitlist yet. Tap below to join.",
  seed: 'Please never share a seed phrase, private key or password with anyone, including us. XEROVAN will never ask for them. If you sent one by mistake, move your funds to a new wallet.',
  shareText: 'I just joined the XEROVAN waitlist, a Visa card that pays straight from your own crypto wallet. Join with my link:',
};

// ---------- helpers ----------
const bad = (res, code, error) => res.status(code).json({ ok: false, error });
const now = () => Math.floor(Date.now() / 1000);
const botUser = () => process.env.TG_WAITLIST_BOT_USERNAME || 'Xerovan_ai';
const inviteLink = (code) => `https://t.me/${botUser()}?start=ref_${code}`;
const looksLikeSeed = (s) => /^([a-z]{3,8}\s+){11,23}[a-z]{3,8}$/.test((s || '').trim());
const newCode = () => Array.from(crypto.randomBytes(6), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');

function eligibility(country, state) {
  if (COUNTRIES.includes(country)) return 'yes';
  if (REVIEW.includes(country)) return 'review';
  if (country === US) return US_STATES.includes(state) ? 'yes' : 'no';
  return 'no';
}

// Telegram Mini App initData check: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
function verifyInitData(initData, token, maxAgeSec = 86400) {
  if (!initData || !token) return null;
  const p = new URLSearchParams(initData);
  const hash = p.get('hash');
  if (!hash) return null;
  p.delete('hash');
  const check = [...p.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, v]) => `${k}=${v}`).join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  const calc = crypto.createHmac('sha256', secret).update(check).digest('hex');
  if (calc.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash))) return null;
  if (now() - Number(p.get('auth_date') || 0) > maxAgeSec) return null;
  try { return JSON.parse(p.get('user') || 'null'); } catch { return null; }
}

// ---------- storage ----------
// Postgres (Supabase, env POSTGRES_URL) or Upstash Redis REST. Both answer the same small set of Redis-style
// commands, so the waitlist logic below doesn't care which one is connected.
const PG_URL = () => process.env.POSTGRES_URL;
let pgPool = null, pgReady = null;
function pg() {
  if (!pgPool) {
    const { Pool } = require('pg');
    const u = new URL(PG_URL());
    u.searchParams.delete('sslmode'); u.searchParams.delete('supa');
    pgPool = new Pool({ connectionString: u.toString(), ssl: { rejectUnauthorized: false }, max: 1, idleTimeoutMillis: 5000 });
  }
  if (!pgReady) {
    pgReady = pgPool.query(`
      CREATE SCHEMA IF NOT EXISTS xerovan;
      CREATE TABLE IF NOT EXISTS xerovan.tg_kv (k text PRIMARY KEY, v text NOT NULL, expires timestamptz);
      CREATE TABLE IF NOT EXISTS xerovan.tg_zset (name text NOT NULL, member text NOT NULL, score double precision NOT NULL, PRIMARY KEY (name, member));
      CREATE INDEX IF NOT EXISTS tg_zset_order ON xerovan.tg_zset (name, score, member);
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
          REVOKE ALL ON SCHEMA xerovan FROM anon, authenticated;
          REVOKE ALL ON ALL TABLES IN SCHEMA xerovan FROM anon, authenticated;
        END IF;
      END $$;
    `).catch((e) => { pgReady = null; throw e; });
  }
  return pgReady.then(() => pgPool);
}
const LIVE = '(expires IS NULL OR expires > now())';
async function pgCmd(cmd, ...a) {
  const db = await pg();
  const q = async (text, params) => (await db.query(text, params)).rows;
  switch (cmd) {
    case 'PING': await q('SELECT 1'); return 'PONG';
    case 'GET': { const r = await q(`SELECT v FROM xerovan.tg_kv WHERE k = $1 AND ${LIVE}`, [a[0]]); return r[0] ? r[0].v : null; }
    case 'SET': {
      const [k, v, ...opts] = a;
      const ex = opts.indexOf('EX') >= 0 ? Number(opts[opts.indexOf('EX') + 1]) : null;
      const expires = ex ? new Date(Date.now() + ex * 1000) : null;
      if (opts.includes('NX')) {
        const r = await q(`INSERT INTO xerovan.tg_kv AS t (k, v, expires) VALUES ($1, $2, $3)
          ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v, expires = EXCLUDED.expires WHERE t.expires IS NOT NULL AND t.expires <= now()
          RETURNING k`, [k, v, expires]);
        return r.length ? 'OK' : null;
      }
      await q(`INSERT INTO xerovan.tg_kv (k, v, expires) VALUES ($1, $2, $3) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v, expires = EXCLUDED.expires`, [k, v, expires]);
      return 'OK';
    }
    case 'DEL': return (await db.query('DELETE FROM xerovan.tg_kv WHERE k = $1', [a[0]])).rowCount;
    case 'SCAN': { // SCAN cursor MATCH pattern COUNT n -> everything in one page
      const pattern = a[a.indexOf('MATCH') + 1].replace(/[%_\\]/g, (c) => `\\${c}`).replace(/\*/g, '%');
      const r = await q(`SELECT k FROM xerovan.tg_kv WHERE k LIKE $1 AND ${LIVE} ORDER BY k`, [pattern]);
      return ['0', r.map((x) => x.k)];
    }
    case 'ZADD': await q(`INSERT INTO xerovan.tg_zset (name, score, member) VALUES ($1, $2, $3)
      ON CONFLICT (name, member) DO UPDATE SET score = EXCLUDED.score`, [a[0], Number(a[1]), String(a[2])]); return 1;
    case 'ZREM': return (await db.query('DELETE FROM xerovan.tg_zset WHERE name = $1 AND member = $2', [a[0], String(a[1])])).rowCount;
    case 'ZCARD': return Number((await q('SELECT count(*) AS n FROM xerovan.tg_zset WHERE name = $1', [a[0]]))[0].n);
    case 'ZRANK': {
      const r = await q(`SELECT (SELECT count(*) FROM xerovan.tg_zset o WHERE o.name = z.name AND (o.score < z.score OR (o.score = z.score AND o.member < z.member))) AS rank
        FROM xerovan.tg_zset z WHERE z.name = $1 AND z.member = $2`, [a[0], String(a[1])]);
      return r[0] ? Number(r[0].rank) : null;
    }
    case 'ZRANGE': return (await q('SELECT member FROM xerovan.tg_zset WHERE name = $1 ORDER BY score, member', [a[0]])).map((x) => x.member);
    default: throw new Error(`pg: unsupported ${cmd}`);
  }
}
async function kv(...cmd) {
  if (PG_URL()) return pgCmd(...cmd);
  const r = await fetch(KV_URL(), {
    method: 'POST', headers: { authorization: `Bearer ${KV_TOKEN()}`, 'content-type': 'application/json' },
    body: JSON.stringify(cmd), signal: AbortSignal.timeout(8000),
  });
  const j = await r.json().catch(() => ({}));
  if (j.error) throw new Error(`kv ${cmd[0]}: ${j.error}`);
  return j.result;
}
const storeReady = () => !!(PG_URL() || (KV_URL() && KV_TOKEN()));
const getUser = async (id) => { const v = await kv('GET', `u:${id}`); return v ? JSON.parse(v) : null; };
const putUser = (u) => kv('SET', `u:${u.id}`, JSON.stringify(u));
const points = (u) => PTS_REFERRAL * Math.min(u.referrals || 0, MAX_REFERRALS) + (u.channel ? PTS_CHANNEL : 0);
// Lower sorts first: more points first, then earlier signup.
const sortKey = (u) => u.created - points(u) * 1e10;
async function requeue(u) { if (u.eligible !== 'no') await kv('ZADD', 'queue', sortKey(u), String(u.id)); }
async function place(u) {
  if (u.eligible === 'no') return null;
  const r = await kv('ZRANK', 'queue', String(u.id));
  return r === null || r === undefined ? null : r + 1;
}
async function view(u) {
  return { ok: true, joined: true, email: u.email, country: u.country, state: u.state || null, eligible: u.eligible,
    position: await place(u), total: await kv('ZCARD', 'queue'), referrals: u.referrals || 0, channel: !!u.channel,
    points: points(u), link: u.eligible === 'no' ? null : inviteLink(u.code), shareText: T.shareText };
}

// ---------- Telegram ----------
async function tg(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${process.env.TG_WAITLIST_BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}), signal: AbortSignal.timeout(8000),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) console.error('telegram', method, j.description);
  return j;
}
const appButton = (text = T.open) => ({ text, web_app: { url: APP_URL } });
const startKeyboard = () => ({ inline_keyboard: [[appButton()], [{ text: T.channel, url: CHANNEL_URL }]] });

async function statusText(u) {
  const v = await view(u);
  if (u.eligible === 'no') return `You're on the notify list for ${u.country}. We'll message you here if XEROVAN becomes available there.`;
  return `You're #${v.position} of ${v.total} on the waitlist.\n${v.referrals} friend${v.referrals === 1 ? '' : 's'} joined with your link.\n\nYour invite link:\n${v.link}`;
}

async function handleUpdate(u) {
  const m = u.message;
  if (!m || !m.chat || m.chat.type !== 'private' || !m.from) return;
  const text = (m.text || '').trim(), chat = m.chat.id;
  if (looksLikeSeed(text)) return tg('sendMessage', { chat_id: chat, text: T.seed });

  if (text.startsWith('/start')) {
    const arg = text.split(/\s+/)[1] || '';
    const ref = (arg.match(/^ref_([A-Z0-9]{6})$/) || [])[1];
    const existing = await getUser(m.from.id);
    if (!existing) {
      // Remember where they came from until they sign up in the mini app (30 days).
      if (ref) await kv('SET', `pending:${m.from.id}`, ref, 'EX', 2592000);
      else if (/^[a-z0-9_-]{1,40}$/i.test(arg)) await kv('SET', `src:${m.from.id}`, arg.toLowerCase(), 'EX', 2592000);
    }
    return tg('sendMessage', { chat_id: chat, text: existing ? await statusText(existing) : T.welcome, reply_markup: startKeyboard() });
  }
  if (text.startsWith('/status') || text.startsWith('/invite')) {
    const existing = await getUser(m.from.id);
    return tg('sendMessage', { chat_id: chat, text: existing ? await statusText(existing) : T.notJoined, reply_markup: { inline_keyboard: [[appButton()]] } });
  }
  if (text.startsWith('/help')) {
    return tg('sendMessage', { chat_id: chat, text: T.help, reply_markup: { inline_keyboard: [
      [{ text: 'How it works', url: `${SITE}/en/facts` }, { text: 'Support', url: SUPPORT_URL }], [appButton()]] } });
  }
  return tg('sendMessage', { chat_id: chat, text: T.welcome, reply_markup: startKeyboard() });
}

// ---------- mini app API ----------
async function signup(tgUser, b) {
  const country = String(b.country || '');
  const state = country === US ? String(b.state || '') : '';
  const email = String(b.email || '').trim().toLowerCase();
  if (![...COUNTRIES, ...REVIEW, US, OTHER].includes(country)) return [400, 'Please choose your country.'];
  if (country === US && !state) return [400, 'Please choose your state.'];
  if (!EMAIL.test(email) || email.length > 254) return [400, 'Please enter a valid email address.'];
  if (DISPOSABLE.has(email.split('@')[1])) return [400, 'Please use a permanent email address.'];
  if (b.privacy !== true) return [400, 'Please accept the Privacy Policy to continue.'];

  const owner = await kv('GET', `email:${email}`);
  if (owner && owner !== String(tgUser.id)) return [409, 'This email is already on the waitlist with another Telegram account. Contact support if this is you.'];

  let u = await getUser(tgUser.id);
  const eligible = eligibility(country, state);
  if (u) {
    // Updating details keeps place, code and referrals.
    if (u.email !== email) { await kv('DEL', `email:${u.email}`); }
    Object.assign(u, { email, country, state, eligible, updates: !!b.updates });
  } else {
    let code = newCode();
    while (await kv('SET', `ref:${code}`, String(tgUser.id), 'NX') !== 'OK') code = newCode();
    const pending = await kv('GET', `pending:${tgUser.id}`);
    let referredBy = null;
    if (pending) {
      const by = await kv('GET', `ref:${pending}`);
      if (by && by !== String(tgUser.id)) referredBy = by;
    }
    const src = (await kv('GET', `src:${tgUser.id}`)) || (referredBy ? 'referral' : 'direct');
    u = { id: tgUser.id, username: tgUser.username || null, name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' '),
      email, country, state, eligible, updates: !!b.updates, code, referredBy, referrals: 0, channel: false, source: src, created: now() };
    if (referredBy) {
      const r = await getUser(referredBy);
      if (r && r.email !== email) {
        r.referrals = (r.referrals || 0) + 1;
        await putUser(r); await requeue(r);
        await tg('sendMessage', { chat_id: r.id, text: `🎉 A friend just joined with your link. You moved up the line.\n\n${await statusText(r)}` });
      } else u.referredBy = null;
    }
    await kv('DEL', `pending:${tgUser.id}`); await kv('DEL', `src:${tgUser.id}`);
  }
  await kv('SET', `email:${email}`, String(tgUser.id));
  await putUser(u);
  if (eligible === 'no') await kv('ZREM', 'queue', String(u.id)); else await requeue(u);

  // Keep the existing Google Sheet pipeline in sync (best effort).
  const row = new URLSearchParams({ email, lang: 'en', source: `telegram-app:${u.source}`, country: state ? `${country} / ${state}` : country });
  await fetch(SHEET, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: row, signal: AbortSignal.timeout(8000) })
    .catch((e) => console.error('sheet', e.message));

  if (!u.welcomed) {
    u.welcomed = true; await putUser(u);
    await tg('sendMessage', { chat_id: u.id, text: eligible === 'no'
      ? `Thanks. XEROVAN isn't available in ${country} yet. We'll message you here if that changes.`
      : `You're on the list ✅\n\n${await statusText(u)}\n\nEvery friend who joins with your link moves you up ${PTS_REFERRAL} places. We'll message you here when your beta invite is ready.` });
  }
  return [200, await view(u)];
}

async function checkChannel(u) {
  const r = await tg('getChatMember', { chat_id: CHANNEL, user_id: u.id });
  const st = r.ok && r.result.status;
  const joined = ['creator', 'administrator', 'member'].includes(st) || (st === 'restricted' && r.result.is_member === true);
  if (!r.ok) return [503, 'We could not check the channel right now. Please try again later.'];
  if (joined && !u.channel) { u.channel = true; await putUser(u); await requeue(u); }
  return [200, { ...(await view(u)), channelChecked: joined }];
}

// ---------- admin ----------
async function allUsers() {
  const out = []; let cursor = '0';
  do {
    const [next, keys] = await kv('SCAN', cursor, 'MATCH', 'u:*', 'COUNT', 500);
    cursor = next;
    for (const k of keys) { const v = await kv('GET', k); if (v) out.push(JSON.parse(v)); }
  } while (cursor !== '0');
  return out;
}
async function exportCsv() {
  const users = await allUsers();
  const ranks = new Map((await kv('ZRANGE', 'queue', 0, -1)).map((id, i) => [id, i + 1]));
  const cols = ['position', 'id', 'username', 'name', 'email', 'country', 'state', 'eligible', 'referrals', 'channel', 'points', 'source', 'referredBy', 'updates', 'created', 'invited'];
  const esc = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const rows = users.map((u) => ({ ...u, position: ranks.get(String(u.id)) || '', points: points(u), created: new Date(u.created * 1000).toISOString(),
    invited: u.invited ? new Date(u.invited * 1000).toISOString() : '' }))
    .sort((a, b) => (a.position || 1e9) - (b.position || 1e9));
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}
async function broadcast(b) {
  const text = String(b.text || '').trim();
  const limit = Math.min(Math.max(parseInt(b.limit, 10) || 0, 1), 1000);
  if (!text) return { ok: false, error: 'text required' };
  const ids = await kv('ZRANGE', 'queue', 0, -1);
  const targets = [];
  for (const id of ids) {
    if (targets.length >= limit) break;
    const u = await getUser(id);
    if (u && !u.invited && u.eligible === 'yes') targets.push(u);
  }
  if (b.dry) return { ok: true, dry: true, count: targets.length, first: targets.slice(0, 5).map((u) => u.email) };
  let sent = 0; const failed = [];
  for (const u of targets) {
    const r = await tg('sendMessage', { chat_id: u.id, text, reply_markup: { inline_keyboard: [[appButton()]] } });
    if (r.ok) { u.invited = now(); await putUser(u); sent++; } else failed.push({ id: u.id, error: r.description });
    await new Promise((ok) => setTimeout(ok, 45)); // stay well under Telegram's ~30 msg/s
  }
  return { ok: true, sent, failed };
}

async function removeUser(id) {
  const u = await getUser(id);
  if (!u) return { ok: false, error: 'not found' };
  if (u.referredBy) {
    const r = await getUser(u.referredBy);
    if (r && r.referrals > 0) { r.referrals -= 1; await putUser(r); await requeue(r); }
  }
  await kv('ZREM', 'queue', String(id));
  for (const k of [`u:${id}`, `email:${u.email}`, `ref:${u.code}`, `pending:${id}`, `src:${id}`]) await kv('DEL', k);
  return { ok: true, removed: id };
}

async function setup() {
  const out = {};
  const me = await tg('getMe');
  out.bot = me.ok ? `@${me.result.username}` : me.description;
  out.webhook = (await tg('setWebhook', { url: `${SITE}/api/tg-app`, secret_token: process.env.TG_WAITLIST_WEBHOOK_SECRET,
    allowed_updates: ['message'], drop_pending_updates: true })).ok;
  out.commands = (await tg('setMyCommands', { commands: [
    { command: 'start', description: 'Join the waitlist' }, { command: 'status', description: 'My place in line' },
    { command: 'invite', description: 'Get my invite link' }, { command: 'help', description: 'FAQ & support' }] })).ok;
  out.menu = (await tg('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Open', web_app: { url: APP_URL } } })).ok;
  const cm = me.ok ? await tg('getChatMember', { chat_id: CHANNEL, user_id: me.result.id }) : {};
  out.channel_admin = cm.ok ? cm.result.status : (cm.description || 'unknown');
  out.kv = await kv('PING').catch((e) => e.message);
  return out;
}

// ---------- handler ----------
const readBody = (req) => (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {});

module.exports = async (req, res) => {
  const e = process.env;
  if (!e.TG_WAITLIST_BOT_TOKEN || !e.TG_WAITLIST_WEBHOOK_SECRET || !storeReady()) return bad(res, 503, 'not configured');
  const q = new URL(req.url, SITE).searchParams;
  res.setHeader('cache-control', 'no-store');
  try {
    if (q.get('setup')) {
      if (req.headers['x-setup-key'] !== e.TG_WAITLIST_WEBHOOK_SECRET) return bad(res, 401, 'unauthorized');
      return res.status(200).json(await setup());
    }
    if (q.get('admin')) {
      if (!e.CRON_SECRET || req.headers.authorization !== `Bearer ${e.CRON_SECRET}`) return bad(res, 401, 'unauthorized');
      if (q.get('admin') === 'export') { res.setHeader('content-type', 'text/csv; charset=utf-8'); return res.status(200).send(await exportCsv()); }
      if (q.get('admin') === 'broadcast' && req.method === 'POST') return res.status(200).json(await broadcast(readBody(req)));
      if (q.get('admin') === 'delete' && req.method === 'POST') return res.status(200).json(await removeUser(String(readBody(req).id || '')));
      return bad(res, 400, 'unknown admin action');
    }
    const action = q.get('action');
    if (action) {
      const user = verifyInitData(req.headers['x-tg-init-data'], e.TG_WAITLIST_BOT_TOKEN);
      if (!user || !user.id) return bad(res, 401, 'Please open this page from the XEROVAN bot in Telegram.');
      if (action === 'me' && req.method === 'GET') {
        const u = await getUser(user.id);
        const lists = { countries: [...COUNTRIES, ...REVIEW, US].sort(), states: US_STATES };
        return res.status(200).json(u ? { ...(await view(u)), ...lists } : { ok: true, joined: false, ...lists });
      }
      if (action === 'signup' && req.method === 'POST') { const [code, body] = await signup(user, readBody(req)); return code === 200 ? res.status(200).json(body) : bad(res, code, body); }
      if (action === 'channel' && req.method === 'POST') {
        const u = await getUser(user.id);
        if (!u) return bad(res, 400, 'Join the waitlist first.');
        const [code, body] = await checkChannel(u); return code === 200 ? res.status(200).json(body) : bad(res, code, body);
      }
      return bad(res, 400, 'unknown action');
    }
    // Telegram webhook
    if (req.method !== 'POST') return bad(res, 405, 'method not allowed');
    if (req.headers['x-telegram-bot-api-secret-token'] !== e.TG_WAITLIST_WEBHOOK_SECRET) return bad(res, 401, 'unauthorized');
    try { await handleUpdate(readBody(req)); } catch (err) { console.error('tg-app update failed', err.message); }
    return res.status(200).end('ok'); // always 200 so Telegram doesn't retry a bad update forever
  } catch (err) {
    console.error('tg-app', err.message);
    return bad(res, 500, 'Something went wrong. Please try again.');
  }
};

module.exports._test = { verifyInitData, eligibility, points, sortKey, handleUpdate, signup, checkChannel, broadcast, exportCsv, COUNTRIES, US_STATES };
