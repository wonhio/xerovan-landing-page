// Scheduled posts for the official Telegram channel @xerovan.
// The daily cron (vercel.json → /api/telegram?cron=1, 13:00 UTC) posts every entry whose `date` is today (UTC).
// Text is Telegram HTML (<b>, <i>, <a>). Source drafts: ~/.agents/xerovan.com/telegram/posts.md
// Posts 7–8 of that plan (building in public, beta dates) are left out until their facts are confirmed.
const U = (path, c) => `https://www.xerovan.com${path}${path.includes('?') ? '&' : '?'}utm_source=telegram&utm_medium=channel&utm_campaign=${c}`;
const wl = (c) => `https://www.xerovan.com/en/?utm_source=telegram&utm_medium=channel&utm_campaign=${c}#waitlist`;

const SAFETY = `🔐 A reminder, because scams in crypto Telegram are common:

• Xerovan admins never DM you first
• We never ask for a seed phrase, private key or password
• Official accounts: @xerovan and @xerovan_card only. Check the list at xerovan.com/en/facts

If someone claiming to be Xerovan messages you, report and block them.`;

module.exports = [
  { date: '2026-11-16', id: 'w1_how', text: `Most crypto cards make you send your crypto to the card company and top up a balance first.

Xerovan doesn't. Your assets stay in your own wallet, and each payment is funded from it at the moment you pay.

How it works in 4 steps 👇
${U('/en/blog/crypto-card-without-top-up', 'w1_how')}` },

  { date: '2026-11-19', id: 'w1_ads', text: `Running ads for several clients?

One card for every client mixes budgets. Top-up cards add a deposit step, and often a top-up fee, before every campaign.

With Xerovan you can give each client, campaign or ad platform its own card, with limits and receipt approvals.

👉 ${U('/en/solutions/crypto-card-for-ads', 'w1_ads')}` },

  { date: '2026-11-23', id: 'w2_compare', text: `Custodial vs wallet-direct crypto cards: what's the difference?

<b>Custodial:</b> you move crypto to the provider. The balance sits in their account until you spend it.
<b>Wallet-direct:</b> the funds stay in your wallet. Only the amount of each payment leaves, at checkout.

Side-by-side comparison 👇
${U('/en/solutions/custodial-vs-wallet-direct-crypto-card', 'w2_compare')}` },

  { date: '2026-11-26', id: 'w2_chains', text: `Which networks can fund a Xerovan card payment?

Ethereum · Base · Arbitrum · Polygon · BNB Chain · Solana · TRON · Bitcoin

Yes, including USDT on TRON. You can also connect an external wallet like MetaMask.

👉 ${U('/en/facts', 'w2_chains')}` },

  { date: '2026-11-30', id: 'w3_safety', text: SAFETY },

  { date: '2026-12-03', id: 'w3_subs', text: `Paying for cloud, AI tools or SaaS in USD?

Give each subscription its own virtual card, set a limit, and freeze the card when you cancel. No more surprise renewals on a shared card.

👉 ${wl('w3_subs')}` },

  { date: '2026-12-07', id: 'g_mediabuyer', text: `Choosing a card for ad spend?

Fees matter less than whether payments keep going through. Five things to check, and how to test a card before you move budget 👇
${U('/en/blog/media-buyer-card-checklist', 'g_mediabuyer')}` },

  { date: '2026-12-10', id: 'g_usdt_networks', text: `Sending USDT?

TRON, Ethereum and Polygon are different networks. Send on one the recipient doesn't support and the funds can be hard to recover.

What to check before you hit send 👇
${U('/en/blog/usdt-tron-ethereum-polygon', 'g_usdt_networks')}` },

  { date: '2026-12-14', id: 'w5_safety', text: SAFETY },

  { date: '2026-12-17', id: 'g_declined', text: `Card payment declined?

Before you switch cards, narrow down the cause. The 8 usual reasons, and the order to check them in 👇
${U('/en/blog/card-payment-declined-solutions', 'g_declined')}` },

  { date: '2026-12-21', id: 'g_kyc', text: `Applying for a crypto card?

Cards are regulated, so identity checks come first. The documents to have ready, for individuals and for companies 👇
${U('/en/blog/crypto-card-kyc-kyb-guide', 'g_kyc')}` },

  { date: '2026-12-24', id: 'g_flow', text: `When you pay with a crypto card, does the shop receive your stablecoins?

Usually not. Here is what happens between your wallet and the merchant, step by step 👇
${U('/en/blog/stablecoin-card-payment-flow', 'g_flow')}` },

  { date: '2026-12-28', id: 'w7_safety', text: SAFETY },
];

