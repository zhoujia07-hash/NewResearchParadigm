import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {mkdir,copyFile,writeFile,readFile,readdir,cp,access} from 'node:fs/promises';
const root=fileURLToPath(new URL('./',import.meta.url));
const require=createRequire(path.join(root,'package.json'));
const {build}=require('esbuild');
const output=path.join(root,'browser');
await mkdir(output,{recursive:true});
const result=await build({absWorkingDir:root,metafile:true,entryPoints:[path.join(root,'src/main.tsx')],outfile:path.join(output,'prototype.js'),
 bundle:true,minify:true,format:'iife',platform:'browser',target:['es2022'],jsx:'automatic',
 nodePaths:[path.join(root,'node_modules')],define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});
await copyFile(path.join(root,'src/prototype.css'),path.join(output,'prototype.css'));
await writeFile(path.join(output,'index.html'),'<!doctype html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect width=%2232%22 height=%2232%22 rx=%226%22 fill=%22%23254b50%22/%3E%3Cpath d=%22M8 24V8l16 16V8%22 stroke=%22%23cce9d5%22 stroke-width=%223%22 fill=%22none%22/%3E%3C/svg%3E"><title>New Research Paradigm · V2.1-A Visual Prototype</title><link rel="stylesheet" href="prototype.css"></head><body><div id="prototype-root"></div><script src="prototype.js" defer></script></body></html>\n');
console.log('Built standalone visual-only browser package: browser/');

const packages=new Map();
for(const name of Object.keys(result.metafile.inputs)){
 const full=path.resolve(root,name),marker=path.sep+'node_modules'+path.sep,index=full.lastIndexOf(marker);
 if(index<0)continue;const tail=full.slice(index+marker.length).split(path.sep);
 const id=tail[0].startsWith('@')?tail.slice(0,2).join('/'):tail[0];
 packages.set(id,full.slice(0,index+marker.length)+id);
}
let notices='V2.1-A browser runtime — third-party notices\n\nGeometry, choreography and UI are project-authored procedural prototype source.\nNo third-party character, building, image or font assets are redistributed.\n\n';
for(const [name,folder] of [...packages.entries()].sort()){
 const pkg=JSON.parse(await readFile(path.join(folder,'package.json'),'utf8'));
 notices+=`\n=== ${name} ${pkg.version} (${pkg.license||'see license text'}) ===\n`;
 const files=await readdir(folder);const license=files.find(n=>/^licen[sc]e(\.(md|txt))?$/i.test(n));
 notices+=license?await readFile(path.join(folder,license),'utf8'):'See bundled legal comments and package upstream license.';
 notices+='\n';
}
await writeFile(path.join(output,'THIRD_PARTY_LICENSES.txt'),notices);

try{await access(path.join(root,'previews'));await cp(path.join(root,'previews'),path.join(output,'previews'),{recursive:true});}catch{}
// Optional static mirror in the host repository. No application imports or integration.
const host=path.resolve(root,'../../showcase-web');
try{await access(path.join(host,'package.json'));await cp(output,path.join(host,'public/visual-prototype'),{recursive:true});console.log('Mirrored static files to the host public/visual-prototype folder.');}catch{}
