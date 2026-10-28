import { Contact } from '../types';

/**
 * Standard Phone Dialpad T9 mapping (2: ABC, 3: DEF, etc.)
 */
const T9_MAP: Record<string, string> = {
  a: '2',
  b: '2',
  c: '2',
  d: '3',
  e: '3',
  f: '3',
  g: '4',
  h: '4',
  i: '4',
  j: '5',
  k: '5',
  l: '5',
  m: '6',
  n: '6',
  o: '6',
  p: '7',
  q: '7',
  r: '7',
  s: '7',
  t: '8',
  u: '8',
  v: '8',
  w: '9',
  x: '9',
  y: '9',
  z: '9',
};

export interface FuzzyMatchResult {
  matches: boolean;
  score: number;
  indices: number[];
}

export interface ScoredContact {
  contact: Contact;
  score: number;
  matchedField: 'name' | 'phone' | 'secondaryPhone' | 'relation' | 'email' | 't9';
  nameIndices: number[];
  phoneIndices: number[];
}

/**
 * High-performance subsequence and typo-tolerant fuzzy matching algorithm
 */
export function fuzzyMatchString(target: string, query: string): FuzzyMatchResult {
  if (!query) {
    return { matches: true, score: 0, indices: [] };
  }

  const tLower = target.toLowerCase();
  const qLower = query.toLowerCase().trim();

  if (!qLower) {
    return { matches: true, score: 0, indices: [] };
  }

  // 1. Exact match (top priority)
  if (tLower === qLower) {
    const indices = Array.from({ length: target.length }, (_, i) => i);
    return { matches: true, score: 1000, indices };
  }

  // 2. Exact prefix match
  if (tLower.startsWith(qLower)) {
    const indices = Array.from({ length: qLower.length }, (_, i) => i);
    return { matches: true, score: 800 + (100 / target.length), indices };
  }

  // 3. Word-boundary prefix match (e.g. "sharma" matching second word in "Dr. Sharma")
  const wordRegex = new RegExp(`\\b${escapeRegExp(qLower)}`, 'i');
  const wordMatch = target.match(wordRegex);
  if (wordMatch && wordMatch.index !== undefined) {
    const start = wordMatch.index;
    const indices = Array.from({ length: qLower.length }, (_, i) => start + i);
    return { matches: true, score: 700 + (100 / target.length), indices };
  }

  // 4. Contiguous substring match anywhere
  const subIdx = tLower.indexOf(qLower);
  if (subIdx !== -1) {
    const indices = Array.from({ length: qLower.length }, (_, i) => subIdx + i);
    return { matches: true, score: 600 - subIdx * 5, indices };
  }

  // 5. Acronym / Initials match (e.g. "DS" for "Dr. Sharma", "RP" for "Rovin Paul")
  const words = target.split(/[\s._-]+/).filter(Boolean);
  if (words.length > 1 && qLower.length <= words.length) {
    let acronym = '';
    const wordStartIndices: number[] = [];
    let curOffset = 0;
    words.forEach((w) => {
      const idxInTarget = target.indexOf(w, curOffset);
      if (idxInTarget !== -1) {
        acronym += w[0].toLowerCase();
        wordStartIndices.push(idxInTarget);
        curOffset = idxInTarget + w.length;
      }
    });

    if (acronym.startsWith(qLower)) {
      const indices = wordStartIndices.slice(0, qLower.length);
      return { matches: true, score: 550, indices };
    }
  }

  // 6. Subsequence Fuzzy Match (characters appear in order)
  let tIdx = 0;
  let qIdx = 0;
  const indices: number[] = [];
  let score = 250;
  let consecutiveMatches = 0;
  let prevMatchIdx = -2;

  while (tIdx < target.length && qIdx < qLower.length) {
    if (tLower[tIdx] === qLower[qIdx]) {
      indices.push(tIdx);

      // Bonus for consecutive matches
      if (tIdx === prevMatchIdx + 1) {
        consecutiveMatches++;
        score += 25 * consecutiveMatches;
      } else {
        consecutiveMatches = 0;
        // Small penalty for distance between matches
        score -= (tIdx - prevMatchIdx) * 2;
      }

      // Bonus for match at start of word or after delimiter
      if (tIdx === 0 || /[\s._-]/.test(target[tIdx - 1])) {
        score += 35;
      }

      prevMatchIdx = tIdx;
      qIdx++;
    }
    tIdx++;
  }

  if (qIdx === qLower.length) {
    return { matches: true, score: Math.max(score, 120), indices };
  }

  // 7. Typo-tolerant distance check for words of length >= 3
  if (qLower.length >= 3 && target.length >= 3) {
    // Check against individual words in target
    for (let w of words) {
      if (Math.abs(w.length - qLower.length) <= 2) {
        const dist = levenshteinDistance(w.toLowerCase(), qLower);
        const maxAllowedDist = qLower.length > 5 ? 2 : 1;
        if (dist <= maxAllowedDist) {
          const wStart = target.toLowerCase().indexOf(w.toLowerCase());
          const indices = Array.from({ length: w.length }, (_, i) => wStart + i);
          return { matches: true, score: 100 - dist * 30, indices };
        }
      }
    }
  }

  return { matches: false, score: 0, indices: [] };
}

