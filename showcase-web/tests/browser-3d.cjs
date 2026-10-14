/* Production WebGL verification; real wall-clock story and actual rendered scene. */
const {chromium}=require('playwright');const assert=require('node:assert/strict');
const path=require('node:path');const fs=require('node:fs');
const base=process.env.SHOWCASE_URL||'http://127.0.0.1:3000';
const out=path.resolve(__dirname,'../../screenshots');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],requests=[];
 function observe(p){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('request',r=>requests.push(r.url()));}
 const context=await browser.newContext({viewport:{width:1440,height:1100}});
 const page=await context.newPage();observe(page);
 const state=stage=>page.locator(`main[data-stage=${stage}]`).waitFor({timeout:45000});
 const canvas=()=>page.locator('canvas[data-rendered=true][data-resident-count="8"]');
 const avatars=()=>canvas().evaluate(c=>JSON.parse(c.dataset.avatars));
 const r06=async()=> (await avatars()).find(a=>a.id==='R06');
 const scenePositions=async()=> (await avatars()).map(a=>a.position);
 const shot=async name=>{fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,name),fullPage:true});};
 await page.goto(base,{waitUntil:'networkidle'});await canvas().waitFor({timeout:30000});
 assert.equal(await page.getByRole('button',{name:'3D View',exact:true}).getAttribute('aria-pressed'),'true');
 assert.deepEqual((await avatars()).map(a=>a.id),['R01','R02','R03','R04','R05','R06','R07','R08']);
 // Inspect actual WebGL pixels; a canvas placeholder or empty framebuffer fails.
 assert.ok(await canvas().evaluate(c=>{const gl=c.getContext('webgl2');const bytes=new Uint8Array(4*32*32);gl.readPixels(c.width/2-16,c.height/2-16,32,32,gl.RGBA,gl.UNSIGNED_BYTE,bytes);return new Set(bytes).size>10;}));
 assert.equal(await canvas().getAttribute('data-hospital'),'true');
 const identities=(await avatars()).map(a=>a.uuid);
 await page.waitForTimeout(600);await shot('33-v2-1-b-integrated-overview.png');
 await page.getByRole('button',{name:'Select R02',exact:true}).click();
 const b=await canvas().boundingBox(),screen=(await r06()).screen;
 await page.mouse.click(b.x+(screen[0]+1)*b.width/2,b.y+(1-screen[1])*b.height/2);
 await page.locator('.profile-id').getByText('R06',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Follow R06',exact:true}).click();
 await page.locator('canvas[data-camera-mode=follow]').waitFor();await page.waitForTimeout(900);
 const following=await canvas().getAttribute('data-camera-position');
 await page.getByRole('button',{name:'Overview',exact:true}).click();await page.waitForTimeout(900);
 assert.notEqual(await canvas().getAttribute('data-camera-position'),following);
 await page.getByRole('button',{name:/Start 60-second Demo/}).click();await state('normal');
 const normal=await scenePositions();await page.waitForTimeout(700);assert.notDeepEqual(await scenePositions(),normal);
 assert.equal((await r06()).color,'green');await shot('34-v2-1-b-normal.png');
 await page.getByRole('button',{name:'Pause',exact:true}).click();await page.locator('main[data-paused=true]').waitFor();await page.waitForTimeout(200);
 const paused=await scenePositions();await page.waitForTimeout(700);assert.deepEqual(await scenePositions(),paused);
 await page.getByRole('button',{name:'Resume',exact:true}).click();
 console.log('PASS WebGL: rendered pixels, eight actual avatar groups, mesh selection, overview/follow and pause/resume.');
 await state('emerging');await page.waitForTimeout(1000);assert.equal((await r06()).color,'amber');
 await shot('35-v2-1-b-emerging-r06.png');
 // Observe two direction reversals / slower holds in the real-time visualization.
 let negativeRuns=0,negative=false,previous=(await r06()).position[0],held=0,looked=false;
 while(await page.locator('main').getAttribute('data-stage')==='emerging'){
  await page.waitForTimeout(150);const x=(await r06()).position[0],d=x-previous;previous=x;
  if(d<-.01&&!negative){negativeRuns++;negative=true;}else if(d>.01)negative=false;
  if(Math.abs(d)<.003)held++;if(Math.abs((await r06()).looking)>.1)looked=true;
 }
 assert.equal(negativeRuns,2);assert.ok(held>0);assert.ok(looked,'head looks around during emerging hesitation');
 await state('crisis');assert.equal((await r06()).color,'red');assert.equal(await canvas().getAttribute('data-blocked'),'true');
 const crisis=await scenePositions();await page.waitForTimeout(800);assert.deepEqual(await scenePositions(),crisis);
 await shot('36-v2-1-b-east-exit-blocked.png');
 await state('human');assert.deepEqual((await avatars()).map(a=>a.uuid),identities);await page.getByRole('heading',{name:'Choose the next step for R06.',exact:true}).waitFor();
 await shot('37-v2-1-b-human-takeover.png');
 await page.getByRole('button',{name:'Follow R06',exact:true}).click();await page.waitForTimeout(1100);await shot('38-v2-1-b-follow-r06.png');
 const gate=await scenePositions();await page.waitForTimeout(1000);await state('human');assert.deepEqual(await scenePositions(),gate);
 await page.getByRole('button',{name:'2D View',exact:true}).click();assert.equal(await page.locator('[data-resident=R06]').getAttribute('data-color'),'red');
 await page.locator('[data-node="East Exit"]').getByText('BLOCKED',{exact:true}).waitFor();await state('human');await shot('40-v2-1-b-2d-fallback.png');
 await page.getByRole('button',{name:'3D View',exact:true}).click();await canvas().waitFor();await state('human');
 await page.getByRole('radio',{name:/A Reroute to West Exit/}).check();
 const slider=page.getByRole('slider',{name:'Confidence',exact:true});await slider.focus();await slider.press('End');for(let i=0;i<15;i++)await slider.press('ArrowLeft');
 assert.equal(await slider.inputValue(),'85');await page.getByRole('button',{name:/Submit Human Decision/}).click();await state('recovery');
 await page.getByRole('button',{name:'Overview',exact:true}).click();
 await state('result');await page.getByText('SAFE: R06 reached the clear, accessible West Exit.',{exact:true}).waitFor();
 assert.deepEqual((await r06()).position,[-21.25,0,-.625]);await shot('39-v2-1-b-recovery-west-exit.png');
 assert.deepEqual(await page.locator('.report-numbers strong').allTextContents(),['40','39','1','97.5%']);
 await page.getByText('Viewer-selected decision · Confidence 85/100',{exact:true}).waitFor();
 await page.getByRole('button',{name:/^Reset/}).click();await state('idle');await canvas().waitFor();assert.equal((await r06()).color,'green');await page.waitForFunction(()=>{const c=document.querySelector('canvas[data-rendered=true]');const a=JSON.parse(c?.dataset.avatars||'[]');return a.length===8&&a.every(x=>x.bodyHeading===0);});
 console.log('PASS V1 story in 3D: amber/two reversals/hesitation, red/block/freeze, shared-state toggle, A/85 safe arrival and 40/39/1/97.5%.');
 const mobileContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const mobile=await mobileContext.newPage();observe(mobile);await mobile.goto(base,{waitUntil:'networkidle'});
 await mobile.locator('canvas[data-rendered=true]').waitFor({timeout:30000});await mobile.locator('main[data-reduced-motion=true]').waitFor();
 const overflow=async()=>assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await overflow();
 await mobile.getByRole('button',{name:'Select R06',exact:true}).tap();await mobile.getByRole('button',{name:'Follow R06',exact:true}).tap();
 await mobile.waitForTimeout(400);const fixed=await mobile.locator('canvas').getAttribute('data-camera-position');
 await mobile.waitForTimeout(500);assert.equal(await mobile.locator('canvas').getAttribute('data-camera-position'),fixed);
 await mobile.getByRole('button',{name:'Overview',exact:true}).tap();
 await mobile.screenshot({path:path.join(out,'41-v2-1-b-mobile.png'),fullPage:true});
 for(const c of ['B','C']){
  await mobile.getByRole('button',{name:'Skip to Human Takeover',exact:true}).tap();
  await mobile.locator('main[data-stage=human]').waitFor();await mobile.getByRole('radio',{name:c==='B'?/B Continue to East Exit/:/C Refuge Point/}).check();
  await mobile.getByRole('button',{name:/Submit Human Decision/}).click();await mobile.locator('main[data-stage=result]').waitFor({timeout:20000});
  const a=await mobile.locator('canvas').evaluate(c=>JSON.parse(c.dataset.avatars).find(a=>a.id==='R06'));
  assert.deepEqual(a.position,c==='B'?[16.875,0,-.625]:[8.75,0,8.125]);
  await mobile.getByText(c==='B'?'UNSAFE: R06 remains at the blocked East Exit approach.':'PENDING: R06 is at the refuge point; staff assistance requested; evacuation unconfirmed.',{exact:true}).waitFor();
  await overflow();await mobile.getByRole('button',{name:/^Reset/}).click();await mobile.locator('main[data-stage=idle]').waitFor();
 }
 // Forced lack of WebGL must still offer a fully functional shared-state 2D story.
 const fallback=await context.newPage();observe(fallback);await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args);};});
 await fallback.goto(base,{waitUntil:'networkidle'});await fallback.locator('.map-panel[data-view="2d"]').waitFor();
 assert.equal(await fallback.getByRole('button',{name:'3D View',exact:true}).isDisabled(),true);
 await fallback.getByRole('button',{name:'Skip to Human Takeover',exact:true}).click();await fallback.locator('main[data-stage=human]').waitFor();
 assert.equal(await fallback.locator('[data-resident=R06]').getAttribute('data-color'),'red');
 assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
 assert.ok(requests.every(u=>new URL(u).origin===new URL(base).origin),'external network dependency');assert.deepEqual(errors,[]);
 console.log('PASS mobile/reduced motion: 3D, fixed camera, B/C endpoints, reset, no overflow, no-WebGL fallback, no errors/storage/external requests.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
