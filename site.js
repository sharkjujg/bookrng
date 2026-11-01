// Everything specific to BookRNG: names, copy, card art, and which facts the result card shows. app.js is generic.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (n) => n.toLocaleString('en');
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
const NOTABLE = { 'Category: Classics of Literature': 'Classics of Literature', 'Best Books Ever Listings': 'Best Books Ever', 'Harvard Classics': 'Harvard Classics',
  'Bestsellers, American, 1895-1923': 'American Bestsellers 1895-1923', "Banned Books from Anne Haight's list": 'Banned Books', 'Nobel Prizes in Literature': 'Nobel Prizes in Literature' };
const LOC = { A: 'General works', B: 'Philosophy, psychology, religion', C: 'Auxiliary history', D: 'World history', E: 'History of the Americas', F: 'Local history of the Americas', G: 'Geography, recreation',
  H: 'Social sciences', J: 'Political science', K: 'Law', L: 'Education', M: 'Music', N: 'Fine arts', P: 'Language and literature', Q: 'Science', R: 'Medicine', S: 'Agriculture', T: 'Technology', U: 'Military science', V: 'Naval science', Z: 'Bibliography' };
const who = (m) => m.authors.join(', ');
const lived = (m) => (m.born !== null ? `${m.born}-${m.died}` : '');

