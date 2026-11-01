// BookRNG fixtures for check.html: one row per case, [rule id, field overrides, expected match].
export const V = '2026-11-01';
export const base = { id: '1', title: 'A Sample Book', authors: ['Jane Doe'], born: 1850, died: 1920, issued: 2005, subjects: ['Sample -- Fiction'], shelves: ['Category: Novels'], loc: 'P', contributors: 0 };

export const cases = [
  ['one-word-title', { title: 'Emma' }, true], ['one-word-title', { title: 'Great Expectations' }, false], ['one-word-title', { title: '!!' }, false], ['one-word-title', { title: '  ' }, false], ['one-word-title', { title: undefined }, false],
  ['long-title', { title: 'one two three four five six seven eight nine ten' }, true], ['long-title', { title: 'one two three four five six seven eight nine' }, false],
  ['numbered-title', { title: 'Around the World in 80 Days' }, true], ['numbered-title', { title: 'Around the World' }, false], ['numbered-title', { title: 'فيلم ٣' }, false],
  ['the-opening', { title: 'The Time Machine' }, true], ['the-opening', { title: 'Theory of Games' }, false], ['the-opening', { title: 'A Tale of Two Cities' }, false], ['the-opening', { title: 'The' }, false], ['the-opening', { title: undefined }, false],
  ['or-title', { title: 'Moby Dick; Or, The Whale' }, true], ['or-title', { title: 'Frankenstein, or the Modern Prometheus' }, true], ['or-title', { title: 'Orlando' }, false], ['or-title', { title: 'The Door' }, false],
  ['co-authored', { authors: ['A', 'B'] }, true], ['co-authored', { authors: ['A'] }, false], ['co-authored', { authors: undefined }, false],
  ['author-crowd', { authors: ['A', 'B', 'C'] }, true], ['author-crowd', { authors: ['A', 'B'] }, false],
  ['anonymous', { authors: ['Anonymous'] }, true], ['anonymous', { authors: ['Anonymous', 'B'] }, true], ['anonymous', { authors: ['Jane Doe'] }, false], ['anonymous', { authors: [] }, false],
  ['long-life', { born: 1800, died: 1885 }, true], ['long-life', { born: 1800, died: 1884 }, false], ['long-life', { born: 1800, died: null }, false], ['long-life', { born: 1900, died: 1800 }, false],
  ['short-life', { born: 1800, died: 1840 }, true], ['short-life', { born: 1800, died: 1841 }, false], ['short-life', { born: null, died: 1841 }, false], ['short-life', { born: 1800, died: 1800 }, true],
  ['early-voice', { born: 1699 }, true], ['early-voice', { born: 1700 }, false], ['early-voice', { born: null }, false], ['early-voice', { born: 0 }, false],
  ['nineteenth-century-born', { born: 1800 }, true], ['nineteenth-century-born', { born: 1899 }, true], ['nineteenth-century-born', { born: 1799 }, false], ['nineteenth-century-born', { born: 1900 }, false],
  ['eighteenth-century-born', { born: 1700 }, true], ['eighteenth-century-born', { born: 1799 }, true], ['eighteenth-century-born', { born: 1699 }, false], ['eighteenth-century-born', { born: 1800 }, false],
  ['modern-voice', { born: 1870 }, true], ['modern-voice', { born: 1869 }, false], ['modern-voice', { born: null }, false],
  ['project-pioneer', { issued: 1996 }, true], ['project-pioneer', { issued: 1997 }, false], ['project-pioneer', { issued: null }, false], ['project-pioneer', { issued: 0 }, false],
  ['recent-addition', { issued: 2020 }, true], ['recent-addition', { issued: 2019 }, false],
  ['many-subjects', { subjects: ['a', 'b', 'c', 'd', 'e', 'f'] }, true], ['many-subjects', { subjects: ['a', 'b', 'c', 'd', 'e'] }, false], ['many-subjects', { subjects: undefined }, false],
  ['fiction', { subjects: ['England -- Social life -- Fiction'] }, true], ['fiction', { subjects: ['Science fiction'] }, true], ['fiction', { subjects: ['Fictional characters'] }, false], ['fiction', { subjects: [] }, false],
  ['poetry', { subjects: ['English poetry -- 19th century'] }, true], ['poetry', { subjects: ['Poets'] }, false],
  ['drama', { subjects: ['English drama -- 17th century'] }, true], ['drama', { subjects: ['Dramatists'] }, false],
  ['juvenile', { subjects: ['Adventure stories -- Juvenile fiction'] }, true], ['juvenile', { subjects: ['Fiction'] }, false],
  ['science-fiction', { subjects: ['Science fiction'] }, true], ['science-fiction', { subjects: ['Fiction'] }, false],
  ['nobel-shelf', { shelves: ['Nobel Prizes in Literature'] }, true], ['nobel-shelf', { shelves: ['Category: Novels'] }, false], ['nobel-shelf', { shelves: undefined }, false],
  ['banned-shelf', { shelves: ["Banned Books from Anne Haight's list"] }, true], ['banned-shelf', { shelves: [] }, false],
  ['bestseller-shelf', { shelves: ['Bestsellers, American, 1895-1923'] }, true], ['bestseller-shelf', { shelves: ['Bestsellers'] }, false],
  ['harvard-shelf', { shelves: ['Harvard Classics'] }, true], ['harvard-shelf', { shelves: ['Harvard'] }, false],
  ['best-books-shelf', { shelves: ['Best Books Ever Listings'] }, true], ['best-books-shelf', { shelves: ['Best Books'] }, false],
  ['shelf-collector', { shelves: ['a', 'b', 'c', 'd', 'e'] }, true], ['shelf-collector', { shelves: ['a', 'b', 'c', 'd'] }, false],
  ['history-class', { loc: 'D' }, true], ['history-class', { loc: 'F' }, true], ['history-class', { loc: 'd' }, true], ['history-class', { loc: 'P' }, false], ['history-class', { loc: null }, false],
  ['philosophy-class', { loc: 'B' }, true], ['philosophy-class', { loc: 'P' }, false],
  ['science-class', { loc: 'Q' }, true], ['science-class', { loc: 'T' }, true], ['science-class', { loc: 'P' }, false], ['science-class', { loc: undefined }, false],
];

