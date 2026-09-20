import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import ts from 'typescript';
await mkdir('dist/lib',{recursive:true});
for(const file of ['index.html','style.css','icon.svg','manifest.webmanifest','sw.js'])await copyFile(file,'dist/'+file);
for(const f of ['sources.mjs','rules.mjs'])await copyFile('lib/'+f,'dist/lib/'+f);
for(const name of ['app','core']){const text=await readFile(name+'.ts','utf8');await writeFile('dist/'+name+'.js',ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);}
console.log('Built dist/');
