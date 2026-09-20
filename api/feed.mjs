import { sources } from '../lib/sources.mjs';
import { downloadFeed, parseFeed } from '../lib/feed.mjs';

const cache = new Map();
const pending = new Map();
const TTL = 5 * 60 * 1000;

export async function getFeed(sourceId) {
  const source = sources.find(item => item.id === sourceId);
  if (!source) throw new Error("Unknown source ID.");
  return (await getFeedResult(source)).payload;
}

async function getFeedResult(source) {
    let value = cache.get(source.id);
    if (!value || Date.now() - value.cachedAt >= TTL) {
      if (!pending.has(source.id)) {
        const request = (async () => {
          const xml = await downloadFeed(source.url);
          const payload = { source, checkedAt: new Date().toISOString(), items: parseFeed(xml, source) };
          const result = { cachedAt: Date.now(), payload };
          cache.set(source.id, result);
          return result;
        })().finally(() => pending.delete(source.id));
        pending.set(source.id, request);
      }
      value = await pending.get(source.id);
    }
  return value;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // No Access-Control-Allow-Origin header: this API is same-origin only.
  res.setHeader('Cache-Control', 'no-store');
  const send = (status, body) => { res.statusCode = status; res.end(JSON.stringify(body)); };
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return send(405, { error: 'Only GET requests are supported.' }); }
  const params = new URL(req.url, 'https://quiet-signal.local').searchParams;
  const source = sources.find(item => item.id === params.get('source'));
  if (!source || params.getAll('source').length !== 1 || [...params.keys()].some(key => key !== 'source')) return send(400, { error: 'Choose a known source ID.', sourceIds: sources.map(item => item.id) });
  try {
    const value = await getFeedResult(source);
    const remaining = Math.max(0, Math.floor((TTL - (Date.now() - value.cachedAt)) / 1000));
    res.setHeader('Cache-Control', `public, max-age=${remaining}, s-maxage=${remaining}`);
    return send(200, value.payload);
  } catch (error) {
    const message = /^(?:Source returned|Source timed out|Feed |Source did not)/.test(error.message) ? error.message : 'Unable to reach this source. Please try again shortly.';
    return send(502, { source, checkedAt: new Date().toISOString(), items: [], error: message });
  }
}
