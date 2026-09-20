import test from 'node:test';import assert from 'node:assert/strict';import{rankItems}from'../lib/relevance.mjs';
const now=Date.now(),items=[{id:'a',title:'A',summary:''},{id:'b',title:'B',summary:''},{id:'c',title:'C',summary:''}];
const snapshot={version:1,generatedAt:new Date(now).toISOString(),items:[{...items[0],score:.1},{...items[1],score:.9}]};
test('ranks scored and unscored items without hiding or mutating them',()=>{assert.deepEqual(rankItems(items,snapshot,now).map(x=>x.id),['b','c','a']);assert.equal(items[0].id,'a');});
test('missing, stale and malformed snapshots keep chronological order',()=>{for(const data of [null,{}, {...snapshot,generatedAt:'invalid'},{...snapshot,generatedAt:new Date(now-8*86400000).toISOString()}])assert.equal(rankItems(items,data,now),items);});
test('changed content and invalid scores are neutral',()=>{assert.deepEqual(rankItems(items,{...snapshot,items:[{...items[0],title:'old title',score:1},{...items[1],score:NaN}]},now),items);});
