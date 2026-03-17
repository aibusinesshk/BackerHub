const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaSearch, FaHandshake, FaTrophy, FaShieldAlt, FaUserCheck,
  FaStar, FaChartLine, FaGlobe, FaRocket, FaUsers, FaLock,
  FaClock, FaCheckCircle, FaExclamationTriangle, FaRegLightbulb,
  FaBullseye, FaMoneyBillWave, FaMapMarkerAlt, FaEnvelope
} = require("react-icons/fa");

function renderIconSvg(IconComponent, color, size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// ── Modern color palette ──
const C = {
  bg: "0B0D11",
  bgCard: "13161D",
  bgCard2: "191D26",
  gold: "F5B81C",
  goldDark: "C49516",
  goldLight: "FFD966",
  white: "FFFFFF",
  gray: "A0A8B4",
  grayLight: "D0D6DE",
  grayDim: "5A6270",
  green: "22C55E",
  red: "EF4444",
  blue: "3B82F6",
  teal: "14B8A6",
  line: "252830",
};

// ── Modern sans-serif fonts ──
const FONT_H = "Segoe UI Semibold";
const FONT_B = "Segoe UI";
const FONT_L = "Segoe UI Light";

// ── Shared helpers ──
function addFooter(slide, pres, isGold) {
  if (isGold) {
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.405, w: 10, h: 0.22, fill: { color: C.gold } });
    slide.addText("CONFIDENTIAL", { x: 0, y: 5.405, w: 10, h: 0.22, fontSize: 8, fontFace: FONT_B, color: C.bg, align: "center", valign: "middle", bold: true, charSpacing: 5, margin: 0 });
  } else {
    slide.addShape(pres.shapes.LINE, { x: 0.6, y: 5.32, w: 8.8, h: 0, line: { color: C.line, width: 0.5 } });
    slide.addText("BackHub  |  Investor Presentation 2026", { x: 0.6, y: 5.35, w: 8.8, h: 0.25, fontSize: 8, fontFace: FONT_L, color: C.grayDim, margin: 0 });
  }
}

function addHeader(slide, label) {
  slide.addText(label, { x: 0.7, y: 0.45, w: 9, h: 0.3, fontSize: 10, fontFace: FONT_B, color: C.gold, bold: true, charSpacing: 5, margin: 0 });
}

function card(slide, pres, x, y, w, h) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: C.bgCard } });
}

