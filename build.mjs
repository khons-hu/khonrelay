import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import ts from 'typescript';
await mkdir('dist/lib',{recursive:true});
await mkdir('dist/.well-known',{recursive:true});
await copyFile('.well-known/assetlinks.json','dist/.well-known/assetlinks.json');
for(const file of ['index.html','theme.js','style.css','icon.svg','manifest.webmanifest','sw.js','relevance.json'])await copyFile(file,'dist/'+file);
for(const f of ['sources.mjs','rules.mjs','relevance.mjs'])await copyFile('lib/'+f,'dist/lib/'+f);
for(const name of ['app','core','i18n']){const text=await readFile(name+'.ts','utf8');await writeFile('dist/'+name+'.js',ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);}
console.log('Built dist/');
