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

  { date: '2026-11-17', id: 'news_visa_programs', text: `<b>📰 Industry news</b>

Visa now has more than 225 stablecoin-linked card programs live worldwide. Its stablecoin settlement is running above $25B a year, about 10x a year earlier (Visa's Oct 27 earnings call).

Stablecoin cards are becoming everyday payments infrastructure.

Our take: the card should pay from your own wallet, not from a balance you top up first. How Xerovan does it 👇
${U('/en/blog/crypto-card-without-top-up', 'news_visa_programs')}

<i>Sources: The Block (Nov 10), crypto.news (Nov 12)</i>` },

  { date: '2026-11-18', id: 'news_card_volume', text: `<b>📊 By the numbers</b>

Stablecoin card volume tracked by Paymentscan reached about $1.37B in October 2026, across roughly 12.9M transactions.

Worth knowing: the figure mixes on-chain data with some issuer-reported data, and a card top-up isn't the same as a purchase.

The direction is still clear. People want to spend stablecoins like money.

With Xerovan you do that straight from your own wallet. What happens at checkout 👇
${U('/en/blog/stablecoin-card-payment-flow', 'news_card_volume')}

<i>Source: crypto.news (Nov 3)</i>` },

  { date: '2026-11-19', id: 'w1_ads', text: `Running ads for several clients?

One card for every client mixes budgets. Top-up cards add a deposit step, and often a top-up fee, before every campaign.

With Xerovan you can give each client, campaign or ad platform its own card, with limits and receipt approvals.

👉 ${U('/en/solutions/crypto-card-for-ads', 'w1_ads')}` },

  { date: '2026-11-20', id: 'news_usdpt', text: `<b>📰 Industry news</b>

Visa has added Western Union's USDPT stablecoin as a settlement asset on VisaNet, in partnership with Anchorage Digital, which issues it. Eligible partners can use it to settle VisaNet obligations.

One more global payments brand moving money on stablecoin rails.

For you the question is simpler: can you spend your USDT/USDC directly? With Xerovan, each card payment is funded from your own wallet at checkout.

Join early access 👉 ${wl('news_usdpt')}

<i>Source: crypto.news (Nov 12)</i>` },

  { date: '2026-11-21', id: 'news_supply', text: `<b>📊 By the numbers</b>

Total stablecoin supply stood at about $284.9B on Nov 16 (DeFiLlama). USDT was about $175.3B and USDC about $69.3B, together roughly 86% of the market.

Supply dipped $4.15B in the week to Nov 15, but the picture is the same: for most people, "stablecoin" means USDT or USDC.

Xerovan cards pay with both, straight from your own wallet 👇
${U('/en/facts', 'news_supply')}

<i>Sources: DeFiLlama, Lookonchain, via TronWeekly (Nov 16)</i>` },

  { date: '2026-11-22', id: 'news_hk_bill', text: `<b>📰 Asia regulation</b>

Hong Kong will introduce a bill before the end of 2026 to license four more digital-asset activities: dealing, advising, asset management and custody, Financial Secretary Paul Chan said on Nov 16.

On stablecoins, the bar is high: only 2 of 36 applicants received an issuer license in the first round.

Rules for stablecoins are taking shape across Asia. We'll keep tracking what changes for people who hold and spend them.

Get Xerovan updates 👉 ${wl('news_hk_bill')}

<i>Source: crypto.news (Nov 16)</i>` },

  { date: '2026-11-23', id: 'w2_compare', text: `Custodial vs wallet-direct crypto cards: what's the difference?

<b>Custodial:</b> you move crypto to the provider. The balance sits in their account until you spend it.
<b>Wallet-direct:</b> the funds stay in your wallet. Only the amount of each payment leaves, at checkout.

Side-by-side comparison 👇
${U('/en/solutions/custodial-vs-wallet-direct-crypto-card', 'w2_compare')}` },

  { date: '2026-11-24', id: 'news_tron_usdt', text: `<b>📊 By the numbers</b>

Stablecoins on TRON reached about $94.2B on Nov 9. USDT makes up about $92.2B of that, nearly 98%.

TRON is where much of the world's USDT lives, especially for everyday transfers.

Xerovan supports USDT on TRON, so you can pay by card straight from that balance in your own wallet 👇
${U('/en/blog/usdt-tron-ethereum-polygon', 'news_tron_usdt')}

<i>Source: Crypto Briefing (Nov 9)</i>` },

  { date: '2026-11-25', id: 'news_bvnk_payouts', text: `<b>📰 Industry news</b>

BVNK launched bank payouts funded from stablecoin balances, delivered through Mastercard Move. It covers 11 currencies at launch, including KRW, PHP, BRL and MXN, with more than 40 planned for 2027.

The gap between stablecoins and everyday money keeps shrinking.

Xerovan closes it at the checkout: your card payment is funded from the USDT/USDC in your own wallet, the moment you pay 👇
${U('/en/blog/stablecoin-card-payment-flow', 'news_bvnk_payouts')}

<i>Sources: BVNK announcement (Nov 11), via The Paypers and UPay</i>` },

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
  news_supply: `Stablecoin supply: ~$284.9B (DeFiLlama, Nov 16).
USDT ~$175.3B + USDC ~$69.3B = about 86% of the market.

For most people, "stablecoin" means USDT or USDC. Xerovan cards pay with both, straight from your own wallet.

${XU('/en/facts', 'news_supply')}`,
  news_hk_bill: `Hong Kong will introduce a bill before end-2026 to license digital-asset dealing, advising, asset management and custody (Paul Chan, Nov 16).

Stablecoin issuers face a high bar: 2 of 36 applicants licensed in round one.

${XWL('news_hk_bill')}`,
  news_tron_usdt: `Stablecoins on TRON: ~$94.2B (Nov 9). USDT is ~$92.2B of it, nearly 98%.

Xerovan supports USDT on TRON, so you can pay by card straight from that balance in your own wallet.

${XU('/en/blog/usdt-tron-ethereum-polygon', 'news_tron_usdt')}`,
  news_bvnk_payouts: `BVNK launched stablecoin-funded bank payouts via Mastercard Move: 11 currencies at launch incl. KRW, PHP, BRL, MXN. 40+ planned for 2027.

Xerovan does it at checkout: your card pays from the USDT/USDC in your own wallet.

${XU('/en/blog/stablecoin-card-payment-flow', 'news_bvnk_payouts')}`,
  news_visa_programs: `Visa now has 225+ stablecoin-linked card programs live, and stablecoin settlement running above $25B a year.

Our take: a stablecoin card should pay from your own wallet, not from a balance you top up first.

${XU('/en/blog/crypto-card-without-top-up', 'news_visa_programs')}`,
  news_card_volume: `Stablecoin card volume tracked by Paymentscan hit ~$1.37B in October, across ~12.9M transactions (incl. some issuer-reported data).

People want to spend stablecoins like money. Xerovan pays straight from your own wallet.

${XU('/en/blog/stablecoin-card-payment-flow', 'news_card_volume')}`,
  news_usdpt: `Visa added Western Union's USDPT stablecoin as a settlement asset on VisaNet, with issuer Anchorage Digital.

Big payment brands keep moving to stablecoin rails. With Xerovan, your USDT/USDC pays by card straight from your own wallet.

${XWL('news_usdpt')}`,
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
// Instagram card copy (taken from the X text above; no new claims).
const IG = {
  news_supply: { news: true, tag: 'By the numbers', stat: '86%', statLabel: 'of all stablecoins are USDT or USDC', points: ['Total supply about $284.9B (Nov 16)', 'USDT ~$175.3B · USDC ~$69.3B'], source: 'DeFiLlama, Lookonchain, via TronWeekly · Nov 16, 2026' },
  news_hk_bill: { news: true, tag: 'Asia regulation', stat: '2 of 36', statLabel: 'applicants won a Hong Kong stablecoin issuer license in round one', points: ['New bill due before the end of 2026', 'Licensing for dealing, advising, asset management and custody'], source: 'crypto.news · Nov 16, 2026' },
  news_tron_usdt: { news: true, tag: 'By the numbers', stat: '$94.2B', statLabel: 'in stablecoins on TRON', points: ['USDT is about $92.2B of it, nearly 98%', 'Xerovan supports USDT on TRON'], source: 'Crypto Briefing · Nov 9, 2026' },
  news_bvnk_payouts: { news: true, tag: 'Industry news', stat: '11', statLabel: 'currencies for stablecoin-funded bank payouts via Mastercard Move', points: ['Includes KRW, PHP, BRL and MXN', 'More than 40 currencies planned for 2027'], source: 'BVNK, via The Paypers and UPay · Nov 2026' },
  news_visa_programs: { news: true, tag: 'Industry news', stat: '225+', statLabel: 'stablecoin-linked card programs are live on Visa worldwide', points: ['Stablecoin settlement running above $25B a year', 'About 10x the level of a year earlier'], source: 'Visa, via The Block and crypto.news · Nov 2026' },
  news_card_volume: { news: true, tag: 'By the numbers', stat: '$1.37B', statLabel: 'stablecoin card volume tracked in October 2026', points: ['About 12.9M card transactions', 'Includes some issuer-reported data'], source: 'Paymentscan, via crypto.news · Nov 3, 2026' },
  news_usdpt: { news: true, tag: 'Industry news', stat: 'USDPT', statLabel: 'Western Union’s stablecoin is now a settlement asset on VisaNet', points: ['Issued by Anchorage Digital', 'Eligible partners can settle VisaNet obligations with it'], source: 'crypto.news · Nov 12, 2026' },
  w1_how: { tag: 'How it works', title: 'No top-up. Pay straight from your wallet.', sub: 'Your assets stay in your own wallet. Each payment is funded at the moment you pay.' },
  w1_ads: { tag: 'For media buyers', title: 'One card per client, campaign or platform.', sub: 'Limits and receipt approvals on each card. No more one card mixing every budget.' },
  w2_compare: { tag: 'Explained', title: 'Custodial vs wallet-direct crypto cards', sub: 'Custodial: your crypto sits with the provider. Wallet-direct: only each payment leaves, at checkout.' },
  w2_chains: { tag: 'Supported networks', title: 'Ethereum, Base, Arbitrum, Polygon, BNB Chain, Solana, TRON, Bitcoin', sub: 'Including USDT on TRON. Connect an external wallet like MetaMask.' },
  w3_safety: { tag: 'Scam alert', title: 'Xerovan will never DM you first.', sub: 'We never ask for your seed phrase, private key or password.' },
  w3_subs: { tag: 'Subscriptions', title: 'A virtual card for every subscription.', sub: 'Set a limit. Freeze it when you cancel. No more surprise renewals.' },
  g_mediabuyer: { tag: 'Guide', title: 'Choosing a card for ad spend?', sub: '5 things to check, and how to test a card before you move budget.' },
  g_usdt_networks: { tag: 'Guide', title: 'Sending USDT? Check the network first.', sub: 'TRON, Ethereum and Polygon are different networks. The wrong one can make funds hard to recover.' },
  w5_safety: { tag: 'Reminder', title: 'If “Xerovan” messages you first, it isn’t us.', sub: 'Never share your seed phrase, private key or password with anyone.' },
  g_declined: { tag: 'Guide', title: 'Card payment declined?', sub: 'The 8 usual reasons, and the order to check them in.' },
  g_kyc: { tag: 'Guide', title: 'Applying for a crypto card?', sub: 'The documents to have ready, for individuals and for companies.' },
  g_flow: { tag: 'Explained', title: 'Does the shop receive your stablecoins?', sub: 'Usually not. What happens between your wallet and the merchant.' },
  w7_safety: { tag: 'Safety', title: 'Got a message from “Xerovan support”?', sub: 'We never DM first and never ask for a seed phrase, private key or password.' },
};
const igCaption = (x) => `${x.replace(/utm_source=x&utm_medium=social/g, 'utm_source=instagram&utm_medium=social')}\n\nLink in bio.`;
module.exports.forEach((p) => {
  p.x = X[p.id];
  if (IG[p.id]) p.ig = { card: IG[p.id], caption: igCaption(p.x), image: `https://www.xerovan.com/images/social/ig/${p.id}.jpg` };
  // News cards also go out as images on Telegram, Discord and Threads.
  if (IG[p.id] && IG[p.id].news) p.photo = p.ig.image;
});
