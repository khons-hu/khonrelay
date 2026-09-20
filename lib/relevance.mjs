// Optional reading order only. Never used by Important or notification delivery.
export function rankItems(items, snapshot, now = Date.now()) {
  const time = Date.parse(snapshot?.generatedAt || '');
  if (snapshot?.version !== 1 || !Number.isFinite(time) || time > now + 60000 || now - time > 7 * 86400000 || !Array.isArray(snapshot.items)) return items;
  const scores = new Map(snapshot.items.filter(x => x && typeof x.id === 'string' && typeof x.title === 'string' && typeof x.summary === 'string' && Number.isFinite(x.score) && x.score >= 0 && x.score <= 1).map(x => [x.id, x]));
  const score = item => { const x = scores.get(item.id); return x && x.title === item.title && x.summary === item.summary ? x.score : 0.5; };
  return [...items].sort((a,b) => score(b)-score(a));
}
