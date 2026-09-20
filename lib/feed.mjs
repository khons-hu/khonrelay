import { XMLParser, XMLValidator } from 'fast-xml-parser';

export const MAX_BYTES = 1_500_000;
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', parseTagValue: false, processEntities: true, trimValues: true });
const list = value => value == null ? [] : Array.isArray(value) ? value : [value];
const scalar = value => typeof value === 'string' ? value : typeof value === 'number' ? String(value) : value?.['#text'] || '';

export function plainText(value, limit = 600) {
  // Feed content remains text throughout the UI. Never insert this as HTML.
  return scalar(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:x[\da-f]+|\d+);/gi, entity => {
      const named = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ' };
      if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
      const code = entity[2].toLowerCase() === 'x' ? parseInt(entity.slice(3, -1), 16) : parseInt(entity.slice(2, -1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    })
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ').trim().slice(0, limit);
}

export function safeUrl(value) {
  try {
    const url = new URL(scalar(value));
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function parseFeed(xml, source) {
  if (typeof xml !== 'string' || Buffer.byteLength(xml) > MAX_BYTES) throw new Error('Feed exceeds the 1.5 MB size limit.');
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml)) throw new Error('Feed contains unsupported XML directives.');
  if (XMLValidator.validate(xml) !== true) throw new Error('Source returned malformed XML.');
  const document = parser.parse(xml);
  const atom = document.feed;
  const rss = document.rss?.channel;
  const isAtom = Object.hasOwn(document, 'feed');
  const isRss = document.rss != null && Object.hasOwn(document.rss, 'channel');
  if (!isAtom && !isRss) throw new Error('Source did not return an RSS or Atom feed.');
  const entries = list(isAtom ? atom?.entry : rss?.item);
  const seen = new Set();
  const items = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const link = isAtom ? list(entry.link).find(link => typeof link === 'object' && (!link['@_rel'] || link['@_rel'] === 'alternate'))?.['@_href'] : entry.link;
    const url = safeUrl(link);
    const title = plainText(entry.title, 240);
    if (!url || !title || seen.has(url)) continue;
    const date = scalar(entry.published || entry.pubDate || entry.updated || entry['dc:date']);
    const timestamp = date ? Date.parse(date) : NaN;
    items.push({ id: `${source.id}:${url}`, title, url, summary: plainText(entry.summary || entry.description || entry.content || entry['content:encoded']), publishedAt: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null, sourceId: source.id, sourceName: source.name });
    seen.add(url);
    if (items.length === 40) break;
  }
  return items;
}

export async function downloadFeed(url, { fetchImpl = fetch, timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { signal: controller.signal, redirect: 'error', headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml', 'User-Agent': 'QuietSignal/1.0' } });
    if (!response.ok) throw new Error(`Source returned HTTP ${response.status}.`);
    if (Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('Feed exceeds the 1.5 MB size limit.');
    if (!response.body) throw new Error('Source returned an empty response.');
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw new Error('Feed exceeds the 1.5 MB size limit.'); }
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks).toString('utf8');
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Source timed out after 8 seconds.');
    throw error;
  } finally { clearTimeout(timeout); }
}