// X (@XerovanC) versions: X allows 280 characters (each link counts as 23), so each post gets its own short text.
// X rejects identical posts, so the three safety reminders differ. No @handles: on X they would tag unrelated accounts.
const XU = (path, c) => U(path, c).replace('utm_source=telegram&utm_medium=channel', 'utm_source=x&utm_medium=social');
const XWL = (c) => wl(c).replace('utm_source=telegram&utm_medium=channel', 'utm_source=x&utm_medium=social');
const X = {
  w1_how: `Most crypto cards make you top up a balance first.

Xerovan doesn't. Your assets stay in your own wallet, and each payment is funded from it at the moment you pay.

How it works in 4 steps: ${XU('/en/blog/crypto-card-without-top-up', 'w1_how')}`,
  w1_ads: `Running ads for several clients?

Give each client, campaign or ad platform its own Xerovan card, with limits and receipt approvals. No more one card mixing every budget.

${XU('/en/solutions/crypto-card-for-ads', 'w1_ads')}`,
  w2_compare: `Custodial vs wallet-direct crypto cards:

Custodial: your crypto sits in the provider's account until you spend it.
Wallet-direct: funds stay in your wallet. Only each payment leaves, at checkout.

${XU('/en/solutions/custodial-vs-wallet-direct-crypto-card', 'w2_compare')}`,
  w2_chains: `Networks that can fund a Xerovan card payment:

Ethereum, Base, Arbitrum, Polygon, BNB Chain, Solana, TRON, Bitcoin

Yes, including USDT on TRON. You can also connect an external wallet like MetaMask.

${XU('/en/facts', 'w2_chains')}`,
  w3_safety: `Scam alert 🔐

Xerovan will never DM you first, and we never ask for your seed phrase, private key or password.

Our official accounts are listed here: ${XU('/en/facts', 'w3_safety')}`,
  w3_subs: `Paying for cloud, AI tools or SaaS in USD?

Give each subscription its own virtual card, set a limit, and freeze it when you cancel. No more surprise renewals.

Join early access: ${XWL('w3_subs')}`,
  g_mediabuyer: `Choosing a card for ad spend?

Fees matter less than whether payments keep going through. 5 things to check, and how to test a card before you move budget:
${XU('/en/blog/media-buyer-card-checklist', 'g_mediabuyer')}`,
  g_usdt_networks: `Sending USDT?

TRON, Ethereum and Polygon are different networks. Send on one the recipient doesn't support and the funds can be hard to recover.

What to check first: ${XU('/en/blog/usdt-tron-ethereum-polygon', 'g_usdt_networks')}`,
  w5_safety: `Reminder 🔐 If someone claiming to be Xerovan messages you first, it isn't us.

Never share your seed phrase, private key or password with anyone.

Official accounts: ${XU('/en/facts', 'w5_safety')}`,
  g_declined: `Card payment declined?

Before you switch cards, narrow down the cause. The 8 usual reasons, and the order to check them in:
${XU('/en/blog/card-payment-declined-solutions', 'g_declined')}`,
  g_kyc: `Applying for a crypto card?

Identity checks come first. The documents to have ready, for individuals and for companies:
${XU('/en/blog/crypto-card-kyc-kyb-guide', 'g_kyc')}`,
  g_flow: `When you pay with a crypto card, does the shop receive your stablecoins?

Usually not. What happens between your wallet and the merchant, step by step:
${XU('/en/blog/stablecoin-card-payment-flow', 'g_flow')}`,
  w7_safety: `Got a message from "Xerovan support"? 🔐

We never DM first and never ask for a seed phrase, private key or password. Check who is real before you reply:
${XU('/en/facts', 'w7_safety')}`,
};
module.exports.forEach((p) => { p.x = X[p.id]; });
