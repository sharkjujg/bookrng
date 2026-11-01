// BookRNG badge rules. Each rule is a deterministic predicate over known fields: a value the catalog does not have never matches.
// test(m, poolDate) and evidence(m, poolDate) read the prepared member from prep().

export const RULESET = '2'; // 2: common band badges added so no record earns nothing

export const norm = (s) => s.normalize('NFKC').toLowerCase();

const tokens = (s) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)); // whitespace-separated words; bare punctuation is not a word
const list = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string') : []);
const year = (x) => (Number.isInteger(x) && x > 0 ? x : null);

export function prep(raw) {
  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : null;
  const born = year(raw.born), died = year(raw.died);
  return {
    ...raw,
    t: title ? norm(title) : null,
    authors: list(raw.authors), subjects: list(raw.subjects), shelves: list(raw.shelves),
    born, died: died !== null && born !== null && died >= born ? died : null, // a death before the birth is a data error: unknown
    lived: born !== null && died !== null && died >= born ? died - born : null,
    issuedYear: year(raw.issued), subj: list(raw.subjects).map(norm), loc: typeof raw.loc === 'string' ? raw.loc.toUpperCase() : null,
  };
}

const named = (m) => `"${m.title}"`;
const by = (m) => `${m.title} is by ${m.authors.join(' and ')}`;
const shelf = (name) => (m) => m.shelves.includes(name);
const topic = (re) => (m) => m.subj.some((s) => re.test(s));

