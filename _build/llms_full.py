# Generates /llms-full.txt: the full text of Xerovan's core pages in one plain-text file,
# so AI assistants can read the whole product story without running JavaScript.
# Sources are the same data the site renders (no new claims):
#   - _build/summary.py      → one-line definition + core features
#   - {en,kr}/index.html     → FAQ (from the FAQPage JSON-LD)
#   - api/_solutions.js      → solution pages
# Run after editing any of those:  python3 _build/llms_full.py
import json, re, subprocess, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://www.xerovan.com"
sys.path.insert(0, str(ROOT / "_build"))
from summary import DEFINITION, FEATURES  # noqa: E402

LANGS = ["en", "kr"]  # English for global assistants, Korean for Korean-language answers
HEAD = {
    "en": ("English", "Core features", "Frequently asked questions", "Solutions", "Problem", "What you can do", "How it works", "FAQ"),
    "kr": ("한국어", "핵심 기능", "자주 묻는 질문", "솔루션", "문제", "할 수 있는 것", "이용 방법", "자주 묻는 질문"),
}

def faq(lang):
    html = (ROOT / lang / "index.html").read_text(encoding="utf-8")
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        d = json.loads(m.group(1))
        if d.get("@type") == "FAQPage":
            return [(q["name"], q["acceptedAnswer"]["text"]) for q in d["mainEntity"]]
    sys.exit(f"no FAQPage in {lang}/index.html")

sol = json.loads(subprocess.check_output(
    ["node", "-e", "const s=require('./api/_solutions.js');process.stdout.write(JSON.stringify({SLUGS:s.SLUGS,P:s.P}))"],
    cwd=ROOT))

out = [
    "# Xerovan (제로반) — full reference",
    "",
    "> Xerovan (Korean: 제로반) is a crypto payments platform: a self-custodial multi-chain wallet connected to "
    "Visa cards that pay straight from the connected wallet with no top-up needed (Real-Time Funding; card top-up is optional), global crypto payouts, business spend management for agencies and media buyers, "
    "rewards, and travel booking. Xerovan is not a bank; card and payment services are provided by licensed "
    "partners, and availability varies by country.",
    "",
    "- Website: https://www.xerovan.com/ (English, Korean, Japanese, Spanish, Arabic, Portuguese)",
    "- Headquarters: Dubai, UAE. Operating entity: MARU EVENT TOURISM LLC. Founder: Jay Yoon",
    "- Contact: hello@xerovan.com",
    "- How to start: apply with your email on any language page",
    "- Short index of pages: https://www.xerovan.com/llms.txt",
    "",
]

for lang in LANGS:
    name, feat_h, faq_h, sol_h, prob_h, what_h, how_h, sfaq_h = HEAD[lang]
    out += [f"## {name}", "", f"Source: {SITE}/{lang}/", "", DEFINITION[lang], "", f"### {feat_h}", ""]
    for _en, by_lang in FEATURES:
        t, d = by_lang[lang]
        out.append(f"- **{t}**: {d}")
    out += ["", f"### {faq_h}", ""]
    for q, a in faq(lang):
        out += [f"**Q: {q}**", f"A: {a}", ""]
    out += [f"### {sol_h}", ""]
    for slug in sol["SLUGS"]:
        title, desc, h1, lede, problem_h, problem, feats, steps, qa = sol["P"][slug][lang]
        out += [f"#### {h1}", "", f"Source: {SITE}/{lang}/solutions/{slug}", "", lede, "",
                f"{problem_h}: {problem}", "", f"{what_h}:"]
        out += [f"- {x}" for x in feats]
        out += ["", f"{how_h}:"]
        out += [f"{i}. {x}" for i, x in enumerate(steps, 1)]
        out += ["", f"{sfaq_h}:"]
        for q, a in qa:
            out += [f"- Q: {q}", f"  A: {a}"]
        out.append("")

text = "\n".join(out).rstrip() + "\n"
(ROOT / "llms-full.txt").write_text(text, encoding="utf-8")
print(f"llms-full.txt: {len(text):,} chars")