/**
 * Fuzzy matches phone numbers, supporting clean digits, last-N-digits, and formatted numbers
 */
export function fuzzyMatchPhone(rawPhone: string, rawQuery: string): FuzzyMatchResult {
  if (!rawPhone || !rawQuery) {
    return { matches: false, score: 0, indices: [] };
  }

  // Strip non-digits
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const cleanQuery = rawQuery.replace(/\D/g, '');

  if (!cleanQuery) {
    return { matches: false, score: 0, indices: [] };
  }

  // Check if clean digits match
  if (cleanPhone === cleanQuery) {
    return { matches: true, score: 950, indices: mapCleanToOriginalIndices(rawPhone, 0, cleanQuery.length) };
  }

  // Suffix match (e.g. user typed last 4 or 5 digits of the phone number)
  if (cleanPhone.endsWith(cleanQuery)) {
    const startCleanIdx = cleanPhone.length - cleanQuery.length;
    return {
      matches: true,
      score: 850 + cleanQuery.length * 10,
      indices: mapCleanToOriginalIndices(rawPhone, startCleanIdx, cleanQuery.length),
    };
  }

  // Prefix match
  if (cleanPhone.startsWith(cleanQuery)) {
    return {
      matches: true,
      score: 800 + cleanQuery.length * 10,
      indices: mapCleanToOriginalIndices(rawPhone, 0, cleanQuery.length),
    };
  }

  // Contiguous substring match
  const idx = cleanPhone.indexOf(cleanQuery);
  if (idx !== -1) {
    return {
      matches: true,
      score: 650 + cleanQuery.length * 5 - idx * 5,
      indices: mapCleanToOriginalIndices(rawPhone, idx, cleanQuery.length),
    };
  }

  // Subsequence match on phone digits if query is >= 3 digits
  if (cleanQuery.length >= 3) {
    let pIdx = 0;
    let qIdx = 0;
    const cleanMatched: number[] = [];

    while (pIdx < cleanPhone.length && qIdx < cleanQuery.length) {
      if (cleanPhone[pIdx] === cleanQuery[qIdx]) {
        cleanMatched.push(pIdx);
        qIdx++;
      }
      pIdx++;
    }

    if (qIdx === cleanQuery.length) {
      // Map matched clean indices back to raw phone indices
      const rawIndices = mapSpecificCleanIndices(rawPhone, cleanMatched);
      return { matches: true, score: 300 + cleanQuery.length * 15, indices: rawIndices };
    }
  }

  return { matches: false, score: 0, indices: [] };
}

/**
 * T9 Dialpad Matcher: matches numeric query (e.g. "323") to name (e.g. "Dad")
 */
export function matchT9(name: string, digitQuery: string): FuzzyMatchResult {
  const cleanDigits = digitQuery.replace(/\D/g, '');
  if (!cleanDigits || cleanDigits.length < 2) {
    return { matches: false, score: 0, indices: [] };
  }

  // Convert name to T9 digit string
  const nameT9 = Array.from(name.toLowerCase())
    .map((char) => T9_MAP[char] || ' ')
    .join('');

  // Check prefix or word boundary
  const subIdx = nameT9.indexOf(cleanDigits);
  if (subIdx !== -1) {
    const indices = Array.from({ length: cleanDigits.length }, (_, i) => subIdx + i);
    return { matches: true, score: 750 - subIdx * 10, indices };
  }

  // Check words in name
  const words = name.toLowerCase().split(/\s+/);
  let curOffset = 0;
  for (const w of words) {
    const wT9 = Array.from(w)
      .map((c) => T9_MAP[c] || ' ')
      .join('');
    if (wT9.startsWith(cleanDigits)) {
      const startInName = name.toLowerCase().indexOf(w, curOffset);
      const indices = Array.from({ length: cleanDigits.length }, (_, i) => startInName + i);
      return { matches: true, score: 780, indices };
    }
    curOffset += w.length + 1;
  }

  return { matches: false, score: 0, indices: [] };
}

/**
 * Comprehensive real-time contact fuzzy search and ranker
 */
