// aiInterpreter.ts — Gratis svensk NLP för monterkonfiguratorn
import type { GraphicOptions } from './graphicGenerator';
import { detectColorProfile, detectStyle } from './graphicGenerator';

// ─── Action-typer ─────────────────────────────────────────────────────────────
export type AIAction =
  | { type: 'SET_FLOOR'; index: number }
  | { type: 'SET_WALL_SHAPE'; shape: 'straight' | 'l' | 'u' }
  | { type: 'SET_WALL_HEIGHT'; height: number }
  | { type: 'SET_CARPET'; index: number }
  | { type: 'ADD_TV'; wall: 'back' | 'left' | 'right'; size: number }
  | { type: 'REMOVE_ALL_TVS' }
  | { type: 'ADD_PLANT'; plantType: number }
  | { type: 'ADD_COUNTER'; counterType: number }
  | { type: 'ADD_STORAGE'; storageType: number }
  | { type: 'SET_LIGHTS'; show: boolean }
  | { type: 'SET_GRAPHIC'; graphic: string }
  | { type: 'GENERATE_IMAGE'; wall: 'back' | 'left' | 'right'; config: GraphicOptions }
  | { type: 'RESET' };

export interface AIContext {
  floorIndex: number | null;
  wallShape: string;
  wallHeight: number;
  tvCount: number;
  plantCount: number;
}

export interface InterpretResult {
  actions: AIAction[];
  response: string;
}

// ─── Konstanter (speglar App.tsx) ─────────────────────────────────────────────
const FLOOR_SIZES = [
  { label: '3×2', width: 3, depth: 2 },
  { label: '3×3', width: 3, depth: 3 },
  { label: '4×2', width: 4, depth: 2 },
  { label: '4×3', width: 4, depth: 3 },
  { label: '4×4', width: 4, depth: 4 },
  { label: '5×2', width: 5, depth: 2 },
  { label: '5×3', width: 5, depth: 3 },
  { label: '5×5', width: 5, depth: 5 },
  { label: '6×3', width: 6, depth: 3 },
  { label: '6×4', width: 6, depth: 4 },
  { label: '6×5', width: 6, depth: 5 },
  { label: '6×6', width: 6, depth: 6 },
  { label: '7×3', width: 7, depth: 3 },
  { label: '7×4', width: 7, depth: 4 },
  { label: '7×7', width: 7, depth: 7 },
  { label: '8×3', width: 8, depth: 3 },
  { label: '8×5', width: 8, depth: 5 },
  { label: '8×6', width: 8, depth: 6 },
  { label: '10×10', width: 10, depth: 10 },
];

const CARPET_NAMES = [
  'ingen matta', 'gul', 'svart', 'grå', 'röd', 'orange',
  'brun', 'grön', 'beige', 'lila', 'vit',
];

const PLANT_LABELS = [
  'ficus', 'monstera', 'bambu', 'palmlilja', 'olivträd',
  'sansevieria', 'kaktus', 'rosmarin', 'lavendel', 'eucalyptus',
];

const TV_LABELS = ['ingen', '43"', '55"', '70"'];

const COUNTER_LABELS = [
  'ingen disk', '1m disk', '2m disk', '2,5m disk', '3m disk', 'l-disk',
];

const STORAGE_LABELS = [
  'inget förråd', '1x1', '2x1', '3x1', '4x1',
];

// ─── Sifferord svenska ────────────────────────────────────────────────────────
const NUM_WORDS: Record<string, number> = {
  'noll': 0, 'en': 1, 'ett': 1, 'två': 2, 'tre': 3, 'fyra': 4, 'fem': 5,
  'sex': 6, 'sju': 7, 'åtta': 8, 'nio': 9, 'tio': 10,
};

function wordToNum(text: string): number | null {
  return NUM_WORDS[text.toLowerCase()] ?? null;
}

