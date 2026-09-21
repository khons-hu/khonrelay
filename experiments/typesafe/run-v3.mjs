import {readFile,writeFile} from 'node:fs/promises';
import {questions,decide} from './policy-v3.mjs';
import {classify} from '../../lib/rules.mjs';
const dir=new URL('./',import.meta.url);
const read=async name=>JSON.parse(await readFile(new URL(name,dir)));
const key=process.env.TYPESAFE_API_KEY?.trim();
if(!key)throw new Error('Missing TYPESAFE_API_KEY');
const cases=await read('cases-v3.json');
if(cases.length>60)throw new Error('Max 60 calls');
const rows=[];
for(const item of cases){
 const start=performance.now();
 const response=await fetch('https://api.typesafe.ai/v1/systemone',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:'jev-1.13.0',state:{title:item.title,summary:item.summary,source:item.sourceName},questions}),signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(`HTTP ${response.status}; stopped, no automatic retry`);
 const d=await response.json();
 const action=decide(d.answers);
 if(!Number.isSafeInteger(d.usage?.input_tokens)||d.usage.input_tokens<0)throw new Error('Invalid usage');
 rows.push({id:item.id,title:item.title,set:item.set,expected:item.expected,action,baseline:classify(item).important?'notify':'show',answers:d.answers,model:d.model,usage:d.usage,ms:Math.round(performance.now()-start)});
 await writeFile(new URL('results-v3.json',dir),JSON.stringify(rows,null,2)+'\n');
 console.log(`${rows.length}/${cases.length} ${item.set}: ${action}`);
}
const summarize=rs=>({count:rs.length,agreement:rs.filter(r=>r.action===r.expected).length,baselineAgreement:rs.filter(r=>r.baseline===r.expected).length,expectedAlerts:rs.filter(r=>r.expected==='notify').length,correctAlerts:rs.filter(r=>r.expected==='notify'&&r.action==='notify').length,falseAlerts:rs.filter(r=>r.expected!=='notify'&&r.action==='notify').length,disagreements:rs.filter(r=>r.action!==r.expected).map(r=>({title:r.title,expected:r.expected,actual:r.action}))});
const lat=rows.map(r=>r.ms).sort((a,b)=>a-b),tokens=rows.reduce((s,r)=>s+r.usage.input_tokens,0);
const metrics={fresh:summarize(rows.filter(r=>r.set==='fresh')),diagnostic:summarize(rows.filter(r=>r.set==='diagnostic')),inputTokens:tokens,estimatedUSD:tokens*42/1e9,medianMs:lat[Math.floor(lat.length/2)],p95Ms:lat[Math.ceil(lat.length*.95)-1]};
await writeFile(new URL('metrics-v3.json',dir),JSON.stringify(metrics,null,2)+'\n');console.log(JSON.stringify(metrics,null,2));