export function fuzzyFilterAndRankContacts(
  contacts: Contact[],
  query: string,
  categoryFilter: string = 'all'
): ScoredContact[] {
  const q = query.trim();

  // First apply category filter
  const categoryFiltered = contacts.filter((c) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'family') {
      const rel = (c.relation || '').toLowerCase();
      return (
        rel.includes('dad') ||
        rel.includes('father') ||
        rel.includes('mom') ||
        rel.includes('mother') ||
        rel.includes('brother') ||
        rel.includes('sister') ||
        rel.includes('family')
      );
    }
    if (categoryFilter === 'doctor') {
      return (
        (c.relation || '').toLowerCase().includes('doc') ||
        c.name.toLowerCase().includes('dr')
      );
    }
    if (categoryFilter === 'work') {
      const rel = (c.relation || '').toLowerCase();
      return (
        rel.includes('work') ||
        rel.includes('boss') ||
        rel.includes('colleague') ||
        rel.includes('manager') ||
        c.phoneType === 'work'
      );
    }
    return true;
  });

  if (!q) {
    return categoryFiltered.map((c) => ({
      contact: c,
      score: 1,
      matchedField: 'name',
      nameIndices: [],
      phoneIndices: [],
    }));
  }

  const scoredList: ScoredContact[] = [];
  const isDigitQuery = /^\d+$/.test(q.replace(/[\s+()-]/g, ''));

  for (const contact of categoryFiltered) {
    let bestScore = 0;
    let matchedField: ScoredContact['matchedField'] = 'name';
    let nameIndices: number[] = [];
    let phoneIndices: number[] = [];

    // 1. Name match
    const nameMatch = fuzzyMatchString(contact.name, q);
    if (nameMatch.matches && nameMatch.score > bestScore) {
      bestScore = nameMatch.score;
      matchedField = 'name';
      nameIndices = nameMatch.indices;
    }

    // 2. Primary Phone match
    const phoneMatch = fuzzyMatchPhone(contact.phone, q);
    if (phoneMatch.matches && phoneMatch.score > bestScore) {
      bestScore = phoneMatch.score;
      matchedField = 'phone';
      phoneIndices = phoneMatch.indices;
      nameIndices = [];
    }

    // 3. Secondary Phone match
    if (contact.secondaryPhone) {
      const secPhoneMatch = fuzzyMatchPhone(contact.secondaryPhone, q);
      if (secPhoneMatch.matches && secPhoneMatch.score > bestScore) {
        bestScore = secPhoneMatch.score;
        matchedField = 'secondaryPhone';
        phoneIndices = secPhoneMatch.indices;
        nameIndices = [];
      }
    }

    // 4. Relation / Role match
    if (contact.relation) {
      const relMatch = fuzzyMatchString(contact.relation, q);
      if (relMatch.matches && relMatch.score > bestScore) {
        bestScore = relMatch.score;
        matchedField = 'relation';
      }
    }

    // 5. Email match
    if (contact.email) {
      const emailMatch = fuzzyMatchString(contact.email, q);
      if (emailMatch.matches && emailMatch.score > bestScore) {
        bestScore = emailMatch.score;
        matchedField = 'email';
      }
    }

    // 6. Notes match
    if (contact.notes) {
      const notesMatch = fuzzyMatchString(contact.notes, q);
      if (notesMatch.matches && notesMatch.score * 0.7 > bestScore) {
        bestScore = notesMatch.score * 0.7;
        matchedField = 'relation';
      }
    }

    // 7. T9 Dialpad match (if query has digits e.g. "323" -> Dad)
    if (isDigitQuery) {
      const t9Result = matchT9(contact.name, q);
      if (t9Result.matches && t9Result.score > bestScore) {
        bestScore = t9Result.score;
        matchedField = 't9';
        nameIndices = t9Result.indices;
      }
    }

    if (bestScore > 0) {
      scoredList.push({
        contact,
        score: bestScore,
        matchedField,
        nameIndices,
        phoneIndices,
      });
    }
  }

  // Sort descending by relevance score
  return scoredList.sort((a, b) => b.score - a.score);
}

// Helpers
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[m][n];
}

function mapCleanToOriginalIndices(original: string, startClean: number, lengthClean: number): number[] {
  let cleanCount = 0;
  const result: number[] = [];

  for (let i = 0; i < original.length; i++) {
    if (/\d/.test(original[i])) {
      if (cleanCount >= startClean && cleanCount < startClean + lengthClean) {
        result.push(i);
      }
      cleanCount++;
    }
  }

  return result;
}

function mapSpecificCleanIndices(original: string, cleanIndices: number[]): number[] {
  const set = new Set(cleanIndices);
  let cleanCount = 0;
  const result: number[] = [];

  for (let i = 0; i < original.length; i++) {
    if (/\d/.test(original[i])) {
      if (set.has(cleanCount)) {
        result.push(i);
      }
      cleanCount++;
    }
  }

  return result;
}