function extractNumbers(text: string): number[] {
  const results: number[] = [];
  // Siffror
  for (const m of text.matchAll(/\d+(?:[,.]\d+)?/g)) {
    results.push(parseFloat(m[0].replace(',', '.')));
  }
  // Sifferord
  for (const [word, val] of Object.entries(NUM_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(text.toLowerCase())) {
      results.push(val);
    }
  }
  return results;
}

// ─── Slumpad variation ────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const ACK = ['Perfekt!', 'Bra val!', 'Toppen!', 'Absolut!', 'Självklart!', 'Givetvis!'];
const DONE = ['Klart!', 'Fixat!', 'Det är gjort!', 'Inlagt!'];

// ─── Tolkning ─────────────────────────────────────────────────────────────────
export function interpretMessage(message: string, context: AIContext): InterpretResult {
  const raw = message.trim();
  const msg = raw.toLowerCase();
  const actions: AIAction[] = [];
  const confirmations: string[] = [];

  // Hälsning / hjälp
  if (/^(hej|hallå|hi|hello|tjena|tja|god morgon|god kväll)/.test(msg) && raw.length < 25) {
    return { actions: [], response: getWelcome() };
  }
  if (/\bhj[äa]lp\b|vad kan du|vad klarar du|vad g[öo]r du/.test(msg)) {
    return { actions: [], response: getHelp() };
  }

  // Börja om
  if (/börja om|starta om|nollst[äa]ll|rensa allt|reset|ta bort allt/.test(msg)) {
    return {
      actions: [{ type: 'RESET' }],
      response: '🔄 Okej, jag nollställer allt! Berätta vad du vill ha för monter.',
    };
  }

  // ── Golvstorlek ──────────────────────────────────────────────────────────────
  const floorIdx = detectFloor(msg);
  if (floorIdx !== null) {
    actions.push({ type: 'SET_FLOOR', index: floorIdx });
    confirmations.push(`${FLOOR_SIZES[floorIdx].label}m monter`);
  }

  // ── Väggform ─────────────────────────────────────────────────────────────────
  const shape = detectWallShape(msg);
  if (shape) {
    actions.push({ type: 'SET_WALL_SHAPE', shape });
    const shapeLabel = shape === 'straight' ? 'raka väggar' : shape === 'l' ? 'L-form' : 'U-form';
    confirmations.push(shapeLabel);
  }

  // ── Vägghöjd ─────────────────────────────────────────────────────────────────
  if (/3\s*m[eter]*\s*h[öo]g|hög[a]?\s*v[äa]gg|v[äa]gg\s*3\s*m/.test(msg)) {
    actions.push({ type: 'SET_WALL_HEIGHT', height: 3 });
    confirmations.push('3m höga väggar');
  } else if (/2[,.]5\s*m[eter]*|2\.5\s*m/.test(msg)) {
    actions.push({ type: 'SET_WALL_HEIGHT', height: 2.5 });
    confirmations.push('2,5m höga väggar');
  }

  // ── Matta ────────────────────────────────────────────────────────────────────
  const carpetIdx = detectCarpet(msg);
  if (carpetIdx !== null) {
    actions.push({ type: 'SET_CARPET', index: carpetIdx });
    confirmations.push(`${CARPET_NAMES[carpetIdx]} matta`);
  }

  // ── Belysning ────────────────────────────────────────────────────────────────
  if (/s[äa]tt\s*(p[åa]|till)\s*(lampor|belysning|ljus)|l[äa]gg\s*till\s*(lampor|belysning|ljus)|belysning\s*p[åa]|lampor\s*p[åa]/.test(msg)) {
    actions.push({ type: 'SET_LIGHTS', show: true });
    confirmations.push('belysning');
  } else if (/stäng\s*av|ta\s*bort\s*(lampor|belysning|ljus)|ingen\s*belysning/.test(msg)) {
    actions.push({ type: 'SET_LIGHTS', show: false });
    confirmations.push('belysning borttagen');
  }

  // ── TV ───────────────────────────────────────────────────────────────────────
  const tvActions = detectTVs(msg);
  for (const tva of tvActions) {
    actions.push(tva);
    const sizeLabel = TV_LABELS[tva.size] || '';
    const wallLabel = tva.wall === 'back' ? 'bakre' : tva.wall === 'left' ? 'vänstra' : 'högra';
    confirmations.push(`${sizeLabel} TV på ${wallLabel} väggen`);
  }

  // ── Växter ───────────────────────────────────────────────────────────────────
  const plantActions = detectPlants(msg);
  for (const pa of plantActions) {
    actions.push(pa);
    confirmations.push(PLANT_LABELS[pa.plantType]);
  }

  // ── Diskar ───────────────────────────────────────────────────────────────────
  const counterActions = detectCounters(msg);
  for (const ca of counterActions) {
    actions.push(ca);
    confirmations.push(COUNTER_LABELS[ca.counterType]);
  }

  // ── Förråd ───────────────────────────────────────────────────────────────────
  const storageActions = detectStorages(msg);
  for (const sa of storageActions) {
    actions.push(sa);
    confirmations.push(`${STORAGE_LABELS[sa.storageType]} förråd`);
  }

  // ── Grafik / vepa ────────────────────────────────────────────────────────────
  const graphicResult = detectGraphicGeneration(raw, context);
  if (graphicResult) {
    actions.push(graphicResult.action);
    return { actions, response: graphicResult.response };
  }

  // Visa grafik-inställning (utan generering)
  if (/eget\s*tryck|vepa|forex|hyr\s*grafik|egen\s*grafik/.test(msg)) {
    if (/hyr/.test(msg)) {
      actions.push({ type: 'SET_GRAPHIC', graphic: 'hyr' });
      confirmations.push('hyr grafik');
    } else if (/forex/.test(msg)) {
      actions.push({ type: 'SET_GRAPHIC', graphic: 'forex' });
      confirmations.push('eget tryck (forex)');
    } else if (/vepa/.test(msg)) {
      actions.push({ type: 'SET_GRAPHIC', graphic: 'vepa' });
      confirmations.push('vepa');
    }
  }

  // ── Bygg svar ────────────────────────────────────────────────────────────────
  if (actions.length === 0) {
    return { actions: [], response: getFallback(msg) };
  }

  const list = confirmations.map(c => `**${c}**`).join(', ');
  const ack = pick(ACK);
  const done = pick(DONE);

  let suffix = '';
  if (!context.wallShape && !shape) {
    suffix = '\n\nVill du ha raka väggar, L-form eller U-form?';
  } else if (context.tvCount === 0 && tvActions.length === 0 && !suffix) {
    suffix = '\n\nVill du lägga till TV-apparater eller växter?';
  }

  return {
    actions,
    response: `${ack} ${done} Jag har lagt till: ${list}.${suffix}`,
  };
}

