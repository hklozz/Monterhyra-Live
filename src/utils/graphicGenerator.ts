// graphicGenerator.ts — Gratis Canvas-baserad vepa/tryck-generator

export interface GraphicOptions {
  mainText: string;
  subText?: string;
  tagline?: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  style: 'modern' | 'bold' | 'elegant' | 'minimal' | 'corporate';
  wallWidthM: number;
  wallHeightM: number;
}

export function generateGraphic(opts: GraphicOptions): string {
  const PX = 300; // pixlar per meter
  const w = Math.round(opts.wallWidthM * PX);
  const h = Math.round(opts.wallHeightM * PX);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  switch (opts.style) {
    case 'bold':      drawBold(ctx, w, h, opts); break;
    case 'elegant':   drawElegant(ctx, w, h, opts); break;
    case 'minimal':   drawMinimal(ctx, w, h, opts); break;
    case 'corporate': drawCorporate(ctx, w, h, opts); break;
    default:          drawModern(ctx, w, h, opts);
  }

  return canvas.toDataURL('image/jpeg', 0.93);
}

// ─── MODERN ───────────────────────────────────────────────────────────────────
function drawModern(ctx: CanvasRenderingContext2D, w: number, h: number, o: GraphicOptions) {
  ctx.fillStyle = o.backgroundColor;
  ctx.fillRect(0, 0, w, h);

  // Diagonala accentstriper
  ctx.save();
  ctx.fillStyle = o.accentColor;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.55); ctx.lineTo(w, h * 0.28);
  ctx.lineTo(w, h * 0.43); ctx.lineTo(0, h * 0.70);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 0.32;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.68); ctx.lineTo(w * 0.35, h * 0.56);
  ctx.lineTo(w * 0.35, h * 0.61); ctx.lineTo(0, h * 0.73);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  // Hörn-dekorationer
  ctx.fillStyle = o.accentColor;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(w * 0.04, h * 0.06,  w * 0.045, h * 0.004);
  ctx.fillRect(w * 0.04, h * 0.06,  w * 0.004, h * 0.045);
  ctx.fillRect(w * 0.916, h * 0.934, w * 0.045, h * 0.004);
  ctx.fillRect(w * 0.956, h * 0.890, w * 0.004, h * 0.045);
  ctx.globalAlpha = 1;

  // Huvudtext
  const ms = Math.min(w * 0.13, h * 0.22);
  ctx.fillStyle = o.textColor;
  ctx.font = `bold ${ms}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(o.mainText, w / 2, h * 0.40);

  // Understrykning
  const tw = ctx.measureText(o.mainText).width;
  ctx.fillStyle = o.accentColor;
  ctx.fillRect(w / 2 - tw * 0.4, h * 0.51, tw * 0.8, h * 0.007);

  // Undertext
  if (o.subText) {
    ctx.fillStyle = o.textColor;
    ctx.globalAlpha = 0.85;
    ctx.font = `${ms * 0.38}px Arial, sans-serif`;
    ctx.fillText(o.subText, w / 2, h * 0.60);
    ctx.globalAlpha = 1;
  }
  if (o.tagline) {
    ctx.fillStyle = o.accentColor;
    ctx.font = `italic ${ms * 0.27}px Arial, sans-serif`;
    ctx.fillText(o.tagline, w / 2, h * 0.71);
  }
}

// ─── BOLD ─────────────────────────────────────────────────────────────────────
function drawBold(ctx: CanvasRenderingContext2D, w: number, h: number, o: GraphicOptions) {
  ctx.fillStyle = o.backgroundColor;
  ctx.fillRect(0, 0, w, h);

  // Topband och bottenband
  ctx.fillStyle = o.accentColor;
  ctx.fillRect(0, 0,        w, h * 0.09);
  ctx.fillRect(0, h * 0.91, w, h * 0.09);

  // Stor text
  const ms = Math.min(w * 0.19, h * 0.30);
  ctx.fillStyle = o.textColor;
  ctx.font = `900 ${ms}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(o.mainText, w / 2, h * 0.42);

  if (o.subText) {
    ctx.fillStyle = o.accentColor;
    ctx.font = `bold ${ms * 0.34}px Arial, sans-serif`;
    ctx.fillText(o.subText, w / 2, h * 0.62);
  }
  if (o.tagline) {
    ctx.fillStyle = o.textColor;
    ctx.globalAlpha = 0.75;
    ctx.font = `${ms * 0.22}px Arial, sans-serif`;
    ctx.fillText(o.tagline, w / 2, h * 0.75);
    ctx.globalAlpha = 1;
  }
}

