// Topic clusters: each solution page is a hub, and the blog posts below are its spokes.
// Solution pages list their spokes as "Related guides"; each post links back to its hub and to
// up to three sibling posts, so no post depends on deep list pagination to be found.
//
// Posts are matched by slug in the page's language: Korean, Japanese, Spanish, Arabic and
// Portuguese slugs are the base slug plus "-ko", "-ja", "-es", "-ar" or "-pt"; English posts use
// their own slugs, listed under EXTRA.en. A slug that has no post in a language is skipped.

const HUBS = {
  'crypto-card-for-ads': [
    'crypto-card-marketing-agencies', 'google-ads-crypto-card-guide', 'meta-ads-payment-declined',
    'media-buyer-card-checklist', 'marketing-team-virtual-card-expense-control',
    'business-card-spending-controls', 'crypto-card-receipt-expense-guide',
  ],
  'card-for-international-subscriptions': [
    'international-subscription-card', 'saas-virtual-card-subscription', 'card-payment-declined-solutions',
    '3d-secure-card-authentication', 'business-card-usd-local-currency',
  ],
  'crypto-travel-card': [
    'business-travel-crypto-card', 'virtual-vs-physical-card', 'crypto-card-foreign-fees',
  ],
  'spend-crypto-with-visa': [
    'crypto-card-without-top-up', 'stablecoin-card-payment-flow', 'usdt-vs-usdc-guide',
    'usdt-tron-ethereum-polygon', 'stablecoin-depegging-risks', 'crypto-card-cashback-net-benefit',
    'crypto-card-kyc-kyb-guide', 'crypto-card-refund-chargeback',
  ],
  'custodial-vs-wallet-direct-crypto-card': [
    'custodial-vs-non-custodial-crypto-card', 'crypto-wallet-custody-guide', 'mpc-wallet-security',
    'crypto-card-security-checklist',
  ],
  'crypto-payouts-for-freelancers': [
    'freelancer-instant-payout', 'freelancer-payout-checklist', 'freelancer-small-payment-batching',
    'freelancer-spend-earnings-card', 'freelancer-usd-payment-card',
  ],
  'spend-crypto-gateway-earnings': [
    'crypto-payment-gateway-card', 'gateway-card-benefits', 'gateway-user-account-onboarding',
    'merchant-crypto-settlement',
  ],
};

// Exact slugs that do not follow the "{base}-{lang}" pattern.
const EXTRA = {
  en: {
    'crypto-card-for-ads': ['virtual-cards-meta-ads-guide-en', 'virtual-cards-for-meta-ads', 'meta-ads-payment-declined', 'crypto-card-for-google-ads', 'crypto-cards-for-media-buyers'],
    'card-for-international-subscriptions': ['international-subscription-card', 'usd-cards-vs-local-currency-cards'],
    'spend-crypto-with-visa': ['crypto-card-without-top-up'],
    'custodial-vs-wallet-direct-crypto-card': ['custodial-vs-non-custodial-crypto-cards-whats-the-difference-and-why-does-it-matter', 'self-custodial-crypto-cards-guide', 'self-custody-vs-prepaid-crypto-business-en'],
    'crypto-payouts-for-freelancers': ['freelancer-instant-payouts-card', 'freelancer-payout-checklist', 'freelancer-small-payment-batching', 'freelancer-spend-earnings-card'],
    'spend-crypto-gateway-earnings': ['crypto-payment-gateway-earnings-card', 'gateway-card-benefits', 'gateway-user-account-onboarding', 'merchant-crypto-settlement'],
  },
  ja: {
    'crypto-card-for-ads': ['crypto-cards-ad-agencies-jp', 'usd-ad-payment-fees-japan'],
    'crypto-payouts-for-freelancers': ['freelancer-instant-payout-ja'],
  },
  es: {
    'crypto-card-for-ads': ['tarjetas-cripto-agencias-marketing-es'],
    'custodial-vs-wallet-direct-crypto-card': ['autocustodia-custodia-tarjeta-cripto-empresa-es'],
    'crypto-payouts-for-freelancers': ['freelancer-instant-payout-es'],
  },
  ar: {
    'crypto-card-for-ads': ['virtual-cards-marketing-agencies-ar'],
    'crypto-payouts-for-freelancers': ['freelancer-instant-payout-ar'],
  },
  pt: {
    'crypto-card-for-ads': ['cartoes-virtuais-midias-pagas-pt'],
    'crypto-payouts-for-freelancers': ['freelancer-instant-payout-pt'],
  },
  kr: {},
};

const SUFFIX = { kr: '-ko', ja: '-ja', es: '-es', ar: '-ar', pt: '-pt', en: null };

/** Candidate slugs for one hub in one language, in display order (duplicates removed). */
function hubSlugs(lang, hub) {
  const sfx = SUFFIX[lang];
  const base = sfx ? (HUBS[hub] || []).map((s) => s + sfx) : [];
  return [...new Set([...base, ...((EXTRA[lang] || {})[hub] || [])])];
}

/** The hub a post belongs to in this language, or null. */
function hubOf(lang, slug) {
  return Object.keys(HUBS).find((h) => hubSlugs(lang, h).includes(slug)) || null;
}

const LABELS = {
  en: { guides: 'Related guides', hub: 'Solution for this topic', more: 'Keep reading' },
  kr: { guides: '관련 가이드', hub: '이 주제의 솔루션', more: '함께 읽으면 좋은 글' },
  ja: { guides: '関連ガイド', hub: 'このテーマのソリューション', more: 'あわせて読みたい' },
  es: { guides: 'Guías relacionadas', hub: 'Solución para este tema', more: 'Sigue leyendo' },
  ar: { guides: 'أدلة ذات صلة', hub: 'الحل المناسب لهذا الموضوع', more: 'تابع القراءة' },
  pt: { guides: 'Guias relacionados', hub: 'Solução para este tema', more: 'Continue lendo' },
};

module.exports = { HUBS, hubSlugs, hubOf, LABELS };
