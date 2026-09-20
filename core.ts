export type Item={id:string,title:string,url:string,summary:string,publishedAt:string|null,sourceId:string,sourceName:string};
export type Category='release'|'reset'|'incident'|'update';
export {classify} from './lib/rules.mjs';
export function safeUrl(value:string){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
export function mergeItems(items:Item[]){const seen=new Set<string>();return items.filter(i=>{const url=safeUrl(i.url);if(!url)return false;const u=new URL(url);u.hash='';for(const key of [...u.searchParams.keys()])if(key.startsWith('utm_'))u.searchParams.delete(key);const key=u.href;if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>(Date.parse(b.publishedAt||'')||0)-(Date.parse(a.publishedAt||'')||0));}
export function inQuietHours(hour:number,start:number,end:number){return start===end?false:start<end?hour>=start&&hour<end:hour>=start||hour<end;}
export function validItem(x:unknown):x is Item{if(!x||typeof x!=='object')return false;const i=x as Item;return ['id','title','url','summary','sourceId','sourceName'].every(k=>typeof (i as any)[k]==='string'&&(i as any)[k].length<12000)&&!!safeUrl(i.url)&&(i.publishedAt===null||typeof i.publishedAt==='string'&&Number.isFinite(Date.parse(i.publishedAt)));}
