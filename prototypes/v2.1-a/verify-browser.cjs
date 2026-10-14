/* Browser-only design validation and real WebGL preview capture. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:3010/';const here=__dirname;
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],requests=[];const p=await browser.newPage({viewport:{width:1600,height:1200}});
 function observe(page){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>requests.push(r.url()));}
 observe(p);await p.goto(base,{waitUntil:'networkidle'});const canvas=()=>p.locator('canvas[data-rendered=true]');await canvas().waitFor({timeout:30000});
 const people=()=>canvas().evaluate(c=>JSON.parse(c.dataset.people));const person=async()=> (await people()).find(a=>a.id==='R06');
 assert.deepEqual((await people()).map(a=>a.id),['R01','R02','R03','R04','R05','R06','R07','R08']);
 const uuids=(await people()).map(a=>a.uuid);
 assert.ok(await canvas().evaluate(c=>{const gl=c.getContext('webgl2'),bytes=new Uint8Array(4*40*40);gl.readPixels(c.width/2,c.height/2,40,40,gl.RGBA,gl.UNSIGNED_BYTE,bytes);return new Set(bytes).size>12;}));
 const shot=async name=>{fs.mkdirSync(path.join(here,'previews'),{recursive:true});await p.locator('.vp-stage').screenshot({path:path.join(here,'previews',name)});};
 await p.getByRole('button',{name:'Play visual sequence',exact:true}).click();await p.waitForTimeout(1500);
 const moved=(await person()).position;assert.notDeepEqual(moved,[0,0,9]);
 await p.getByRole('button',{name:'Pause visual sequence',exact:true}).click();await p.waitForTimeout(250);const frozen=(await people()).map(a=>a.position);
 await p.waitForTimeout(600);assert.deepEqual((await people()).map(a=>a.position),frozen);
 await p.getByRole('button',{name:/Stage B:/}).click();await p.waitForTimeout(1400);await shot('01-overview.png');
 assert.equal((await person()).state,'green');assert.equal(await canvas().getAttribute('data-blocked'),'false');
 await p.getByRole('button',{name:'Follow R06',exact:true}).click();await p.waitForTimeout(1400);await shot('02-follow-r06.png');
 assert.equal(await canvas().getAttribute('data-camera'),'follow');
 await p.getByRole('button',{name:/Stage C:/}).click();
 const scrub=p.getByRole('slider',{name:'Visual time',exact:true});await scrub.focus();for(let i=0;i<12;i++)await scrub.press('ArrowRight');await p.waitForTimeout(1400);await shot('03-uncertainty.png');assert.equal((await person()).state,'amber');
 const pausedTime=await canvas().getAttribute('data-time');await p.waitForTimeout(400);assert.equal(await canvas().getAttribute('data-time'),pausedTime);
 await p.getByRole('button',{name:/Stage D:/}).click();const backtrackStart=(await person()).position[0];
 await p.getByRole('button',{name:'Play visual sequence',exact:true}).click();await p.waitForTimeout(1200);assert.ok((await person()).position[0]<backtrackStart);
 await p.getByRole('button',{name:'Pause visual sequence',exact:true}).click();
 await p.getByRole('button',{name:/Stage F:/}).click();await p.waitForTimeout(1800);await shot('04-east-exit-blocked.png');
 assert.equal(await canvas().getAttribute('data-blocked'),'true');assert.equal((await person()).state,'red');assert.equal((await person()).walking,false);
 assert.deepEqual((await people()).map(a=>a.uuid),uuids,'Residents must remain the same scene objects across all stages.');
 await p.getByRole('button',{name:'Inspect R03',exact:true}).click();await p.getByRole('heading',{name:'Adult occupant',exact:true}).waitFor();
 await p.getByRole('button',{name:'Inspect R06',exact:true}).click();await p.getByRole('heading',{name:'Older adult',exact:true}).waitFor();
 await p.getByRole('button',{name:'Overview',exact:true}).click();await p.getByRole('button',{name:/Stage B:/}).click();
 for(const [variant,file] of [['medical-center','05-medical-center.png'],['care','06-care-facility.png']]){
  await p.getByRole('combobox',{name:'Environment variant',exact:true}).selectOption(variant);await p.waitForTimeout(1200);await shot(file);
  assert.deepEqual((await people()).map(a=>a.uuid),uuids);
 }
 await p.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await p.locator('main').getAttribute('data-stage'),'A');
 // Include previews with the portable runtime for a no-WebGL visual fallback.
 const outputs=[path.join(here,'browser/previews')];
 if(fs.existsSync(path.resolve(here,'../../showcase-web/package.json')))outputs.push(path.resolve(here,'../../showcase-web/public/visual-prototype/previews'));
 for(const output of outputs){fs.mkdirSync(output,{recursive:true});for(const f of fs.readdirSync(path.join(here,'previews')))if(f.endsWith('.png'))fs.copyFileSync(path.join(here,'previews',f),path.join(output,f));}
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});observe(mobile);
 await mobile.goto(base,{waitUntil:'networkidle'});await mobile.locator('canvas[data-rendered=true]').waitFor();
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await mobile.getByRole('button',{name:'Follow R06',exact:true}).tap();await mobile.waitForTimeout(300);
 const camera=await mobile.locator('canvas').getAttribute('data-camera-position');await mobile.waitForTimeout(500);assert.equal(await mobile.locator('canvas').getAttribute('data-camera-position'),camera);
 assert.equal(await mobile.locator('main').getAttribute('data-reduced-motion'),'true');
 // No-WebGL users still receive the locally captured design preview.
 const fallback=await browser.newPage();observe(fallback);await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args);};});
 await fallback.goto(base,{waitUntil:'networkidle'});await fallback.locator('.vp-no-webgl img').waitFor();assert.ok(await fallback.locator('.vp-no-webgl img').evaluate(img=>img.naturalWidth>0));
 assert.ok(requests.every(u=>u.startsWith(base)||u.startsWith('file:')||u.startsWith('data:')),'Unexpected external network dependency');assert.deepEqual(errors,[]);
 assert.equal(await p.evaluate(()=>localStorage.length+sessionStorage.length),0);
 console.log('PASS: actual rendered WebGL, eight persistent avatar objects, playback/pause/reset, green/amber/red, backtracking, dynamic blockage, cameras, profiles, three palettes, reduced-motion/mobile, static-host portability and no-WebGL preview; no browser errors or external requests.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
