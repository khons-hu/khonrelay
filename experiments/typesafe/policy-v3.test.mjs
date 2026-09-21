import test from 'node:test';
import assert from 'node:assert/strict';
import {decide} from './policy-v3.mjs';
const answers=(r,i,s)=>Object.fromEntries(['relevant','impact','suppress'].map((k,n)=>[k,{type:'noul',noul:[r,i,s][n]}]));
test('irrelevant evidence is skipped even with high impact',()=>assert.equal(decide(answers(.1,1,0)),'skip'));
test('uncertainty does not recommend a notification',()=>assert.equal(decide(answers(.6,.9,0)),'show'));
test('resolved/prerelease suppression wins over impact',()=>assert.equal(decide(answers(1,1,.95)),'show'));
test('relevant clear impact can recommend notification',()=>assert.equal(decide(answers(.9,.9,.1)),'notify'));
test('invalid model answers fail closed',()=>{for(const x of [NaN,-1,2,undefined])assert.throws(()=>decide(answers(x,1,0)));assert.throws(()=>decide({}));});