// wrap a title onto at most four short lines for the cover
function wrap(title) {
  const lines = []; let cur = '';
  for (const w of title.split(/\s+/)) {
    if ((cur + ' ' + w).trim().length > 13 && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4).map((l, i, a) => (i === a.length - 1 && lines.length > 4 ? l.slice(0, 11) + '…' : l.length > 15 ? l.slice(0, 14) + '…' : l));
}

export default {
  key: 'bookrng',
  name: 'BookRNG',
  pageTitle: 'BookRNG: a daily book discovery game',
  noun: 'book', nouns: 'books', thing: 'Book',
  worldNote: 'every book ever written',
  repo: 'https://github.com/sharkjujg/bookrng',
  headline: 'Discover a book. Once a day.',
  intro: (n) => `Roll once to draw one book from a pool of <b>${fmt(n)}</b> classics you can read free at Project Gutenberg. Every book has the same 1-in-${fmt(n)} chance. Badges explain what is unusual about it, and rarer badges earn more rarity points (RP). The daily limit resets at 00:00 UTC.`,
  notice: 'Prototype: the book facts are real (Project Gutenberg catalog), but there are no covers or accounts yet, and your results are saved only in this browser. <a href="#/about">What that means</a>',
  header: (m) => ({ title: m.title, sub: `${who(m)}${lived(m) ? ` (${lived(m)})` : ''}` }),
  label: (m) => `${m.title} (${m.authors[0]})`,
  shelves: (m) => [
    ...m.authors.map((a) => ['Author', a]),
    ...m.shelves.filter((s) => NOTABLE[s]).map((s) => ['Curated shelf', NOTABLE[s]]),
    ...m.shelves.filter((s) => s.startsWith('Category: ') && !NOTABLE[s]).map((s) => ['Category', s.slice(10)]),
    ...(m.born !== null ? [['Author born', `${Math.floor(m.born / 100) * 100}s`]] : []),
    ['Added to Gutenberg', `${String(m.issued).slice(0, 3)}0s`],
    ...(m.loc ? [['Library class', LOC[m.loc] || `Class ${m.loc}`]] : []),
    ...[...new Set(m.subjects.map((s) => s.split(' -- ')[0].trim()).filter(Boolean))].slice(0, 6).map((s) => ['Subject', s]),
  ],
  facts: (m) => [
    ['Author' + (m.authors.length === 1 ? '' : 's'), who(m)], ['Author lived', lived(m) || 'not in the catalog'],
    ['Added to Project Gutenberg', String(m.issued)], ['Subjects', m.subjects.slice(0, 5).join('; ') || 'not in the catalog'],
    ['Library of Congress class', m.loc ? `${m.loc} (${LOC[m.loc] || 'other'})` : 'not in the catalog'],
    ['Curated shelves', m.shelves.filter((s) => NOTABLE[s]).map((s) => NOTABLE[s]).join('; ')],
    ['Source', 'Read it free at Project Gutenberg', `https://www.gutenberg.org/ebooks/${encodeURIComponent(m.id)}`],
  ],
  art(m) { // original cover: color from the book's number, text from its title; it never affects scoring and is not the real cover
    const hue = hash(m.id) % 360, lines = wrap(m.title), last = (m.authors[0].split(/\s+/).pop() || '').slice(0, 16);
    const text = lines.map((l, i) => `<text x="52" y="${34 + i * 11}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="8.5" fill="hsl(${hue} 60% 92%)">${esc(l)}</text>`).join('');
    return `<svg class="avatar" viewBox="0 0 100 140" role="img" aria-label="Generated cover for the book. Not the real cover.">
      <rect width="100" height="140" rx="5" fill="hsl(${hue} 45% 26%)"/><rect width="9" height="140" rx="3" fill="hsl(${hue} 50% 18%)"/>
      <rect x="15" y="9" width="78" height="122" fill="none" stroke="hsl(${hue} 55% 68%)" stroke-width="1"/><rect x="18" y="12" width="72" height="116" fill="none" stroke="hsl(${hue} 55% 68%)" stroke-width=".4"/>
      ${text}<path d="M30 ${44 + lines.length * 11} H74" stroke="hsl(${hue} 55% 68%)" stroke-width=".6"/>
      <text x="52" y="${58 + lines.length * 11}" text-anchor="middle" font-family="Georgia,serif" font-size="7.5" fill="hsl(${hue} 50% 80%)">${esc(last)}</text>
      <text x="52" y="122" text-anchor="middle" font-family="system-ui,sans-serif" font-size="4.6" letter-spacing=".6" fill="hsl(${hue} 30% 70%)">GENERATED COVER</text></svg>`;
  },
  poolNotice: 'Every book comes from the <a href="https://www.gutenberg.org/ebooks/offline_catalogs.html">Project Gutenberg catalog</a> (catalog data granted to the public domain), as a snapshot: English-language books that volunteers placed on a curated shelf (Classics of Literature, Best Books Ever, Harvard Classics, American Bestsellers 1895-1923, Banned Books, Nobel Prizes in Literature), with one entry per title and first author. A value the catalog lacks is unknown and never earns a badge. Odds describe this pool, which leans toward English-language, Western and older books: it says nothing about every book ever written.',
  poolExtra(pool) {
    const tally = (get) => { const c = new Map(); for (const m of pool.members) for (const v of get(m)) c.set(v, (c.get(v) || 0) + 1); return [...c]; };
    const table = (title, rows) => `<table><thead><tr><th>${title}</th><th class="n">Books</th></tr></thead><tbody>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="n">${fmt(v)}</td></tr>`).join('')}</tbody></table>`;
    const top = (rows, k) => rows.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, k);
    return `<h2>What is in the pool</h2><p class="small muted">Disclosed because a badge is only rare relative to this mix.</p>
      ${table('Curated shelf', top(tally((m) => m.shelves.filter((s) => NOTABLE[s]).map((s) => NOTABLE[s])), 6))}${table('Top authors', top(tally((m) => m.authors), 10))}${table('Author born', tally((m) => (m.born !== null ? [`${Math.floor(m.born / 100) * 100}s`] : [])).sort((a, b) => a[0].localeCompare(b[0])))}`;
  },
  aboutData: `<h2>Where the facts come from</h2>
    <p>Title, authors, author life years, subject headings, shelves, Library of Congress class and the year a book was added to Project Gutenberg come from Gutenberg's machine-readable catalog, which it grants to the public domain, fetched once as a snapshot. Only books that volunteers put on a curated notable shelf are included, and only one entry per title and first author, so extra editions do not multiply a book's chances. Editors, illustrators and translators are not counted as authors. <b>"Added to Gutenberg" is not the year a book was written or published.</b> Author years are shown only when the catalog gives both. There is no book text and no cover: the artwork is a generated cover, not the real one. The Read link goes to the book's page at Project Gutenberg.</p>`,
  terms: 'It is not affiliated with, sponsored or endorsed by Project Gutenberg or the Project Gutenberg Literary Archive Foundation. Catalog facts come from Gutenberg; any errors in the snapshot or in the badges are this prototype\'s. Badges describe catalog facts, not literary merit.',
};
