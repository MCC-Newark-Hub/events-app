const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function ratio(a, b) {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - levenshtein(a, b) / maxLen;
}

// Whole-string edit-distance ratio, plus a word-by-word best-alignment ratio
// (handles missing/extra middle names, swapped first/last name order, and typos).
export function nameSimilarity(query, candidateName) {
  const q = norm(query);
  const c = norm(candidateName);
  if (!q || !c) return 0;
  const wholeScore = ratio(q, c);
  const qWords = q.split(/\s+/).filter(Boolean);
  const cWords = c.split(/\s+/).filter(Boolean);
  let tokenScore = 0;
  if (qWords.length && cWords.length) {
    const perWord = qWords.map((qw) => Math.max(...cWords.map((cw) => ratio(qw, cw))));
    tokenScore = perWord.reduce((s, x) => s + x, 0) / perWord.length;
  }
  return Math.max(wholeScore, tokenScore);
}

export function findSimilarMembers(query, members, { limit = 5, threshold = 0.55, excludeIds = [] } = {}) {
  const q = norm(query);
  if (q.length < 2) return [];
  return (members || [])
    .filter((m) => !excludeIds.includes(m.id))
    .map((m) => ({ member: m, score: nameSimilarity(query, m.name) }))
    .filter((x) => x.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.member);
}
