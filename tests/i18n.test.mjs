import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,chooseLanguage,languages,setLanguage,t} from '../dist/i18n.js';
import {readFile} from 'node:fs/promises';
test('language resolution honors saved preference and browser locales with English fallback',()=>{
 assert.equal(chooseLanguage('hu',['sk-SK']),'hu');
 assert.equal(chooseLanguage(null,['fr-FR','cs-CZ']),'cs');
 assert.equal(chooseLanguage('invalid',['de-AT']),'de');
 assert.equal(chooseLanguage(null,['ja-JP']),'en');
});
test('every catalog entry covers every language and preserves interpolation',()=>{
 for(const [key,values] of Object.entries(catalog)) {
  assert.equal(values.length,6,key);
  for(const value of values){assert.ok(value.trim(),key);assert.deepEqual([...value.matchAll(/\{\w+\}/g)].map(x=>x[0]).sort(),[...key.matchAll(/\{\w+\}/g)].map(x=>x[0]).sort(),key);}
 }
 globalThis.document={documentElement:{lang:'en'}};
 for(const code of Object.keys(languages)){setLanguage(code);assert.equal(document.documentElement.lang,code);assert.ok(t('Sources'));assert.equal(t('Unknown source text'),'Unknown source text');assert.ok(t('{count} updates',{count:12}).includes('12'));}
});
test('static markers are cataloged and localization module is shipped and cached',async()=>{
 const html=await readFile('index.html','utf8');
 for(const match of html.matchAll(/data-i18n(?:-aria-label|-placeholder)?="([^"]+)"/g)){const key=match[1].replaceAll('&amp;','&');assert.ok(catalog[key],key);}
 assert.match(await readFile('dist/sw.js','utf8'),/\/i18n\.js/);
 assert.match(await readFile('dist/i18n.js','utf8'),/Slovenčina/);
});
test('every local script referenced by the page is present in the production build',async()=>{
 const html=await readFile('dist/index.html','utf8');
 for(const match of html.matchAll(/<script[^>]+src="\/(.*?)"/g))assert.ok((await readFile('dist/'+match[1],'utf8')).trim(),match[1]);
 assert.match(await readFile('dist/sw.js','utf8'),/\/motion\.js/);
});