// ─── Golvdetektion ────────────────────────────────────────────────────────────
function detectFloor(msg: string): number | null {
  // "4x3", "4×3", "4*3", "4 x 3", "4 gånger 3"
  const patterns = [
    /(\d+)\s*[x×*]\s*(\d+)/,
    /(\d+)\s+g[åa]nger\s+(\d+)/,
  ];
  for (const pat of patterns) {
    const m = msg.match(pat);
    if (m) {
      const w = parseInt(m[1]);
      const d = parseInt(m[2]);
      const idx = FLOOR_SIZES.findIndex(f => f.width === w && f.depth === d);
      if (idx !== -1) return idx;
      // Prova omvänd ordning
      const idx2 = FLOOR_SIZES.findIndex(f => f.width === d && f.depth === w);
      if (idx2 !== -1) return idx2;
    }
  }

  // Sifferord-kombination: "fyra gånger tre"
  for (const [wa, wv] of Object.entries(NUM_WORDS)) {
    for (const [da, dv] of Object.entries(NUM_WORDS)) {
      if (new RegExp(`\\b${wa}\\s+g[åa]nger\\s+${da}\\b`).test(msg)) {
        const idx = FLOOR_SIZES.findIndex(f => f.width === wv && f.depth === dv);
        if (idx !== -1) return idx;
      }
    }
  }

  // Direkta labels: "6x4" i text
  for (let i = 0; i < FLOOR_SIZES.length; i++) {
    const { width, depth } = FLOOR_SIZES[i];
    if (msg.includes(`${width}x${depth}`) || msg.includes(`${width}×${depth}`)) return i;
  }

  return null;
}