export function poolChecks(raw, pool, ok) {
  const ms = raw.members;
  ok('book numbers are unique digit strings in ascending order', ms.every((m, i) => /^[1-9][0-9]*$/.test(m.id) && (i === 0 || +m.id > +ms[i - 1].id)));
  ok('every book has a title, an author, an added-to-Gutenberg year and a shelf', ms.every((m) => m.title && m.authors.length && Number.isInteger(m.issued) && m.issued >= 1971 && m.issued <= +raw.meta.capturedAt.slice(0, 4) && m.shelves.length));
  ok('authors are names, never bracketed roles', ms.every((m) => m.authors.every((a) => a && !/[\[\]]/.test(a))));
  ok('author lifespans are plausible when known', ms.every((m) => (m.born === null) === (m.died === null) && (m.born === null || (m.died >= m.born && m.died - m.born <= 120))));
  ok('no two books share a title and first author (editions are collapsed)', new Set(ms.map((m) => `${m.title.toLowerCase().replace(/\W+/g, ' ').trim()}|${m.authors[0].toLowerCase()}`)).size === pool.n);
  ok('every book is on at least one curated notable shelf', ms.every((m) => m.shelves.some((s) => ['Category: Classics of Literature', 'Best Books Ever Listings', 'Harvard Classics', 'Bestsellers, American, 1895-1923', "Banned Books from Anne Haight's list", 'Nobel Prizes in Literature'].includes(s))));
  ok('the pool is large enough to be a game (>= 1000)', pool.n >= 1000);
}
