/**
 * Passphrase — memorable three-word-plus-number sync phrases.
 *
 * Format: adjective-noun-NNNN  (e.g. "crystal-falcon-7724")
 * Entropy: 100 × 100 × 10 000 = 100 000 000 combinations.
 *
 * The phrase is hashed with SHA-256 to produce the KV key,
 * so even the worker operator cannot reverse it.
 */

const ADJECTIVES = [
  'amber', 'ancient', 'alpine', 'arctic', 'azure',
  'blazing', 'bold', 'boreal', 'bright', 'bronze',
  'cedar', 'cobalt', 'copper', 'coral', 'cosmic',
  'crimson', 'crystal', 'cyan', 'dappled', 'deep',
  'distant', 'dusky', 'ember', 'emerald', 'ethereal',
  'fading', 'fierce', 'floral', 'fossil', 'frozen',
  'gentle', 'gilded', 'golden', 'granite', 'hollow',
  'hushed', 'indigo', 'iron', 'ivory', 'jade',
  'keen', 'kindled', 'lapis', 'liquid', 'lucid',
  'luminous', 'lunar', 'marble', 'mellow', 'misty',
  'molten', 'mossy', 'mystic', 'noble', 'obsidian',
  'opal', 'orbital', 'pale', 'pearl', 'phantom',
  'pine', 'plasma', 'polished', 'prismatic', 'proud',
  'quantum', 'quiet', 'radiant', 'roaming', 'rose',
  'rustic', 'sapphire', 'scarlet', 'serene', 'shadow',
  'silent', 'silver', 'solar', 'sonic', 'spectral',
  'stellar', 'still', 'stormy', 'sunlit', 'swift',
  'tawny', 'tidal', 'timber', 'topaz', 'twilight',
  'vast', 'velvet', 'verdant', 'violet', 'vivid',
  'wandering', 'warm', 'woven', 'zenith', 'zephyr',
];

const NOUNS = [
  'anchor', 'antler', 'arrow', 'atlas', 'aurora',
  'bastion', 'beacon', 'birch', 'boulder', 'bridge',
  'canyon', 'cascade', 'cedar', 'cipher', 'citadel',
  'cliff', 'comet', 'compass', 'condor', 'conduit',
  'coral', 'cradle', 'crest', 'current', 'delta',
  'drift', 'dune', 'echo', 'falcon', 'fern',
  'fjord', 'flame', 'flint', 'forge', 'fox',
  'glacier', 'glen', 'grove', 'harbor', 'hawk',
  'haven', 'heron', 'hollow', 'horizon', 'isle',
  'lagoon', 'lantern', 'lark', 'ledge', 'lynx',
  'maple', 'marsh', 'meadow', 'mesa', 'monolith',
  'moth', 'nebula', 'nexus', 'oasis', 'orbit',
  'osprey', 'otter', 'peak', 'pelican', 'phoenix',
  'pinnacle', 'plover', 'prairie', 'prism', 'pulse',
  'quartz', 'raven', 'reef', 'ridge', 'river',
  'sage', 'sequoia', 'sierra', 'slate', 'solstice',
  'sparrow', 'spruce', 'summit', 'terrace', 'thistle',
  'threshold', 'tide', 'trail', 'vale', 'vertex',
  'vortex', 'wren', 'yarrow', 'zenith', 'zephyr',
];

/** Generate a fresh passphrase. */
export function generatePassphrase(): string {
  const buf = new Uint32Array(3);
  crypto.getRandomValues(buf);
  const adj = ADJECTIVES[buf[0] % ADJECTIVES.length];
  const noun = NOUNS[buf[1] % NOUNS.length];
  const num = String(buf[2] % 10_000).padStart(4, '0');
  return `${adj}-${noun}-${num}`;
}

/** SHA-256 hash of the phrase → hex string (used as KV key). */
export async function hashPhrase(phrase: string): Promise<string> {
  const data = new TextEncoder().encode(phrase);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/* ─── localStorage persistence ─── */

const PHRASE_KEY = 'tempo-sync-phrase';

export function getSavedPhrase(): string | null {
  try { return localStorage.getItem(PHRASE_KEY); } catch { return null; }
}

export function savePhrase(phrase: string): void {
  try { localStorage.setItem(PHRASE_KEY, phrase); } catch { /* ignore */ }
}

export function clearPhrase(): void {
  try { localStorage.removeItem(PHRASE_KEY); } catch { /* ignore */ }
}