// ─── ELEGANT ──────────────────────────────────────────────────────────────────
function drawElegant(ctx: CanvasRenderingContext2D, w: number, h: number, o: GraphicOptions) {
  // Gradientbakgrund
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, shiftColor(o.backgroundColor, 25));
  grad.addColorStop(1, shiftColor(o.backgroundColor, -25));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Tunna dekorationslinjer
  ctx.strokeStyle = o.accentColor;
  ctx.lineWidth = h * 0.002;
  ctx.globalAlpha = 0.55;
  ctx.beginPath(); ctx.moveTo(w * 0.08, h * 0.20); ctx.lineTo(w * 0.92, h * 0.20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w * 0.08, h * 0.80); ctx.lineTo(w * 0.92, h * 0.80); ctx.stroke();
  ctx.globalAlpha = 1;

  const ms = Math.min(w * 0.10, h * 0.18);
  ctx.fillStyle = o.textColor;
  ctx.font = `300 ${ms}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(o.mainText, w / 2, h * 0.40);

  // Punktseparator
  ctx.fillStyle = o.accentColor;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(w / 2 + i * h * 0.045, h * 0.54, h * 0.006, 0, Math.PI * 2);
    ctx.fill();
  }

  if (o.subText) {
    ctx.fillStyle = o.textColor;
    ctx.globalAlpha = 0.80;
    ctx.font = `italic ${ms * 0.37}px Georgia, serif`;
    ctx.fillText(o.subText, w / 2, h * 0.63);
    ctx.globalAlpha = 1;
  }
  if (o.tagline) {
    ctx.fillStyle = o.accentColor;
    ctx.font = `${ms * 0.24}px Arial, sans-serif`;
    ctx.fillText(o.tagline.toUpperCase(), w / 2, h * 0.73);
  }
}

// ─── MINIMAL ──────────────────────────────────────────────────────────────────
function drawMinimal(ctx: CanvasRenderingContext2D, w: number, h: number, o: GraphicOptions) {
  ctx.fillStyle = o.backgroundColor;
  ctx.fillRect(0, 0, w, h);

  // Vertikal accentlinje
  ctx.fillStyle = o.accentColor;
  ctx.fillRect(w * 0.07, h * 0.22, w * 0.006, h * 0.56);

  const ms = Math.min(w * 0.09, h * 0.16);
  ctx.fillStyle = o.textColor;
  ctx.font = `bold ${ms}px Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(o.mainText, w * 0.11, h * 0.38);

  if (o.subText) {
    ctx.globalAlpha = 0.72;
    ctx.font = `${ms * 0.40}px Arial, sans-serif`;
    ctx.fillText(o.subText, w * 0.11, h * 0.53);
    ctx.globalAlpha = 1;
  }
  if (o.tagline) {
    ctx.fillStyle = o.accentColor;
    ctx.font = `${ms * 0.27}px Arial, sans-serif`;
    ctx.fillText(o.tagline, w * 0.11, h * 0.64);
  }
}

