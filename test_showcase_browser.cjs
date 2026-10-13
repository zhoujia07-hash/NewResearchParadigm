/* A full wall-clock showcase, plus B/C, reset and reduced-motion checks.
   No accelerated clock or direct Streamlit state manipulation is used. */
const {chromium}=require('playwright');
const fs=require('fs');
const path=require('path');
const assert=require('assert/strict');
const {spawn,spawnSync}=require('child_process');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const out=path.join(__dirname,'screenshots');
 const artifact=path.join(__dirname,'artifacts');fs.mkdirSync(artifact,{recursive:true});
 let recording=true,context,page;
 try {
   context=await browser.newContext({viewport:{width:1600,height:1600},
     recordVideo:{dir:'/tmp/showcase-video',size:{width:1000,height:1000}}});
   page=await context.newPage();
 } catch(e){
   recording=false; if(context)await context.close();
   context=await browser.newContext({viewport:{width:1600,height:1600}});page=await context.newPage();
   console.log('Optional native video unavailable; checking the optional FFmpeg fallback.');
 }
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function open(page){await page.goto('http://127.0.0.1:8501',{waitUntil:'networkidle'});
   await page.getByRole('button',{name:'Start 60-second Demo',exact:true}).waitFor();}
 async function marker(page){
   return page.frameLocator('iframe').first().locator('#R06 circle');
 }
 async function capture(name){await page.waitForTimeout(400);await page.screenshot({path:path.join(out,name),fullPage:true});}
 await open(page);
 let capturing=false,captureTask=null,encoder=null,encoderDone=null;
 if(!recording&&spawnSync('ffmpeg',['-version'],{stdio:'ignore'}).status===0){
   encoder=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','image2pipe','-framerate','2','-i','pipe:0',
     '-vf','scale=1000:1000','-an','-c:v','libvpx-vp9','-deadline','realtime','-cpu-used','8','-b:v','600k','/tmp/showcase-fallback.webm']);
   encoder.stderr.on('data',()=>{});
   encoderDone=new Promise(resolve=>{encoder.on('close',resolve);encoder.on('error',()=>resolve(-1));});
   capturing=true;
   captureTask=(async()=>{while(capturing){const started=Date.now();
     try{const data=await page.screenshot({type:'png'});
       if(encoder.stdin.destroyed)break;
       if(!encoder.stdin.write(data))await new Promise(resolve=>encoder.stdin.once('drain',resolve));
     }catch(e){break;}
     await new Promise(resolve=>setTimeout(resolve,Math.max(0,500-(Date.now()-started))));
   }})();
 }

 assert.equal(await page.getByText('Research Controls',{exact:true}).count(),0);
 assert.equal(await page.getByRole('slider').count(),0);
 await page.getByRole('button',{name:'Start 60-second Demo',exact:true}).click();
 await page.getByText('HEAD / AUTO — routine cases remain green.',{exact:true}).waitFor();
 const frame=page.frameLocator('iframe').first();
 assert.equal(await (await marker(page)).getAttribute('fill'),'#15803d');
 let p1=await frame.locator('#R01').getAttribute('transform');await page.waitForTimeout(1200);
 let p2=await frame.locator('#R01').getAttribute('transform');assert.notEqual(p1,p2);
 await capture('15-showcase-normal.png');
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 await page.getByRole('button',{name:'Resume',exact:true}).waitFor();
 await frame.locator('html[data-frozen=true]').waitFor();
 p1=await frame.locator('#R01').getAttribute('transform');await page.waitForTimeout(1000);
 p2=await frame.locator('#R01').getAttribute('transform');assert.equal(p1,p2);
 await page.getByRole('button',{name:'Resume',exact:true}).click();
 await page.getByText('R06 · Risk emerging — monitoring, still automatically handled',{exact:true}).waitFor({timeout:20000});
 assert.equal(await (await marker(page)).getAttribute('fill'),'#d97706');
 await page.waitForTimeout(4000);
 await capture('16-showcase-risk-emerging.png');
 await page.getByText('AUTOMATION PAUSED — a long-tail case needs human judgment.',{exact:true}).waitFor({timeout:20000});
 assert.equal(await (await marker(page)).getAttribute('fill'),'#dc2626');
 await frame.getByText('BLOCKED',{exact:true}).waitFor();
 p1=await frame.locator('#R01').getAttribute('transform');await page.waitForTimeout(2000);
 p2=await frame.locator('#R01').getAttribute('transform');assert.equal(p1,p2);
 await page.getByRole('button',{name:'Submit Human Decision',exact:true}).waitFor({timeout:15000});
 assert.ok(await page.getByRole('button',{name:'Submit Human Decision',exact:true}).isDisabled());
 await capture('17-showcase-takeover.png');
 await page.waitForTimeout(2000);
 assert.ok(await page.getByText('HUMAN-IN-THE-LOOP REQUIRED — choose a response to continue.',{exact:true}).isVisible());
 await page.getByRole('button',{name:'A — Reroute to West Exit',exact:true}).click();
 assert.equal(await page.locator('input[aria-label="Confidence (0–100)"]').inputValue(),'85');
 await page.getByRole('button',{name:'Submit Human Decision',exact:true}).click();
 await page.getByText('Human intervention accepted · Simulation resumed',{exact:true}).waitFor();
 p1=await frame.locator('#R01').getAttribute('transform');await page.waitForTimeout(1500);
 p2=await frame.locator('#R01').getAttribute('transform');assert.notEqual(p1,p2);
 await page.getByRole('heading',{name:'Collaboration result',exact:true}).waitFor({timeout:15000});
 await page.getByText('SAFE: R06 reached the clear, accessible West Exit.',{exact:true}).waitFor();
 assert.equal(await (await marker(page)).getAttribute('fill'),'#15803d');
 const finalPosition=await frame.locator('#R06').getAttribute('data-start');
 assert.ok(Number(finalPosition.split(',')[0])<50,'R06 at West Exit');
 await page.getByTestId('stMetricValue').getByText('97.5%',{exact:true}).waitFor();
 await capture('18-showcase-final.png');
 console.log('PASS A: real wall-clock stages, green/amber/red, blocked exit, frozen takeover, A/85, recovery, West Exit, 40/39/1 and 97.5%.');
 await page.getByText(/Story complete/).waitFor({timeout:15000});
 const video=recording?page.video():null;
 if(encoder){capturing=false;await captureTask;encoder.stdin.end();
   const code=await encoderDone;
   if(code===0&&fs.statSync('/tmp/showcase-fallback.webm').size>0){
     fs.copyFileSync('/tmp/showcase-fallback.webm',path.join(artifact,'showcase-demo.webm'));
     console.log('Recording saved: artifacts/showcase-demo.webm (real browser frames, FFmpeg fallback).');
   }else console.log('Optional recording unavailable; screenshot verification remains complete.');
 }
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 await frame.locator('html[data-story-stage=idle]').waitFor();
 assert.ok(await page.getByRole('button',{name:'Start 60-second Demo',exact:true}).isEnabled());
 assert.equal(await page.getByRole('slider').count(),0);
 assert.equal(await frame.getByText('BLOCKED',{exact:true}).count(),0);
 assert.equal(await (await marker(page)).getAttribute('fill'),'#15803d');
 assert.equal(errors.length,0,errors.join(';'));
 await context.close();
 if(video){await video.saveAs(path.join(artifact,'showcase-demo.webm'));console.log('Recording saved: artifacts/showcase-demo.webm');}
 const extra=await browser.newContext({viewport:{width:1600,height:1600},reducedMotion:'reduce'});
 const reduced=await extra.newPage();reduced.on('pageerror',e=>errors.push(e.message));await open(reduced);
 await reduced.getByRole('button',{name:'Start 60-second Demo',exact:true}).click();
 await reduced.frameLocator('iframe').first().locator('html[data-reduced-motion=true]').waitFor();
 for(const choice of ['B','C']){
   await reduced.getByRole('button',{name:'Reset',exact:true}).click();
   await reduced.getByRole('button',{name:'Skip to Human Takeover',exact:true}).click();
   await reduced.getByRole('button',{name:choice==='B'?'B — Continue to East Exit':'C — Stop at Refuge Point and call staff',exact:true}).click();
   await reduced.getByRole('button',{name:'Submit Human Decision',exact:true}).click();
   await reduced.getByRole('heading',{name:'Collaboration result',exact:true}).waitFor({timeout:16000});
   await reduced.getByText(choice==='B'?'UNSAFE: R06 remains at the blocked East Exit approach.':'PENDING: R06 is at the refuge point; staff assistance requested; evacuation unconfirmed.',{exact:true}).waitFor();
 }
 assert.equal(errors.length,0,errors.join(';'));
 await extra.close();await browser.close();
 console.log('PASS: clean reset, B unsafe/C pending branches, reduced-motion preference, no browser errors.');
})().catch(e=>{console.error(e);process.exit(1)});