export const RULES = [
  { id: 'one-word-title', name: 'One Word Title', family: 'Title shape', rule: 'Title is a single word', test: (m) => m.t !== null && tokens(m.t).length === 1, evidence: (m) => `${named(m)} is one word` },
  { id: 'long-title', name: 'Long Title', family: 'Title shape', rule: 'Title has ten or more words', test: (m) => m.t !== null && tokens(m.t).length >= 10, evidence: (m) => `${named(m)} has ${tokens(m.t).length} words` },
  { id: 'numbered-title', name: 'Numbered Title', family: 'Title numerals', rule: 'Title contains a digit 0-9', test: (m) => m.t !== null && /[0-9]/.test(m.t), evidence: (m) => `${named(m)} contains a digit` },
  { id: 'the-opening', name: 'The Opening', family: 'Title opening', rule: 'Title starts with "The"', test: (m) => m.t !== null && m.t.startsWith('the '), evidence: (m) => `${named(m)} opens with "The"` },
  { id: 'or-title', name: 'Or Title', family: 'Title punctuation', rule: 'Title has a ", Or," or "; Or," alternative title', test: (m) => m.t !== null && /[;,]\s*or,?\s/.test(m.t), evidence: (m) => `${named(m)} has an alternative title` },
  { id: 'co-authored', name: 'Co-Authored', family: 'Authors', rule: 'Two or more authors', test: (m) => m.authors.length >= 2, evidence: by },
  { id: 'author-crowd', name: 'Author Crowd', family: 'Authors', rule: 'Three or more authors', test: (m) => m.authors.length >= 3, evidence: by },
  { id: 'anonymous', name: 'Anonymous', family: 'Attribution', rule: 'The author is listed as Anonymous', test: (m) => m.authors.length > 0 && norm(m.authors[0]).startsWith('anonymous'), evidence: (m) => `${named(m)} is listed as anonymous` },
  { id: 'long-life', name: 'Long Life', family: 'Lifespan', rule: 'First author lived 85 years or more', test: (m) => m.lived !== null && m.lived >= 85, evidence: (m) => `${m.authors[0]} lived ${m.lived} years (${m.born}-${m.died})` },
  { id: 'short-life', name: 'Short Life', family: 'Lifespan', rule: 'First author lived 40 years or fewer', test: (m) => m.lived !== null && m.lived <= 40, evidence: (m) => `${m.authors[0]} lived ${m.lived} years (${m.born}-${m.died})` },
  { id: 'early-voice', name: 'Early Voice', family: 'Author era', rule: 'First author born before 1700', test: (m) => m.born !== null && m.born < 1700, evidence: (m) => `${m.authors[0]} was born in ${m.born}` },
  { id: 'nineteenth-century-born', name: 'Nineteenth-Century Born', family: 'Author era', rule: 'First author born from 1800 to 1899', test: (m) => m.born !== null && m.born >= 1800 && m.born <= 1899, evidence: (m) => `${m.authors[0]} was born in ${m.born}` },
  { id: 'eighteenth-century-born', name: 'Eighteenth-Century Born', family: 'Author era', rule: 'First author born from 1700 to 1799', test: (m) => m.born !== null && m.born >= 1700 && m.born <= 1799, evidence: (m) => `${m.authors[0]} was born in ${m.born}` },
  { id: 'modern-voice', name: 'Modern Voice', family: 'Author era', rule: 'First author born in 1870 or later', test: (m) => m.born !== null && m.born >= 1870, evidence: (m) => `${m.authors[0]} was born in ${m.born}` },
  { id: 'project-pioneer', name: 'Project Pioneer', family: 'Added to Gutenberg', rule: 'Added to Project Gutenberg in 1996 or earlier', test: (m) => m.issuedYear !== null && m.issuedYear <= 1996, evidence: (m) => `${named(m)} was added to Gutenberg in ${m.issuedYear}` },
  { id: 'recent-addition', name: 'Recent Addition', family: 'Added to Gutenberg', rule: 'Added to Project Gutenberg in 2020 or later', test: (m) => m.issuedYear !== null && m.issuedYear >= 2020, evidence: (m) => `${named(m)} was added to Gutenberg in ${m.issuedYear}` },
  { id: 'many-subjects', name: 'Many Subjects', family: 'Subjects', rule: 'Six or more subject headings', test: (m) => m.subjects.length >= 6, evidence: (m) => `${named(m)} has ${m.subjects.length} subject headings` },
  { id: 'fiction', name: 'Fiction', family: 'Form', rule: 'A subject heading mentions fiction', test: topic(/\bfiction\b/), evidence: (m) => `${named(m)} is catalogued as fiction` },
  { id: 'poetry', name: 'Poetry', family: 'Form', rule: 'A subject heading mentions poetry', test: topic(/\bpoetry\b/), evidence: (m) => `${named(m)} is catalogued as poetry` },
  { id: 'drama', name: 'Drama', family: 'Form', rule: 'A subject heading mentions drama', test: topic(/\bdrama\b/), evidence: (m) => `${named(m)} is catalogued as drama` },
  { id: 'juvenile', name: 'Juvenile', family: 'Audience', rule: 'A subject heading mentions juvenile literature', test: topic(/\bjuvenile\b/), evidence: (m) => `${named(m)} is catalogued as juvenile literature` },
  { id: 'science-fiction', name: 'Science Fiction', family: 'Speculative', rule: 'A subject heading mentions science fiction', test: topic(/science fiction/), evidence: (m) => `${named(m)} is catalogued as science fiction` },
  { id: 'nobel-shelf', name: 'Nobel Shelf', family: 'Nobel', rule: 'On the Nobel Prizes in Literature shelf', test: shelf('Nobel Prizes in Literature'), evidence: (m) => `${named(m)} sits on the Nobel Prizes in Literature shelf` },
  { id: 'banned-shelf', name: 'Banned Shelf', family: 'Banned', rule: 'On the Banned Books shelf', test: shelf("Banned Books from Anne Haight's list"), evidence: (m) => `${named(m)} sits on the Banned Books shelf` },
  { id: 'bestseller-shelf', name: 'Bestseller Shelf', family: 'Bestseller', rule: 'On the American Bestsellers 1895-1923 shelf', test: shelf('Bestsellers, American, 1895-1923'), evidence: (m) => `${named(m)} sits on the American Bestsellers shelf` },
  { id: 'harvard-shelf', name: 'Harvard Shelf', family: 'Harvard', rule: 'On the Harvard Classics shelf', test: shelf('Harvard Classics'), evidence: (m) => `${named(m)} sits on the Harvard Classics shelf` },
  { id: 'best-books-shelf', name: 'Best Books Shelf', family: 'Best Books', rule: 'On the Best Books Ever Listings shelf', test: shelf('Best Books Ever Listings'), evidence: (m) => `${named(m)} sits on the Best Books Ever shelf` },
  { id: 'shelf-collector', name: 'Shelf Collector', family: 'Shelf count', rule: 'On five or more shelves', test: (m) => m.shelves.length >= 5, evidence: (m) => `${named(m)} is on ${m.shelves.length} shelves` },
  { id: 'history-class', name: 'History Class', family: 'Library class', rule: 'Library of Congress class D, E or F (history)', test: (m) => m.loc !== null && 'DEF'.includes(m.loc), evidence: (m) => `${named(m)} is in LoC class ${m.loc}` },
  { id: 'philosophy-class', name: 'Philosophy Class', family: 'Library class', rule: 'Library of Congress class B (philosophy, psychology, religion)', test: (m) => m.loc === 'B', evidence: (m) => `${named(m)} is in LoC class B` },
  { id: 'science-class', name: 'Science Class', family: 'Library class', rule: 'Library of Congress class Q, R, S or T (science, medicine, agriculture, technology)', test: (m) => m.loc !== null && 'QRST'.includes(m.loc), evidence: (m) => `${named(m)} is in LoC class ${m.loc}` },
  { id: 'regular-addition', name: 'Regular Addition', family: 'Added to Gutenberg', rule: 'Added to Project Gutenberg from 1997 through 2019', test: (m) => m.issuedYear !== null && m.issuedYear >= 1997 && m.issuedYear <= 2019, evidence: (m) => `${named(m)} was added to Gutenberg in ${m.issuedYear}` },
];
