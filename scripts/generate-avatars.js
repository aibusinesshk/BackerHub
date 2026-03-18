/**
 * Generate SVG placeholder avatars for all players.
 * Each avatar has the player's initials on a dark background with gold accent.
 * Run: node scripts/generate-avatars.js
 *
 * Replace these SVGs with real player photos (JPG/PNG) at any time —
 * the app will use whatever file exists at the path.
 */
const fs = require('fs');
const path = require('path');

const players = [
  { slug: 'chiayun-wu', initials: 'CW', color: '#D4AF37' },
  { slug: 'chih-feng-li', initials: 'CL', color: '#C9A832' },
  { slug: 'nevan-chang', initials: 'NC', color: '#E6C755' },
  { slug: 'wayne-lam', initials: 'WL', color: '#D4AF37' },
  { slug: 'zong-chi-he', initials: 'ZH', color: '#BFA230' },
  { slug: 'hao-shan-huang', initials: 'HH', color: '#C9A832' },
  { slug: 'chi-jen-chu', initials: 'CJ', color: '#E6C755' },
  { slug: 'sparrow-cheung', initials: 'SC', color: '#D4AF37' },
  { slug: 'elton-tsang', initials: 'ET', color: '#BFA230' },
  { slug: 'chih-wei-chen', initials: 'CW', color: '#C9A832' },
  { slug: 'li-ta-hsu', initials: 'LH', color: '#E6C755' },
  { slug: 'fung-lin', initials: 'FL', color: '#D4AF37' },
  { slug: 'tony-lin', initials: 'TL', color: '#BFA230' },
  { slug: 'eric-tsai', initials: 'ES', color: '#C9A832' },
  { slug: 'charlie-chiu', initials: 'CC', color: '#E6C755' },
];

const outDir = path.join(__dirname, '..', 'public', 'images', 'players');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const p of players) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0D1117"/>
      <stop offset="100%" stop-color="#161B22"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.color}"/>
      <stop offset="100%" stop-color="${p.color}88"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="100" fill="url(#bg)"/>
  <circle cx="100" cy="100" r="94" fill="none" stroke="url(#ring)" stroke-width="3"/>
  <text x="100" y="108" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-weight="600" font-size="56" fill="${p.color}">${p.initials}</text>
</svg>`;
  fs.writeFileSync(path.join(outDir, `${p.slug}.svg`), svg);
  console.log(`✓ ${p.slug}.svg`);
}

console.log(`\nDone! Generated ${players.length} avatars in public/images/players/`);
console.log('Replace any .svg with a .jpg or .png of the real player photo.');