// ─── CORPORATE ────────────────────────────────────────────────────────────────
function drawCorporate(ctx: CanvasRenderingContext2D, w: number, h: number, o: GraphicOptions) {
  ctx.fillStyle = o.backgroundColor;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = o.accentColor;
  ctx.fillRect(0, 0,        w, h * 0.14);
  ctx.fillRect(0, h * 0.86, w, h * 0.14);

  const ms = Math.min(w * 0.12, h * 0.21);
  ctx.fillStyle = o.textColor;
  ctx.font = `bold ${ms}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(o.mainText, w / 2, h * 0.40);

  ctx.fillStyle = o.accentColor;
  ctx.fillRect(w * 0.30, h * 0.545, w * 0.40, h * 0.003);

  if (o.subText) {
    ctx.fillStyle = o.textColor;
    ctx.globalAlpha = 0.82;
    ctx.font = `${ms * 0.39}px Arial, sans-serif`;
    ctx.fillText(o.subText, w / 2, h * 0.62);
    ctx.globalAlpha = 1;
  }
  if (o.tagline) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `${ms * 0.26}px Arial, sans-serif`;
    ctx.fillText(o.tagline, w / 2, h * 0.928);
  }
}

// ─── Hjälp ────────────────────────────────────────────────────────────────────
function shiftColor(hex: string, amount: number): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return hex;
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const [rr, gg, bb] = [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)];
  return `#${clamp(rr + amount).toString(16).padStart(2, '0')}${clamp(gg + amount).toString(16).padStart(2, '0')}${clamp(bb + amount).toString(16).padStart(2, '0')}`;
}

// ─── Färgprofiler ─────────────────────────────────────────────────────────────
export interface ColorProfile {
  bg: string; text: string; accent: string;
}

export const COLOR_PROFILES: Record<string, ColorProfile> = {
  'blå':      { bg: '#1565C0', text: '#ffffff', accent: '#FFC107' },
  'mörkblå':  { bg: '#0D47A1', text: '#ffffff', accent: '#FFD740' },
  'navy':     { bg: '#0A2342', text: '#ffffff', accent: '#FFD700' },
  'röd':      { bg: '#C62828', text: '#ffffff', accent: '#FFF176' },
  'grön':     { bg: '#2E7D32', text: '#ffffff', accent: '#FFD740' },
  'mörkgrön': { bg: '#1B5E20', text: '#ffffff', accent: '#A5D6A7' },
  'svart':    { bg: '#1a1a1a', text: '#ffffff', accent: '#FFD700' },
  'vit':      { bg: '#FAFAFA', text: '#212121', accent: '#1565C0' },
  'grå':      { bg: '#424242', text: '#ffffff', accent: '#FFD740' },
  'ljusgrå':  { bg: '#ECEFF1', text: '#212121', accent: '#546E7A' },
  'gul':      { bg: '#F9A825', text: '#212121', accent: '#1565C0' },
  'orange':   { bg: '#E65100', text: '#ffffff', accent: '#FFF176' },
  'lila':     { bg: '#6A1B9A', text: '#ffffff', accent: '#FFD740' },
  'turkos':   { bg: '#00838F', text: '#ffffff', accent: '#FFF176' },
  'beige':    { bg: '#F5E6D3', text: '#3E2723', accent: '#795548' },
  'guld':     { bg: '#1a1a1a', text: '#FFD700', accent: '#FFD700' },
  'silver':   { bg: '#37474F', text: '#ECEFF1', accent: '#B0BEC5' },
  'rosa':     { bg: '#880E4F', text: '#ffffff', accent: '#F8BBD0' },
  'brun':     { bg: '#4E342E', text: '#ffffff', accent: '#FFCC80' },
};

export function detectColorProfile(text: string): ColorProfile {
  const t = text.toLowerCase();
  for (const [key, profile] of Object.entries(COLOR_PROFILES)) {
    if (t.includes(key)) return profile;
  }
  return { bg: '#1565C0', text: '#ffffff', accent: '#FFC107' }; // standard blå
}

export function detectStyle(text: string): GraphicOptions['style'] {
  const t = text.toLowerCase();
  if (/minimal|enkel|ren|stilren/.test(t)) return 'minimal';
  if (/elegant|lyxig|exklusiv|sofistik/.test(t)) return 'elegant';
  if (/djärv|tydlig|kraftfull|stor text|stor font/.test(t)) return 'bold';
  if (/företag|professionell|seriös|corporate/.test(t)) return 'corporate';
  return 'modern';
}