async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "BackHub";
  pres.title = "BackHub - Investor Presentation 2026";

  // Pre-render icons
  const icons = {};
  const iconMap = {
    search: FaSearch, handshake: FaHandshake, trophy: FaTrophy,
    shield: FaShieldAlt, userCheck: FaUserCheck, star: FaStar,
    chart: FaChartLine, globe: FaGlobe, rocket: FaRocket,
    users: FaUsers, lock: FaLock, clock: FaClock,
    check: FaCheckCircle, warn: FaExclamationTriangle,
    bulb: FaRegLightbulb, target: FaBullseye, money: FaMoneyBillWave,
    map: FaMapMarkerAlt, email: FaEnvelope
  };
  for (const [k, v] of Object.entries(iconMap)) {
    icons[k] = await iconToBase64Png(v, "#F5B81C", 256);
    icons[k + "W"] = await iconToBase64Png(v, "#FFFFFF", 256);
    icons[k + "D"] = await iconToBase64Png(v, "#0B0D11", 256);
  }

  // ════════════ SLIDE 1: COVER ════════════
  let s1 = pres.addSlide();
  s1.background = { color: C.bg };
  // Logo
  s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.25, y: 1.4, w: 0.6, h: 0.6, fill: { color: C.gold }, rectRadius: 0.1 });
  s1.addText("\u2660", { x: 4.25, y: 1.4, w: 0.6, h: 0.6, fontSize: 24, color: C.bg, align: "center", valign: "middle", fontFace: FONT_B, margin: 0 });
  s1.addText([
    { text: "Back", options: { color: C.white, bold: true, fontSize: 34, fontFace: FONT_H } },
    { text: "Hub", options: { color: C.gold, bold: true, fontSize: 34, fontFace: FONT_H } }
  ], { x: 4.95, y: 1.4, w: 2.5, h: 0.6, valign: "middle", margin: 0 });
  // Tagline
  s1.addText("Back Players. Share Victories.", { x: 1, y: 2.5, w: 8, h: 0.65, fontSize: 32, fontFace: FONT_L, color: C.gold, align: "center" });
  // Subtitle
  s1.addText("Asia's #1 Player Backing Platform", { x: 1, y: 3.25, w: 8, h: 0.45, fontSize: 16, fontFace: FONT_L, color: C.gray, align: "center" });
  // Date
  s1.addText("Investor Presentation  \u00b7  March 2026", { x: 1, y: 4.15, w: 8, h: 0.4, fontSize: 13, fontFace: FONT_L, color: C.grayDim, align: "center" });
  addFooter(s1, pres, true);

  // ════════════ SLIDE 2: PROBLEM ════════════
  let s2 = pres.addSlide();
  s2.background = { color: C.bg };
  addHeader(s2, "THE PROBLEM");
  s2.addText("Poker Staking is Broken", { x: 0.7, y: 0.75, w: 9, h: 0.6, fontSize: 30, fontFace: FONT_H, color: C.white, margin: 0 });

  const problems = [
    { icon: "warn", title: "Fragmented & Informal", desc: "Most staking deals happen on forums, WhatsApp groups, and handshake agreements. No escrow, no verification, no recourse." },
    { icon: "globe", title: "Western-Centric Platforms", desc: "StakeKings, PokerStake, and YouStake serve US/EU markets. No local Asian payments, no Chinese language, no regional focus." },
    { icon: "lock", title: "Zero Trust Infrastructure", desc: "No identity verification, no result validation, no reliability scoring. Players can disappear with backers' money." },
    { icon: "money", title: "Opaque Fee Structures", desc: "Hidden commissions ranging 1-10%. No transparent cost breakdowns. Backers don't know what they're really paying." },
  ];

  for (let i = 0; i < problems.length; i++) {
    const py = 1.55 + i * 0.88;
    card(s2, pres, 0.7, py, 8.6, 0.78);
    // Icon circle
    s2.addShape(pres.shapes.OVAL, { x: 0.9, y: py + 0.12, w: 0.5, h: 0.5, fill: { color: C.bgCard2 } });
    s2.addImage({ data: icons[problems[i].icon], x: 0.99, y: py + 0.2, w: 0.32, h: 0.32 });
    s2.addText(problems[i].title, { x: 1.6, y: py + 0.05, w: 7.4, h: 0.3, fontSize: 14, fontFace: FONT_H, color: C.white, margin: 0 });
    s2.addText(problems[i].desc, { x: 1.6, y: py + 0.37, w: 7.4, h: 0.35, fontSize: 10.5, fontFace: FONT_L, color: C.gray, margin: 0 });
  }
  addFooter(s2, pres, false);

  // ════════════ SLIDE 3: SOLUTION ════════════
  let s3 = pres.addSlide();
  s3.background = { color: C.bg };
  addHeader(s3, "THE SOLUTION");
  s3.addText("BackHub: Trust-First Player Backing", { x: 0.7, y: 0.75, w: 9, h: 0.6, fontSize: 28, fontFace: FONT_H, color: C.white, margin: 0 });
  s3.addText("The first poker player sponsorship marketplace built for Asia \u2014 with escrow protection, admin verification, and local payment methods.", {
    x: 0.7, y: 1.35, w: 8.6, h: 0.4, fontSize: 12, fontFace: FONT_L, color: C.gray, margin: 0
  });

  const solutions = [
    { icon: "shield", title: "Escrow-Protected Funds", desc: "Backer money is never sent directly to players. Held in escrow until admin-verified milestones." },
    { icon: "userCheck", title: "Identity Verified Players", desc: "All players pass KYC. Performance tracked with reliability scores and settlement history." },
    { icon: "check", title: "Multi-Step Verification", desc: "Registration proof, result validation, and prize deposit confirmation \u2014 all admin-verified." },
    { icon: "map", title: "Built for Asia", desc: "ECPay, LINE Pay, JKoPay, AlipayHK, FPS. English + Traditional Chinese. Local tournaments." },
  ];

  for (let i = 0; i < solutions.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = 0.7 + col * 4.5;
    const cy = 2.05 + row * 1.55;
    card(s3, pres, cx, cy, 4.1, 1.35);
    s3.addShape(pres.shapes.OVAL, { x: cx + 0.2, y: cy + 0.2, w: 0.55, h: 0.55, fill: { color: C.bgCard2 } });
    s3.addImage({ data: icons[solutions[i].icon], x: cx + 0.3, y: cy + 0.3, w: 0.35, h: 0.35 });
    s3.addText(solutions[i].title, { x: cx + 0.95, y: cy + 0.15, w: 2.95, h: 0.3, fontSize: 13, fontFace: FONT_H, color: C.white, margin: 0 });
    s3.addText(solutions[i].desc, { x: cx + 0.95, y: cy + 0.5, w: 2.95, h: 0.7, fontSize: 10.5, fontFace: FONT_L, color: C.gray, margin: 0 });
  }
  addFooter(s3, pres, false);

  // ════════════ SLIDE 4: MARKET OPPORTUNITY ════════════
  let s4 = pres.addSlide();
  s4.background = { color: C.bg };
  addHeader(s4, "MARKET OPPORTUNITY");
  s4.addText("A $11.4B Market with No Asia Leader", { x: 0.7, y: 0.75, w: 9, h: 0.6, fontSize: 28, fontFace: FONT_H, color: C.white, margin: 0 });

  const markets = [
    { label: "TAM", value: "$11.4B", desc: "Global Online Poker\nMarket by 2030", color: C.gold },
    { label: "SAM", value: "$2.3B", desc: "Asia-Pacific Poker\nTournament Economy", color: C.goldDark },
    { label: "SOM", value: "$115M", desc: "Addressable Staking\nMarket (Asia, Year 5)", color: C.goldLight },
  ];

  for (let i = 0; i < markets.length; i++) {
    const cx = 0.7 + i * 3.05;
    card(s4, pres, cx, 1.5, 2.75, 1.8);
    s4.addText(markets[i].label, { x: cx, y: 1.58, w: 2.75, h: 0.25, fontSize: 10, fontFace: FONT_B, color: markets[i].color, align: "center", bold: true, charSpacing: 4, margin: 0 });
    s4.addText(markets[i].value, { x: cx, y: 1.82, w: 2.75, h: 0.55, fontSize: 38, fontFace: FONT_H, color: C.white, align: "center", margin: 0 });
    s4.addText(markets[i].desc, { x: cx, y: 2.4, w: 2.75, h: 0.65, fontSize: 10.5, fontFace: FONT_L, color: C.gray, align: "center", margin: 0 });
  }

  s4.addText("Key Market Indicators", { x: 0.7, y: 3.55, w: 9, h: 0.3, fontSize: 13, fontFace: FONT_H, color: C.white, margin: 0 });
  const indicators = [
    { stat: "13.7%", label: "Online Poker\nCAGR to 2030" },
    { stat: "$481M", label: "WSOP 2025\nPrize Money" },
    { stat: "$34M+", label: "APT Taipei\nNov 2025 Prizes" },
    { stat: "28,000+", label: "APT Championship\n2025 Entries" },
  ];
  for (let i = 0; i < indicators.length; i++) {
    const ix = 0.7 + i * 2.25;
    card(s4, pres, ix, 3.95, 2.0, 0.85);
    s4.addText(indicators[i].stat, { x: ix, y: 3.98, w: 2.0, h: 0.38, fontSize: 18, fontFace: FONT_H, color: C.gold, align: "center", margin: 0 });
    s4.addText(indicators[i].label, { x: ix, y: 4.37, w: 2.0, h: 0.38, fontSize: 9, fontFace: FONT_L, color: C.gray, align: "center", margin: 0 });
  }
  addFooter(s4, pres, false);

  // ════════════ SLIDE 5: WHY NOW ════════════
  let s5 = pres.addSlide();
  s5.background = { color: C.bg };
  addHeader(s5, "WHY NOW");
  s5.addText("Three Tailwinds Converge", { x: 0.7, y: 0.75, w: 9, h: 0.6, fontSize: 28, fontFace: FONT_H, color: C.white, margin: 0 });

  const tailwinds = [
    { icon: "shield", title: "Legal Clarity", stats: "Supreme Court (Feb 2025)", desc: "Taiwan confirmed poker tournaments as \"mind sport\" \u2014 not gambling. CTP Club is #1 venue globally with 302,505 registered players." },
    { icon: "trophy", title: "Tournament Boom", stats: "$54M+ prizes in Taipei (2025)", desc: "APT Taipei: 22,909 entries, $20M prizes. APT Championship: 28,000+ entries, $34M+ prizes. 40%+ YoY growth." },
    { icon: "money", title: "Payment Explosion", stats: "$112.5B fintech market (2025)", desc: "LINE Pay: 13.1M users, $25B volume. Government targeting 8B non-cash transactions by 2026. 80%+ mobile adoption." },
  ];

  for (let i = 0; i < tailwinds.length; i++) {
    const cx = 0.7 + i * 3.05;
    card(s5, pres, cx, 1.5, 2.75, 3.15);
    s5.addShape(pres.shapes.OVAL, { x: cx + 0.95, y: 1.65, w: 0.65, h: 0.65, fill: { color: C.bgCard2 } });
    s5.addImage({ data: icons[tailwinds[i].icon], x: cx + 1.07, y: 1.77, w: 0.42, h: 0.42 });
    s5.addText(tailwinds[i].title, { x: cx + 0.15, y: 2.42, w: 2.45, h: 0.3, fontSize: 15, fontFace: FONT_H, color: C.white, align: "center", margin: 0 });
    s5.addText(tailwinds[i].stats, { x: cx + 0.15, y: 2.72, w: 2.45, h: 0.25, fontSize: 10, fontFace: FONT_B, color: C.gold, align: "center", bold: true, margin: 0 });
    s5.addText(tailwinds[i].desc, { x: cx + 0.2, y: 3.05, w: 2.35, h: 1.4, fontSize: 10.5, fontFace: FONT_L, color: C.gray, margin: 0 });
  }
  addFooter(s5, pres, false);

  // ════════════ SLIDE 6: HOW IT WORKS ════════════
  let s6 = pres.addSlide();
  s6.background = { color: C.bg };
  addHeader(s6, "HOW IT WORKS");
  s6.addText("Three Steps to Start Backing", { x: 0.7, y: 0.75, w: 9, h: 0.6, fontSize: 28, fontFace: FONT_H, color: C.white, margin: 0 });

  const steps = [
    { num: "01", icon: "search", title: "Browse Players", desc: "Explore verified poker players with detailed performance stats, ROI history, and reliability scores. Filter by tournament, buy-in, and region." },
    { num: "02", icon: "handshake", title: "Back a Player", desc: "Purchase a percentage of a player's tournament action. Transparent cost breakdowns: base cost + markup + platform fee. Funds held in escrow." },
    { num: "03", icon: "trophy", title: "Win Together", desc: "When the player cashes, winnings are verified against official records and distributed proportionally to all backers automatically." },
  ];

  for (let i = 0; i < steps.length; i++) {
    const cx = 0.7 + i * 3.05;
    card(s6, pres, cx, 1.5, 2.75, 3.5);
    s6.addText(steps[i].num, { x: cx, y: 1.65, w: 2.75, h: 0.5, fontSize: 32, fontFace: FONT_L, color: C.gold, align: "center", margin: 0 });
    s6.addShape(pres.shapes.OVAL, { x: cx + 0.95, y: 2.3, w: 0.7, h: 0.7, fill: { color: C.bgCard2 } });
    s6.addImage({ data: icons[steps[i].icon], x: cx + 1.08, y: 2.43, w: 0.44, h: 0.44 });
    s6.addText(steps[i].title, { x: cx + 0.15, y: 3.1, w: 2.45, h: 0.35, fontSize: 15, fontFace: FONT_H, color: C.white, align: "center", margin: 0 });
    s6.addText(steps[i].desc, { x: cx + 0.2, y: 3.5, w: 2.35, h: 1.3, fontSize: 10.5, fontFace: FONT_L, color: C.gray, margin: 0 });
  }

  // Arrows between cards
  s6.addText("\u2192", { x: 3.5, y: 2.45, w: 0.4, h: 0.4, fontSize: 22, fontFace: FONT_B, color: C.gold, align: "center", margin: 0 });
  s6.addText("\u2192", { x: 6.55, y: 2.45, w: 0.4, h: 0.4, fontSize: 22, fontFace: FONT_B, color: C.gold, align: "center", margin: 0 });
  addFooter(s6, pres, false);

  // ════════════ SLIDE 7: PRODUCT FEATURES ════════════
  let s7 = pres.addSlide();
  s7.background = { color: C.bg };
  addHeader(s7, "PRODUCT");
  s7.addText("Institutional-Grade Risk Management", { x: 0.7, y: 0.75, w: 9, h: 0.6, fontSize: 26, fontFace: FONT_H, color: C.white, margin: 0 });

  const features = [
    { icon: "lock", title: "Escrow Protection", desc: "Funds never go directly to players. All money held in escrow until milestones verified." },
    { icon: "userCheck", title: "KYC Verified Players", desc: "Identity verified with tracked stats, ROI history, and cash rates." },
    { icon: "check", title: "Admin Verification", desc: "Registration, results, and deposits all verified against official records." },
    { icon: "clock", title: "Enforced Deadlines", desc: "48h registration, 3-day results, 14-day deposit. Missed = admin review." },
    { icon: "star", title: "Reliability Scoring", desc: "Player scores based on on-time settlements vs defaults. Public and transparent." },
    { icon: "shield", title: "Withdrawal Lock", desc: "Players can't withdraw during pending prize deposits. Prevents post-win escape." },
  ];

  for (let i = 0; i < features.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const fx = 0.7 + col * 3.05;
    const fy = 1.55 + row * 1.75;
    card(s7, pres, fx, fy, 2.75, 1.55);
    s7.addShape(pres.shapes.OVAL, { x: fx + 0.2, y: fy + 0.2, w: 0.45, h: 0.45, fill: { color: C.bgCard2 } });
    s7.addImage({ data: icons[features[i].icon], x: fx + 0.28, y: fy + 0.28, w: 0.29, h: 0.29 });
    s7.addText(features[i].title, { x: fx + 0.8, y: fy + 0.2, w: 1.75, h: 0.3, fontSize: 12, fontFace: FONT_H, color: C.white, margin: 0 });
    s7.addText(features[i].desc, { x: fx + 0.2, y: fy + 0.75, w: 2.35, h: 0.65, fontSize: 10.5, fontFace: FONT_L, color: C.gray, margin: 0 });
  }
  addFooter(s7, pres, false);

  // ════════════ SLIDE 8: BUSINESS MODEL ════════════
  let s8 = pres.addSlide();
  s8.background = { color: C.bg };
  addHeader(s8, "BUSINESS MODEL");
  s8.addText("Simple, Scalable Revenue", { x: 0.7, y: 0.75, w: 9, h: 0.6, fontSize: 28, fontFace: FONT_H, color: C.white, margin: 0 });

  // Revenue streams
  card(s8, pres, 0.7, 1.55, 4.1, 3.5);
  s8.addText("Revenue Streams", { x: 0.7, y: 1.65, w: 4.1, h: 0.35, fontSize: 15, fontFace: FONT_H, color: C.gold, align: "center", margin: 0 });
  const streams = [
    { pct: "2%", name: "Platform Fee", desc: "On every backer transaction (0% pre-launch)" },
    { pct: "1-3%", name: "Payment Processing", desc: "Pass-through from ECPay, LINE Pay, etc." },
    { pct: "TBD", name: "Premium Listings", desc: "Featured placement, priority in marketplace" },
    { pct: "TBD", name: "Data & Analytics", desc: "Advanced player insights for backers (Pro tier)" },
  ];
  for (let i = 0; i < streams.length; i++) {
    const sy = 2.15 + i * 0.68;
    s8.addText(streams[i].pct, { x: 0.9, y: sy, w: 0.7, h: 0.55, fontSize: 14, fontFace: FONT_H, color: C.gold, margin: 0, valign: "top" });
    s8.addText(streams[i].name, { x: 1.7, y: sy, w: 2.8, h: 0.26, fontSize: 12, fontFace: FONT_H, color: C.white, margin: 0 });
    s8.addText(streams[i].desc, { x: 1.7, y: sy + 0.27, w: 2.8, h: 0.26, fontSize: 10, fontFace: FONT_L, color: C.gray, margin: 0 });
  }

  // Unit economics
  card(s8, pres, 5.2, 1.55, 4.1, 3.5);
  s8.addText("Unit Economics Example", { x: 5.2, y: 1.65, w: 4.1, h: 0.35, fontSize: 15, fontFace: FONT_H, color: C.gold, align: "center", margin: 0 });
  s8.addText("Listing: $10,000 Buy-in Tournament", { x: 5.4, y: 2.15, w: 3.7, h: 0.25, fontSize: 11, fontFace: FONT_L, color: C.grayLight, margin: 0 });

  const econ = [
    { label: "Action Sold", value: "50% = $5,000" },
    { label: "Markup (1.15x)", value: "$750" },
    { label: "Platform Fee (2%)", value: "$115" },
    { label: "Backer Total Cost", value: "$5,865" },
    { label: "BackHub Revenue", value: "$115 per listing" },
  ];
  for (let i = 0; i < econ.length; i++) {
    const ey = 2.55 + i * 0.43;
    const isLast = i === econ.length - 1;
    if (isLast) {
      s8.addShape(pres.shapes.LINE, { x: 5.6, y: ey - 0.04, w: 3.4, h: 0, line: { color: C.gold, width: 0.8 } });
    }
    s8.addText(econ[i].label, { x: 5.6, y: ey, w: 1.9, h: 0.32, fontSize: 11, fontFace: isLast ? FONT_H : FONT_L, color: isLast ? C.gold : C.grayLight, margin: 0 });
    s8.addText(econ[i].value, { x: 7.5, y: ey, w: 1.5, h: 0.32, fontSize: 11, fontFace: isLast ? FONT_H : FONT_B, color: isLast ? C.gold : C.white, align: "right", margin: 0 });
  }
  addFooter(s8, pres, false);

  // ════════════ SLIDE 9: COMPETITIVE LANDSCAPE ════════════
  let s9 = pres.addSlide();
  s9.background = { color: C.bg };
  addHeader(s9, "COMPETITIVE LANDSCAPE");
  s9.addText("No Asia-Focused Competitor Exists", { x: 0.7, y: 0.75, w: 9, h: 0.5, fontSize: 26, fontFace: FONT_H, color: C.white, margin: 0 });

  const tFont = FONT_B;
  const headers = [
    { text: "Feature", options: { fill: { color: C.gold }, color: C.bg, bold: true, fontSize: 10, fontFace: tFont, align: "left" } },
    { text: "BackHub", options: { fill: { color: C.gold }, color: C.bg, bold: true, fontSize: 10, fontFace: tFont, align: "center" } },
    { text: "StakeKings", options: { fill: { color: C.bgCard2 }, color: C.grayLight, bold: true, fontSize: 10, fontFace: tFont, align: "center" } },
    { text: "PokerStake", options: { fill: { color: C.bgCard2 }, color: C.grayLight, bold: true, fontSize: 10, fontFace: tFont, align: "center" } },
    { text: "GGPoker", options: { fill: { color: C.bgCard2 }, color: C.grayLight, bold: true, fontSize: 10, fontFace: tFont, align: "center" } },
  ];

  const rowStyle = (val, isGold) => ({ text: val, options: { fill: { color: C.bgCard }, color: isGold ? C.gold : C.grayLight, fontSize: 10, fontFace: tFont, align: "center" } });
  const rowStyleL = (val) => ({ text: val, options: { fill: { color: C.bgCard }, color: C.grayLight, fontSize: 10, fontFace: FONT_L, align: "left" } });

  const tableData = [
    headers,
    [rowStyleL("Asia Focus"), rowStyle("\u2713", true), rowStyle("\u2717", false), rowStyle("\u2717", false), rowStyle("Partial", false)],
    [rowStyleL("Local Payments (TW/HK)"), rowStyle("\u2713", true), rowStyle("\u2717", false), rowStyle("\u2717", false), rowStyle("\u2717", false)],
    [rowStyleL("Chinese Language"), rowStyle("\u2713", true), rowStyle("\u2717", false), rowStyle("\u2717", false), rowStyle("\u2713", false)],
    [rowStyleL("Escrow Protection"), rowStyle("\u2713", true), rowStyle("\u2713", false), rowStyle("\u2713", false), rowStyle("N/A", false)],
    [rowStyleL("Live Tournament Support"), rowStyle("\u2713", true), rowStyle("\u2713", false), rowStyle("\u2713", false), rowStyle("\u2717", false)],
    [rowStyleL("Identity Verification"), rowStyle("\u2713", true), rowStyle("Limited", false), rowStyle("Limited", false), rowStyle("\u2713", false)],
    [rowStyleL("Reliability Scoring"), rowStyle("\u2713", true), rowStyle("\u2717", false), rowStyle("\u2717", false), rowStyle("\u2717", false)],
    [rowStyleL("Admin Verification"), rowStyle("\u2713", true), rowStyle("\u2717", false), rowStyle("\u2717", false), rowStyle("Auto", false)],
    [rowStyleL("Platform Fee"), rowStyle("2%", true), rowStyle("1-10%", false), rowStyle("Undisclosed", false), rowStyle("0%", false)],
    [rowStyleL("Crypto Support"), rowStyle("\u2713", true), rowStyle("\u2713", false), rowStyle("\u2713", false), rowStyle("\u2717", false)],
  ];

  s9.addTable(tableData, {
    x: 0.5, y: 1.35, w: 9.0, colW: [2.1, 1.7, 1.7, 1.7, 1.8],
    border: { pt: 0.5, color: C.line },
    rowH: [0.32, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
  });
  addFooter(s9, pres, false);

  // ════════════ SLIDE 10: TRACTION ════════════
  let s10 = pres.addSlide();
  s10.background = { color: C.bg };
  addHeader(s10, "TRACTION & MILESTONES");
  s10.addText("Building Momentum", { x: 0.7, y: 0.75, w: 9, h: 0.5, fontSize: 28, fontFace: FONT_H, color: C.white, margin: 0 });

  card(s10, pres, 0.7, 1.4, 4.1, 2.25);
  s10.addText("Pre-Launch Status", { x: 0.7, y: 1.48, w: 4.1, h: 0.3, fontSize: 14, fontFace: FONT_H, color: C.gold, align: "center", margin: 0 });
  const status = [
    "\u2713  Full platform built (Next.js + Supabase)",
    "\u2713  Complete staking lifecycle implemented",
    "\u2713  Bilingual (EN + zh-TW) with i18n",
    "\u2713  7 payment integrations configured",
    "\u2713  Player directory with 13+ verified players",
    "\u2713  0% fee pre-launch campaign live",
  ];
  for (let i = 0; i < status.length; i++) {
    s10.addText(status[i], { x: 0.9, y: 1.86 + i * 0.27, w: 3.7, h: 0.24, fontSize: 10.5, fontFace: FONT_L, color: C.grayLight, margin: 0 });
  }

  card(s10, pres, 5.2, 1.4, 4.1, 2.25);
  s10.addText("2026 Roadmap", { x: 5.2, y: 1.48, w: 4.1, h: 0.3, fontSize: 14, fontFace: FONT_H, color: C.gold, align: "center", margin: 0 });
  const roadmap = [
    { q: "Q1", items: "Platform launch, CTP partnership, seed users" },
    { q: "Q2", items: "First APT event coverage, 500 users" },
    { q: "Q3", items: "Hong Kong expansion, crypto payments live" },
    { q: "Q4", items: "2,000+ users, premium features, Series A prep" },
  ];
  for (let i = 0; i < roadmap.length; i++) {
    const ry = 1.9 + i * 0.43;
    s10.addText(roadmap[i].q, { x: 5.45, y: ry, w: 0.45, h: 0.3, fontSize: 11, fontFace: FONT_H, color: C.gold, margin: 0 });
    s10.addText(roadmap[i].items, { x: 6.0, y: ry, w: 3.1, h: 0.35, fontSize: 10.5, fontFace: FONT_L, color: C.grayLight, margin: 0 });
  }

  s10.addText("Key Targets (Year 1)", { x: 0.7, y: 3.9, w: 9, h: 0.28, fontSize: 13, fontFace: FONT_H, color: C.white, margin: 0 });
  const targets = [
    { val: "2,000+", label: "Registered Users" },
    { val: "$2M+", label: "GTV (Gross Transaction)" },
    { val: "200+", label: "Listings Created" },
    { val: "85%+", label: "Settlement Rate" },
  ];
  for (let i = 0; i < targets.length; i++) {
    const tx = 0.7 + i * 2.3;
    card(s10, pres, tx, 4.25, 2.05, 0.65);
    s10.addText(targets[i].val, { x: tx, y: 4.27, w: 2.05, h: 0.35, fontSize: 17, fontFace: FONT_H, color: C.gold, align: "center", margin: 0 });
    s10.addText(targets[i].label, { x: tx, y: 4.6, w: 2.05, h: 0.25, fontSize: 9, fontFace: FONT_L, color: C.gray, align: "center", margin: 0 });
  }
  addFooter(s10, pres, false);

  // ════════════ SLIDE 11: GO-TO-MARKET ════════════
  let s11 = pres.addSlide();
  s11.background = { color: C.bg };
  addHeader(s11, "GO-TO-MARKET STRATEGY");
  s11.addText("Land, Expand, Dominate", { x: 0.7, y: 0.75, w: 9, h: 0.5, fontSize: 28, fontFace: FONT_H, color: C.white, margin: 0 });

  const phases = [
    { phase: "PHASE 1", timeline: "Q1\u2013Q2 2026", title: "Taiwan Launch", items: ["CTP Club partnership (302K players)", "APT Taipei event sponsorship", "0% fee pre-launch acquisition", "ECPay + LINE Pay + JKoPay", "Target: 500 users, $500K GTV"] },
    { phase: "PHASE 2", timeline: "Q3\u2013Q4 2026", title: "Hong Kong Expansion", items: ["AlipayHK, PayMe, FPS, Octopus", "Macau tournament coverage", "Cross-border staking support", "Crypto payments (BTC/ETH/USDT)", "Target: 2,000 users, $2M GTV"] },
    { phase: "PHASE 3", timeline: "2027+", title: "Asia-Pacific Scale", items: ["Japan, South Korea, Philippines", "WPT & WSOP Asia events", "API for tournament organizers", "Mobile app (iOS + Android)", "Target: 10,000 users, $20M GTV"] },
  ];

  for (let i = 0; i < phases.length; i++) {
    const cx = 0.7 + i * 3.05;
    card(s11, pres, cx, 1.4, 2.75, 3.35);
    s11.addText(phases[i].phase, { x: cx, y: 1.5, w: 2.75, h: 0.25, fontSize: 9, fontFace: FONT_B, color: C.gold, align: "center", bold: true, charSpacing: 4, margin: 0 });
    s11.addText(phases[i].timeline, { x: cx, y: 1.75, w: 2.75, h: 0.2, fontSize: 9, fontFace: FONT_L, color: C.gray, align: "center", margin: 0 });
    s11.addText(phases[i].title, { x: cx, y: 1.98, w: 2.75, h: 0.35, fontSize: 15, fontFace: FONT_H, color: C.white, align: "center", margin: 0 });
    s11.addShape(pres.shapes.LINE, { x: cx + 0.6, y: 2.38, w: 1.55, h: 0, line: { color: C.line, width: 0.5 } });

    const bulletText = phases[i].items.map((item, idx) => ({
      text: item,
      options: { bullet: true, breakLine: idx < phases[i].items.length - 1, fontSize: 10.5, fontFace: FONT_L, color: C.grayLight }
    }));
    s11.addText(bulletText, { x: cx + 0.2, y: 2.48, w: 2.35, h: 2.1, margin: 0, paraSpaceAfter: 4 });
  }
  addFooter(s11, pres, false);

  // ════════════ SLIDE 12: TEAM ════════════
  let s12 = pres.addSlide();
  s12.background = { color: C.bg };
  addHeader(s12, "THE TEAM");
  s12.addText("Finance Meets Technology", { x: 0.7, y: 0.75, w: 9, h: 0.5, fontSize: 28, fontFace: FONT_H, color: C.white, margin: 0 });

  // Co-founder 1
  card(s12, pres, 0.7, 1.5, 4.1, 3.55);
  s12.addShape(pres.shapes.OVAL, { x: 2.25, y: 1.7, w: 0.85, h: 0.85, fill: { color: C.bgCard2 } });
  s12.addText("\u2660", { x: 2.25, y: 1.7, w: 0.85, h: 0.85, fontSize: 30, color: C.gold, align: "center", valign: "middle", margin: 0 });
  s12.addText("Co-Founder", { x: 0.9, y: 2.7, w: 3.7, h: 0.3, fontSize: 17, fontFace: FONT_H, color: C.white, align: "center", margin: 0 });
  s12.addText("Investment Banking & Audit", { x: 0.9, y: 3.0, w: 3.7, h: 0.25, fontSize: 12, fontFace: FONT_B, color: C.gold, align: "center", margin: 0 });
  s12.addText([
    { text: "Former Big Four auditor with deep expertise in:", options: { breakLine: true, fontSize: 10.5, fontFace: FONT_L, color: C.grayLight } },
    { text: "", options: { breakLine: true, fontSize: 5 } },
    { text: "Financial Audit & Compliance", options: { bullet: true, breakLine: true, fontSize: 10.5, fontFace: FONT_L, color: C.grayLight } },
    { text: "Risk Management & Controls", options: { bullet: true, breakLine: true, fontSize: 10.5, fontFace: FONT_L, color: C.grayLight } },
    { text: "Escrow Fund Design", options: { bullet: true, breakLine: true, fontSize: 10.5, fontFace: FONT_L, color: C.grayLight } },
    { text: "Regulatory Compliance", options: { bullet: true, fontSize: 10.5, fontFace: FONT_L, color: C.grayLight } },
  ], { x: 1.0, y: 3.35, w: 3.5, h: 1.6, margin: 0, paraSpaceAfter: 2 });

  // Co-founder 2
  card(s12, pres, 5.2, 1.5, 4.1, 3.55);
  s12.addShape(pres.shapes.OVAL, { x: 6.75, y: 1.7, w: 0.85, h: 0.85, fill: { color: C.bgCard2 } });
  s12.addText("\u2663", { x: 6.75, y: 1.7, w: 0.85, h: 0.85, fontSize: 30, color: C.gold, align: "center", valign: "middle", margin: 0 });
  s12.addText("Co-Founder", { x: 5.4, y: 2.7, w: 3.7, h: 0.3, fontSize: 17, fontFace: FONT_H, color: C.white, align: "center", margin: 0 });
  s12.addText("AI Engineering & Quant Systems", { x: 5.4, y: 3.0, w: 3.7, h: 0.25, fontSize: 12, fontFace: FONT_B, color: C.gold, align: "center", margin: 0 });
  s12.addText([
    { text: "Former AI engineer at a quant hedge fund:", options: { breakLine: true, fontSize: 10.5, fontFace: FONT_L, color: C.grayLight } },
    { text: "", options: { breakLine: true, fontSize: 5 } },
    { text: "ML & AI Systems Architecture", options: { bullet: true, breakLine: true, fontSize: 10.5, fontFace: FONT_L, color: C.grayLight } },
    { text: "Quantitative Analysis & Modeling", options: { bullet: true, breakLine: true, fontSize: 10.5, fontFace: FONT_L, color: C.grayLight } },
    { text: "Algorithm Design & Analytics", options: { bullet: true, breakLine: true, fontSize: 10.5, fontFace: FONT_L, color: C.grayLight } },
    { text: "Full-Stack Platform Engineering", options: { bullet: true, fontSize: 10.5, fontFace: FONT_L, color: C.grayLight } },
  ], { x: 5.5, y: 3.35, w: 3.5, h: 1.6, margin: 0, paraSpaceAfter: 2 });
  addFooter(s12, pres, false);

  // ════════════ SLIDE 13: FINANCIAL PROJECTIONS ════════════
  let s13 = pres.addSlide();
  s13.background = { color: C.bg };
  addHeader(s13, "FINANCIAL PROJECTIONS");
  s13.addText("Path to Profitability", { x: 0.7, y: 0.75, w: 9, h: 0.5, fontSize: 28, fontFace: FONT_H, color: C.white, margin: 0 });

  s13.addChart(pres.charts.BAR, [{
    name: "GTV ($M)",
    labels: ["Year 1", "Year 2", "Year 3"],
    values: [2, 12, 45],
  }], {
    x: 0.7, y: 1.35, w: 4.2, h: 2.55, barDir: "col",
    chartColors: [C.gold],
    chartArea: { fill: { color: C.bgCard }, roundedCorners: true },
    catAxisLabelColor: C.gray,
    valAxisLabelColor: C.gray,
    catAxisLabelFontSize: 10,
    catAxisLabelFontFace: FONT_L,
    valAxisLabelFontSize: 9,
    valGridLine: { color: C.line, size: 0.5 },
    catGridLine: { style: "none" },
    showValue: true,
    dataLabelPosition: "outEnd",
    dataLabelColor: C.gold,
    showLegend: false,
    showTitle: true,
    title: "Gross Transaction Value ($M)",
    titleColor: C.grayLight,
    titleFontSize: 11,
    titleFontFace: FONT_L,
  });

  card(s13, pres, 5.2, 1.35, 4.1, 2.55);
  s13.addText("3-Year Forecast", { x: 5.2, y: 1.42, w: 4.1, h: 0.3, fontSize: 13, fontFace: FONT_H, color: C.gold, align: "center", margin: 0 });

  const finHeaders = [
    { text: "", options: { fill: { color: C.bgCard2 }, color: C.gray, fontSize: 10, fontFace: FONT_L } },
    { text: "Year 1", options: { fill: { color: C.bgCard2 }, color: C.gold, bold: true, fontSize: 10, fontFace: FONT_B, align: "center" } },
    { text: "Year 2", options: { fill: { color: C.bgCard2 }, color: C.gold, bold: true, fontSize: 10, fontFace: FONT_B, align: "center" } },
    { text: "Year 3", options: { fill: { color: C.bgCard2 }, color: C.gold, bold: true, fontSize: 10, fontFace: FONT_B, align: "center" } },
  ];
  const finRow = (label, v1, v2, v3, isBold) => [
    { text: label, options: { fill: { color: C.bgCard }, color: isBold ? C.white : C.grayLight, fontSize: 10, fontFace: isBold ? FONT_H : FONT_L, bold: isBold } },
    { text: v1, options: { fill: { color: C.bgCard }, color: isBold ? C.gold : C.grayLight, fontSize: 10, fontFace: FONT_B, align: "center", bold: isBold } },
    { text: v2, options: { fill: { color: C.bgCard }, color: isBold ? C.gold : C.grayLight, fontSize: 10, fontFace: FONT_B, align: "center", bold: isBold } },
    { text: v3, options: { fill: { color: C.bgCard }, color: isBold ? C.gold : C.grayLight, fontSize: 10, fontFace: FONT_B, align: "center", bold: isBold } },
  ];

  s13.addTable([
    finHeaders,
    finRow("GTV", "$2M", "$12M", "$45M", false),
    finRow("Users", "2,000", "8,000", "25,000", false),
    finRow("Listings", "200", "1,200", "4,500", false),
    finRow("Revenue", "$40K", "$360K", "$1.35M", true),
    finRow("Costs", "$180K", "$400K", "$650K", false),
    finRow("Net", "-$140K", "-$40K", "$700K", true),
  ], {
    x: 5.35, y: 1.82, w: 3.8, colW: [1.05, 0.88, 0.88, 0.99],
    border: { pt: 0.3, color: C.line },
    rowH: [0.26, 0.25, 0.25, 0.25, 0.27, 0.25, 0.27],
  });

  s13.addText("Key Assumptions", { x: 0.7, y: 4.1, w: 9, h: 0.22, fontSize: 11, fontFace: FONT_H, color: C.white, margin: 0 });
  s13.addText("2% platform fee (post-launch)  \u00b7  Avg listing: $10K buy-in  \u00b7  50% action sold  \u00b7  1-3% payment margin  \u00b7  Break-even by Year 2", {
    x: 0.7, y: 4.32, w: 8.6, h: 0.3, fontSize: 9.5, fontFace: FONT_L, color: C.gray, margin: 0
  });
  addFooter(s13, pres, false);

  // ════════════ SLIDE 14: THE ASK ════════════
  let s14 = pres.addSlide();
  s14.background = { color: C.bg };

  s14.addText("Back Players. Share Victories.", { x: 1, y: 0.6, w: 8, h: 0.55, fontSize: 28, fontFace: FONT_L, color: C.gold, align: "center", margin: 0 });

  s14.addText("Seed Round", { x: 1, y: 1.4, w: 8, h: 0.35, fontSize: 14, fontFace: FONT_L, color: C.gray, align: "center", margin: 0 });
  s14.addText("$500K", { x: 1, y: 1.7, w: 8, h: 0.65, fontSize: 48, fontFace: FONT_H, color: C.white, align: "center", margin: 0 });

  // Use of funds with progress bars
  card(s14, pres, 1.5, 2.55, 7.0, 1.65);
  s14.addText("Use of Funds", { x: 1.5, y: 2.6, w: 7.0, h: 0.28, fontSize: 13, fontFace: FONT_H, color: C.gold, align: "center", margin: 0 });

  const funds = [
    { pct: 40, use: "Engineering & Product", desc: "Mobile app, API integrations, data feeds" },
    { pct: 25, use: "Business Development", desc: "CTP partnership, sponsorships, acquisition" },
    { pct: 20, use: "Marketing & Growth", desc: "Community, content, event presence" },
    { pct: 15, use: "Operations & Legal", desc: "Compliance, licensing, team expansion" },
  ];
  for (let i = 0; i < funds.length; i++) {
    const fy = 2.97 + i * 0.28;
    // Progress bar background
    s14.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1.75, y: fy + 0.01, w: 0.9, h: 0.16, rectRadius: 0.03, fill: { color: C.bgCard2 } });
    // Progress bar fill
    s14.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1.75, y: fy + 0.01, w: 0.9 * (funds[i].pct / 40), h: 0.16, rectRadius: 0.03, fill: { color: C.gold } });
    s14.addText(funds[i].pct + "%", { x: 2.75, y: fy, w: 0.5, h: 0.22, fontSize: 10, fontFace: FONT_H, color: C.gold, margin: 0 });
    s14.addText(funds[i].use, { x: 3.3, y: fy, w: 2.0, h: 0.22, fontSize: 10, fontFace: FONT_H, color: C.white, margin: 0 });
    s14.addText(funds[i].desc, { x: 5.35, y: fy, w: 3.0, h: 0.22, fontSize: 9.5, fontFace: FONT_L, color: C.gray, margin: 0 });
  }

  // Contact
  s14.addShape(pres.shapes.LINE, { x: 3.5, y: 4.45, w: 3, h: 0, line: { color: C.line, width: 0.5 } });
  s14.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.15, y: 4.6, w: 0.5, h: 0.5, fill: { color: C.gold }, rectRadius: 0.08 });
  s14.addText("\u2660", { x: 4.15, y: 4.6, w: 0.5, h: 0.5, fontSize: 20, color: C.bg, align: "center", valign: "middle", fontFace: FONT_B, margin: 0 });
  s14.addText([
    { text: "Back", options: { bold: true, fontSize: 18, color: C.white, fontFace: FONT_H } },
    { text: "Hub", options: { bold: true, fontSize: 18, color: C.gold, fontFace: FONT_H } },
  ], { x: 4.7, y: 4.6, w: 2.0, h: 0.5, valign: "middle", margin: 0 });
  s14.addText("support@backhub.com  \u00b7  Taipei, Taiwan", { x: 1, y: 5.12, w: 8, h: 0.2, fontSize: 11, fontFace: FONT_L, color: C.grayDim, align: "center", margin: 0 });
  addFooter(s14, pres, true);

  // Write file
  await pres.writeFile({ fileName: "D:\\SnapAllin-master\\SnapAllin-master\\BackHub_Pitch_Deck_2026.pptx" });
  console.log("Pitch deck created successfully!");
}

main().catch(console.error);