// ─── Väggformdetektion ────────────────────────────────────────────────────────
function detectWallShape(msg: string): 'straight' | 'l' | 'u' | null {
  if (/\bu-form|\bu\s+form|u-formad|tre\s*v[äa]gg|trv[äa]gg/.test(msg)) return 'u';
  if (/\bl-form|\bl\s+form|l-formad|tv[åa]\s*v[äa]gg|vinkel/.test(msg)) return 'l';
  if (/\brak\b|raka\s*v[äa]gg|rak\s*v[äa]gg|en\s*v[äa]gg|\bstraight\b/.test(msg)) return 'straight';
  return null;
}

// ─── Mattadetektion ───────────────────────────────────────────────────────────
function detectCarpet(msg: string): number | null {
  if (/ingen\s*matta|utan\s*matta|ta\s*bort\s*matta/.test(msg)) return 0;

  const carpetColors: [RegExp, number][] = [
    [/\bgul\b|\bgult\b/, 1],
    [/\bsvart\b/, 2],
    [/\bgrå\b|\bgråt\b/, 3],
    [/\br[öo]d\b|\br[öo]tt\b/, 4],
    [/\borange\b/, 5],
    [/\bbrun\b|\bbrunt\b/, 6],
    [/\bgr[öo]n\b|\bgr[öo]nt\b/, 7],
    [/\bbeige\b/, 8],
    [/\blila\b/, 9],
    [/\bvit\b|\bvitt\b/, 10],
  ];

  for (const [pattern, idx] of carpetColors) {
    if (pattern.test(msg) && /matta|golv|heltäckande/.test(msg)) {
      return idx;
    }
  }

  // Matta nämns utan färg — behöver inte göra något
  return null;
}

