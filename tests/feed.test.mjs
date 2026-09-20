import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFeed, plainText, downloadFeed, MAX_BYTES } from '../lib/feed.mjs';
import handler from '../api/feed.mjs';

const source = { id: 'test', name: 'Test' };
const rss = items => `<rss version="2.0"><channel>${items}</channel></rss>`;
const item = (url = 'https://example.com/post', extras = '') => `<item><title>Hello &amp; goodbye</title><link>${url}</link>${extras}</item>`;

test('RSS extracts safe text, date, and source identity', () => {
  const [result] = parseFeed(rss(item(undefined, '<description><![CDATA[<p>Useful <b>news</b>.</p><script>alert(1)</script>]]></description><pubDate>Wed, 18 Sep 2024 12:00:00 GMT</pubDate>')), source);
  assert.equal(result.title, 'Hello & goodbye');
  assert.equal(result.summary, 'Useful news .');
  assert.equal(result.publishedAt, '2024-09-18T12:00:00.000Z');
  assert.equal(result.sourceId, 'test');
});
test('Atom chooses alternate HTML link over self and parses content', () => {
  const [result] = parseFeed('<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Release</title><link rel="self" href="https://example.com/feed"/><link rel="alternate" href="https://example.com/release"/><updated>2024-09-18T12:00:00Z</updated><content type="html">&lt;b&gt;Changes&lt;/b&gt;</content></entry></feed>', source);
  assert.equal(result.url, 'https://example.com/release');
  assert.equal(result.summary, 'Changes');
});
test('rejects malformed XML, unsupported roots, and entity directives', () => {
  for (const xml of ['<rss><channel></rss>', '<html/>', '<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss/>', '<!ENTITY x "bad"><rss/>']) assert.throws(() => parseFeed(xml, source));
});
test('drops malicious, credential-bearing, and non-HTTPS links', () => {
  const xml = rss(['javascript:alert(1)', 'http://example.com', 'https://user:secret@example.com', '/relative', 'data:text/plain,bad'].map(url => item(url)).join(''));
  assert.deepEqual(parseFeed(xml, source), []);
});
test('invalid dates become null and duplicate URLs are collapsed', () => {
  const items = parseFeed(rss(item(undefined, '<pubDate>not a date</pubDate>') + item()), source);
  assert.equal(items.length, 1);
  assert.equal(items[0].publishedAt, null);
});
test('caps items at 40 and handles empty feeds', () => {
  assert.equal(parseFeed(rss(Array.from({ length: 60 }, (_, i) => item(`https://example.com/${i}`)).join('')), source).length, 40);
  assert.deepEqual(parseFeed(rss(''), source), []);
  assert.throws(() => parseFeed('x'.repeat(MAX_BYTES + 1), source), /size limit/);
});
test('sanitizes and bounds text', () => {
  assert.equal(plainText('<style>bad</style><p>Hello&nbsp;world</p>'), 'Hello world');
  assert.equal(plainText('x'.repeat(1000)).length, 600);
  assert.equal(plainText('&lt;img src=x onerror=alert(1)&gt;Text'), 'Text');
});
test('download disables redirects and caps streamed bodies', async () => {
  await assert.rejects(downloadFeed('https://example.com', { fetchImpl: async (_url, options) => {
    assert.equal(options.redirect, 'error');
    return new Response('x'.repeat(MAX_BYTES + 1));
  } }), /size limit/);
});
test('handler rejects arbitrary URL and unsupported methods before fetching', async () => {
  for (const [method, url, status] of [['GET', '/api/feed?source=https://localhost', 400], ['GET', '/api/feed?source=openai&url=https://localhost', 400], ['POST', '/api/feed?source=openai', 405]]) {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(body) { this.body = JSON.parse(body); } };
    await handler({ method, url }, res);
    assert.equal(res.statusCode, status);
    assert.equal(res.headers['Access-Control-Allow-Origin'], undefined);
  }
});
