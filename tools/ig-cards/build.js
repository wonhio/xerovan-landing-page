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
fs.mkdirSync(out, { recursive: true });
for (const p of posts) {
  if (want.length && !want.includes(p.id)) continue;
  const c = p.ig.card;
  const html = `<!doctype html><meta charset="utf-8"><style>
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
