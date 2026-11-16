// Builds 1080x1350 Instagram cards for scheduled posts.
// Usage: node tools/ig-cards/build.js [id ...]   (no ids = all)
// Logo: tools/ig-cards/logo.png (from Desktop/Xerovan/App Logo/Xerovan_Logo_DarkMode.png, trimmed).
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'images/social/ig');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const posts = require(path.join(root, 'api/_tg_schedule.js')).filter((p) => p.ig);
const want = process.argv.slice(2);
const logo = fs.readFileSync(path.join(__dirname, 'logo.png')).toString('base64');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
// News / stats card: large figure, two supporting points, source line.
function newsCard(c) {
  const big = c.stat.length > 5 ? 190 : 260;
  return `<!doctype html><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap');
*{margin:0;box-sizing:border-box}html,body{width:1080px;height:1350px}
body{font-family:Inter,Arial,sans-serif;color:#f5f5f7;padding:84px 88px 72px;display:flex;flex-direction:column;position:relative;overflow:hidden;
background:radial-gradient(1000px 760px at 100% 0%,#12403b 0%,transparent 62%),radial-gradient(800px 640px at 0% 100%,#1f2430 0%,transparent 60%),#090a0c}
body:before{content:'';position:absolute;inset:0;background-image:linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px);background-size:72px 72px;mask-image:linear-gradient(180deg,#000 0%,transparent 70%)}
.top{display:flex;justify-content:space-between;align-items:center;position:relative}
.top img{height:120px}
.pill{display:flex;align-items:center;gap:14px;font-size:26px;letter-spacing:.16em;text-transform:uppercase;font-weight:600;color:#7fe0d4;border:1px solid #2f5c57;background:#0f1f1d;padding:14px 26px;border-radius:999px}
.pill i{width:12px;height:12px;border-radius:50%;background:#7fe0d4;box-shadow:0 0 18px #7fe0d4}
.stat{display:inline-block;align-self:flex-start;margin-top:120px;font-size:${big}px;line-height:.95;font-weight:800;letter-spacing:-.045em;background:linear-gradient(100deg,#ffffff 0%,#bff3ec 45%,#58d1c2 100%);-webkit-background-clip:text;color:transparent;position:relative}
.label{margin-top:34px;font-size:54px;line-height:1.18;font-weight:600;letter-spacing:-.015em;max-width:880px;position:relative}
ul{list-style:none;margin-top:64px;padding-top:44px;border-top:1px solid #262a31;position:relative}
li{display:flex;gap:24px;align-items:flex-start;font-size:36px;line-height:1.35;color:#c3c6cd;margin-bottom:26px}
li:before{content:'';flex:none;width:28px;height:4px;margin-top:24px;background:#58d1c2;border-radius:2px}
.src{margin-top:auto;font-size:25px;color:#7c818b;position:relative}
.foot{margin-top:26px;display:flex;justify-content:space-between;align-items:center;font-size:28px;color:#8a8e97;border-top:1px solid #262a31;padding-top:30px;position:relative}
.foot b{color:#f5f5f7;font-weight:600}</style>
<div class="top"><img src="data:image/png;base64,${logo}"><div class="pill"><i></i>${esc(c.tag)}</div></div>
<div class="stat">${esc(c.stat)}</div>
<div class="label">${esc(c.statLabel)}</div>
<ul>${c.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
<div class="src">Source: ${esc(c.source)}</div>
<div class="foot"><b>xerovan.com</b><span>Link in bio</span></div>`;
}
fs.mkdirSync(out, { recursive: true });
for (const p of posts) {
  if (want.length && !want.includes(p.id)) continue;
  const c = p.ig.card;
  const html = c.news ? newsCard(c) : `<!doctype html><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
*{margin:0;box-sizing:border-box}html,body{width:1080px;height:1350px}
body{font-family:Inter,Arial,sans-serif;color:#f5f5f7;padding:96px 88px;display:flex;flex-direction:column;
background:radial-gradient(900px 700px at 85% 0%,#2a2d33 0%,transparent 60%),radial-gradient(700px 600px at 0% 100%,#1b2a2a 0%,transparent 60%),#0b0c0e}
.logo img{height:230px}
.tag{margin-top:90px;font-size:30px;letter-spacing:.18em;text-transform:uppercase;color:#7fe0d4;font-weight:600}
h1{margin-top:28px;font-size:84px;line-height:1.08;font-weight:800;letter-spacing:-.02em}
p{margin-top:40px;font-size:38px;line-height:1.4;color:#b9bcc4}
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:center;font-size:30px;color:#8a8e97;border-top:1px solid #2a2d33;padding-top:36px}
.foot b{color:#f5f5f7;font-weight:600}</style>
<div class="logo"><img src="data:image/png;base64,${logo}"></div>
<div class="tag">${esc(c.tag)}</div><h1>${esc(c.title)}</h1>${c.sub ? `<p>${esc(c.sub)}</p>` : ''}
<div class="foot"><b>xerovan.com</b><span>Link in bio</span></div>`;
  const tmp = path.join(require('os').tmpdir(), `ig_${p.id}.html`);
  fs.writeFileSync(tmp, html);
  const png = path.join(out, `${p.id}.png`);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1080,1350', '--virtual-time-budget=4000', `--screenshot=${png}`, `file://${tmp}`], { stdio: 'ignore' });
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '88', png, '--out', png.replace(/\.png$/, '.jpg')], { stdio: 'ignore' });
  fs.unlinkSync(png);
  console.log('built', p.id);
}