// ─── TV-detektion ─────────────────────────────────────────────────────────────
function detectTVs(msg: string): Array<{ type: 'ADD_TV'; wall: 'back' | 'left' | 'right'; size: number }> {
  const results: Array<{ type: 'ADD_TV'; wall: 'back' | 'left' | 'right'; size: number }> = [];

  const wall = detectWall(msg);
  let count = 1;

  // Räkna antal ("2 tv", "tre tv-apparater")
  const countMatch = msg.match(/(\d+|en|ett|två|tre|fyra|fem)\s*(st|stycken|st\.)?\s*tv/i);
  if (countMatch) {
    const n = parseInt(countMatch[1]);
    count = isNaN(n) ? (wordToNum(countMatch[1]) ?? 1) : n;
  }

  // Storlek
  let size = 1; // default 43"
  if (/70\s*"?|70\s*tum/.test(msg)) size = 3;
  else if (/55\s*"?|55\s*tum/.test(msg)) size = 2;
  else if (/43\s*"?|43\s*tum/.test(msg)) size = 1;

  if (/\btv\b|television|sk[äa]rm/.test(msg)) {
    for (let i = 0; i < Math.min(count, 4); i++) {
      results.push({ type: 'ADD_TV', wall, size });
    }
  }

  return results;
}

function detectWall(msg: string): 'back' | 'left' | 'right' {
  if (/v[äa]nster/.test(msg)) return 'left';
  if (/h[öo]ger/.test(msg)) return 'right';
  return 'back';
}

// ─── Växtdetektion ────────────────────────────────────────────────────────────
function detectPlants(msg: string): Array<{ type: 'ADD_PLANT'; plantType: number }> {
  const results: Array<{ type: 'ADD_PLANT'; plantType: number }> = [];

  const plantMap: [RegExp, number][] = [
    [/ficus/, 0],
    [/monstera/, 1],
    [/bambu/, 2],
    [/palmlilja|palm/, 3],
    [/oliv/, 4],
    [/sansevieria|svärdlilja/, 5],
    [/kaktus/, 6],
    [/rosmarin/, 7],
    [/lavendel/, 8],
    [/eucalyptus|eukalyptus/, 9],
  ];

  // Generell växt utan specifikation
  if (/l[äa]gg\s*till\s*(en|ett)?\s*(v[äa]xt|blomma|kruka|gr[öo]nska)/.test(msg) &&
    !plantMap.some(([pat]) => pat.test(msg))) {
    results.push({ type: 'ADD_PLANT', plantType: 0 }); // default: ficus
    return results;
  }

  // Räkna antal
  let count = 1;
  const countMatch = msg.match(/(\d+|en|ett|två|tre|fyra|fem)\s*(st|stycken)?\s*(v[äa]xt|blomma|kruka)/i);
  if (countMatch) {
    const n = parseInt(countMatch[1]);
    count = isNaN(n) ? (wordToNum(countMatch[1]) ?? 1) : n;
  }

  for (const [pattern, idx] of plantMap) {
    if (pattern.test(msg)) {
      const times = pattern.test(msg) ? count : 1;
      for (let i = 0; i < Math.min(times, 4); i++) {
        results.push({ type: 'ADD_PLANT', plantType: idx });
      }
    }
  }

  return results;
}

// ─── Diskdetektion ────────────────────────────────────────────────────────────
function detectCounters(msg: string): Array<{ type: 'ADD_COUNTER'; counterType: number }> {
  const results: Array<{ type: 'ADD_COUNTER'; counterType: number }> = [];

  if (!/disk|reception|bar\b|kassa|monter[ings]*disk/.test(msg)) return results;

  if (/l-disk|l\s+disk|l-formad\s*disk|vinkel\s*disk/.test(msg)) {
    results.push({ type: 'ADD_COUNTER', counterType: 5 });
  } else if (/3\s*m?\s*disk|tre\s*m/.test(msg)) {
    results.push({ type: 'ADD_COUNTER', counterType: 4 });
  } else if (/2[,.]5\s*m?\s*disk|tv[åa]\s*och\s*en\s*halv/.test(msg)) {
    results.push({ type: 'ADD_COUNTER', counterType: 3 });
  } else if (/2\s*m?\s*disk|tv[åa]\s*m/.test(msg)) {
    results.push({ type: 'ADD_COUNTER', counterType: 2 });
  } else if (/1\s*m?\s*disk|en\s*m/.test(msg)) {
    results.push({ type: 'ADD_COUNTER', counterType: 1 });
  } else {
    // Standard: 2m disk
    results.push({ type: 'ADD_COUNTER', counterType: 2 });
  }

  return results;
}

// ─── Förråddetektion ──────────────────────────────────────────────────────────
function detectStorages(msg: string): Array<{ type: 'ADD_STORAGE'; storageType: number }> {
  const results: Array<{ type: 'ADD_STORAGE'; storageType: number }> = [];
  if (!/förr[åa]d/.test(msg)) return results;

  if (/4\s*[x×]\s*1|4x1/.test(msg)) results.push({ type: 'ADD_STORAGE', storageType: 4 });
  else if (/3\s*[x×]\s*1|3x1/.test(msg)) results.push({ type: 'ADD_STORAGE', storageType: 3 });
  else if (/2\s*[x×]\s*1|2x1/.test(msg)) results.push({ type: 'ADD_STORAGE', storageType: 2 });
  else if (/1\s*[x×]\s*1|1x1/.test(msg)) results.push({ type: 'ADD_STORAGE', storageType: 1 });
  else results.push({ type: 'ADD_STORAGE', storageType: 1 }); // standard 1x1

  return results;
}

// ─── Grafikgenerering ─────────────────────────────────────────────────────────
function detectGraphicGeneration(
  raw: string,
  context: AIContext,
): { action: AIAction; response: string } | null {
  const msg = raw.toLowerCase();

  // Måste innehålla ett genereringsnyckelord
  if (!/skapa|generera|gör|rita|designa|bygg/.test(msg)) return null;
  if (!/vepa|tryck|grafik|bild|banner|affisch/.test(msg)) return null;

  // Extrahera företagsnamn / text (efter "med texten", "med", "för", etc.)
  let mainText = extractQuotedText(raw) || extractCompanyName(raw) || 'Ditt Företag';

  // Undertext
  const subText = extractSubtext(raw);

  // Tagline
  const tagline = extractTagline(raw);

  // Vägg
  const wall: 'back' | 'left' | 'right' = detectWall(msg);

  // Färg
  const colors = detectColorProfile(msg);

  // Stil
  const style = detectStyle(msg);

  // Väggens dimensioner
  const floorIdx = context.floorIndex;
  const defaultFloor = { width: 4, depth: 3 };
  const floorSizes = [
    { width: 3, depth: 2 }, { width: 3, depth: 3 }, { width: 4, depth: 2 },
    { width: 4, depth: 3 }, { width: 4, depth: 4 }, { width: 5, depth: 2 },
    { width: 5, depth: 3 }, { width: 5, depth: 5 }, { width: 6, depth: 3 },
    { width: 6, depth: 4 }, { width: 6, depth: 5 }, { width: 6, depth: 6 },
    { width: 7, depth: 3 }, { width: 7, depth: 4 }, { width: 7, depth: 7 },
    { width: 8, depth: 3 }, { width: 8, depth: 5 }, { width: 8, depth: 6 },
    { width: 10, depth: 10 },
  ];
  const floor = floorIdx !== null ? floorSizes[floorIdx] : defaultFloor;
  const wallWidth = wall === 'back' ? floor.width : floor.depth;
  const wallH = context.wallHeight || 2.5;

  const config: GraphicOptions = {
    mainText,
    subText,
    tagline,
    backgroundColor: colors.bg,
    textColor: colors.text,
    accentColor: colors.accent,
    style,
    wallWidthM: wallWidth,
    wallHeightM: wallH,
  };

  const wallLabel = wall === 'back' ? 'bakre' : wall === 'left' ? 'vänstra' : 'högra';
  const styleLabel = style === 'modern' ? 'modern' : style === 'bold' ? 'djärv' :
    style === 'elegant' ? 'elegant' : style === 'minimal' ? 'minimalistisk' : 'corporate';

  return {
    action: { type: 'GENERATE_IMAGE', wall, config },
    response: `🎨 ${pick(ACK)} Jag skapar en **${styleLabel}** vepa med texten **"${mainText}"** på **${wallLabel} väggen**!\n\nVepan genereras nu och appliceras direkt på väggen. Vill du justera färger, stil eller text efteråt?`,
  };
}

// ─── Textextrahering ──────────────────────────────────────────────────────────
function extractQuotedText(text: string): string | null {
  const m = text.match(/["'«»""](.{1,60})["'»""]/) || text.match(/texten?\s+"?([A-ZÅÄÖ][^"'\n]{1,50})"?/i);
  return m ? m[1].trim() : null;
}

function extractCompanyName(text: string): string | null {
  // "med [Company Name]", "för [Company]", "vepa [Name]"
  const patterns = [
    /(?:med|för|till|åt)\s+([A-ZÅÄÖ][A-Za-zÅÄÖåäö\s&.-]{1,40}?)(?:\s+(?:och|med|i|på|,)|$)/,
    /(?:vepa|tryck|grafik|bild)\s+([A-ZÅÄÖ][A-Za-zÅÄÖåäö\s&.-]{1,40}?)(?:\s+(?:och|med|i|på|,)|$)/,
    /f[öo]retag(?:et|snamn)?\s+([A-ZÅÄÖ][A-Za-zÅÄÖåäö\s&.-]{1,40}?)(?:\s+(?:och|med|i|på|,)|$)/,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m && m[1].trim().length > 2) return m[1].trim();
  }
  return null;
}

function extractSubtext(text: string): string | undefined {
  const m = text.match(/undertext\s+"?([^"'\n]{1,60})"?/i) ||
    text.match(/tagline\s+"?([^"'\n]{1,60})"?/i) ||
    text.match(/slogan\s+"?([^"'\n]{1,60})"?/i);
  return m ? m[1].trim() : undefined;
}

function extractTagline(text: string): string | undefined {
  const m = text.match(/(?:payoff|tagline|slogan|undertitel)\s+"?([^"'\n]{1,60})"?/i);
  return m ? m[1].trim() : undefined;
}

// ─── Välkomstsvar ─────────────────────────────────────────────────────────────
function getWelcome(): string {
  return pick([
    '👋 Hej! Jag är din AI-assistent för monterkonfiguratorn.\n\nJag hjälper dig bygga din perfekta mässmonter — berätta bara vad du vill ha!\n\n**Exempel:**\n• *"4x3m monter med U-form och gul matta"*\n• *"Lägg till en 55" TV och två fikusväxter"*\n• *"Skapa en vepa med texten Acme AB på blå bakgrund"*',
    '🤖 Välkommen! Jag är här för att hjälpa dig designa din monter.\n\nBeskriv vad du vill ha, till exempel:\n• Storlek (t.ex. *"5x3m"*)\n• Väggform (*"U-form"*, *"L-form"* eller *"rak"*)\n• Tillbehör (*"gul matta"*, *"TV"*, *"växter"*)\n• *"Skapa en vepa med mitt företagsnamn"*',
  ]);
}

function getHelp(): string {
  return `🤖 **Det här kan jag hjälpa dig med:**

**📐 Monter-layout**
• Storlek: *"4x3m"*, *"6x4m"*, *"10x10m"* osv.
• Väggar: *"U-form"*, *"L-form"* eller *"raka väggar"*
• Höjd: *"3m höga väggar"*

**🎨 Utseende**
• Matta: *"gul matta"*, *"svart matta"*, *"ingen matta"*
• Belysning: *"lägg till belysning"*

**📺 Utrustning**
• TV: *"55" TV på bakre väggen"*, *"2 st 70" skärmar"*
• Disk: *"2m disk"*, *"L-disk"*
• Förråd: *"2x1 förråd"*

**🌿 Växter**
• *"Lägg till en ficus"*, *"monstera"*, *"olivträd"* m.fl.

**🖼️ Grafik (gratis generering!)**
• *"Skapa en vepa med texten 'Acme AB' och blå bakgrund"*
• *"Generera elegant tryck för TechCorp"*

**🔄 Övrigt**
• *"Börja om"* — nollställer allt`;
}

function getFallback(msg: string): string {
  const suggestions = [
    'Prova att skriva t.ex. *"4x3m U-form med gul matta"* eller *"lägg till en 55" TV"*.',
    'Jag förstår dig inte riktigt. Försök med t.ex. *"6x4m monter med L-form"* eller *"skapa en vepa med blå bakgrund"*.',
    'Hmm, det förstod jag inte. Skriv *"hjälp"* för att se vad jag kan göra!',
  ];

  if (/pris|kosta|hur\s*mycket|kostnad/.test(msg)) {
    return '💰 Prisfrågor hanteras av vårt team — kontakta oss för offert! Jag kan hjälpa dig designa montern.';
  }

  return pick(suggestions);
}

// Re-export för bekvämlighet
export { extractNumbers, pick };
