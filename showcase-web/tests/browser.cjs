/* Tests the production server, real clock and browser UI. No simulated time or state injection. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const base=process.env.SHOWCASE_URL||'http://127.0.0.1:3000';
const screenshots=path.resolve(__dirname,'../../screenshots');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const errors=[],requests=[];
  const context=await browser.newContext({viewport:{width:1440,height:1100}});
  function observe(page){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>requests.push(r.url()));}
  const page=await context.newPage();observe(page);
  const state=stage=>page.locator(`main[data-stage="${stage}"]`).waitFor({timeout:45000});
  const resident=id=>page.locator(`[data-resident="${id}"]`);
  const count=async()=>assert.equal(await page.locator('[data-resident]').count(),8);
  const transforms=()=>page.locator('[data-resident]').evaluateAll(els=>els.map(e=>e.getAttribute('transform')));
  const screenshot=async(name)=>{fs.mkdirSync(screenshots,{recursive:true});if(process.env.UPDATE_SCREENSHOTS!=='0') await page.screenshot({path:path.join(screenshots,name),fullPage:true});};
  await page.goto(base,{waitUntil:'networkidle'});await page.getByRole('button',{name:'2D View',exact:true}).click();await state('idle');await count();
  await page.getByRole('heading',{name:'New Research Paradigm',exact:true}).waitFor();
  await page.getByText('This is a simplified indoor navigation environment representing a large public building such as a hospital.',{exact:true}).waitFor();
  await resident('R02').click();await page.locator('.profile-id').getByText('R02',{exact:true}).waitFor();
  await resident('R06').focus();await page.locator('.profile-id').getByText('R06',{exact:true}).waitFor();
  await page.getByRole('button',{name:/Start 60-second Demo/}).click();await state('intro');await state('normal');
  const a=await transforms();await page.waitForTimeout(700);assert.notDeepEqual(await transforms(),a);
  await page.getByRole('button',{name:'Pause',exact:true}).click();await page.locator('main[data-paused=true]').waitFor();
  const paused=await transforms();await page.waitForTimeout(1000);assert.deepEqual(await transforms(),paused);
  await page.getByRole('button',{name:'Resume',exact:true}).click();
  await screenshot('19-vercel-showcase-normal.png');console.log('PASS desktop: landing, legend, persistent IDs, click/keyboard profiles, movement, pause/resume.');
  await state('emerging');await resident('R06').locator('circle').first().waitFor();assert.equal(await resident('R06').getAttribute('data-color'),'amber');
  await resident('R06').focus();const before=Number(await page.locator('[data-factor=navigationConfidence]').innerText());
  await page.waitForTimeout(3000);assert.ok(Number(await page.locator('[data-factor=navigationConfidence]').innerText())<before);
  await screenshot('20-vercel-showcase-emerging.png');console.log('PASS real clock: R06 amber, indicators gradually deteriorate.');
  await state('crisis');assert.equal(await resident('R06').getAttribute('data-color'),'red');
  await page.locator('[data-node="East Exit"]').getByText('BLOCKED',{exact:true}).waitFor();
  const crisis=await transforms();await page.waitForTimeout(1500);assert.deepEqual(await transforms(),crisis);
  await page.getByText('AUTOMATION PAUSED',{exact:true}).waitFor();
  await state('human');await page.getByRole('heading',{name:'Choose the next step for R06.',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:/Submit Human Decision/}).isDisabled(),true);
  const gate=await transforms();await page.waitForTimeout(2000);await state('human');assert.deepEqual(await transforms(),gate);
  await screenshot('21-vercel-showcase-takeover.png');
  await page.getByRole('radio',{name:/A Reroute to West Exit/}).check();
  const slider=page.getByRole('slider',{name:'Confidence',exact:true});await slider.focus();await slider.press('End');for(let i=0;i<15;i++)await slider.press('ArrowLeft');
  assert.equal(await slider.inputValue(),'85');await page.getByRole('button',{name:/Submit Human Decision/}).click();await state('recovery');
  const recovery=await transforms();await page.waitForTimeout(1000);assert.notDeepEqual(await transforms(),recovery);
  await state('result');assert.equal(await resident('R06').getAttribute('data-location'),'West Exit');
  assert.ok((await page.locator('.metrics strong').allTextContents()).some(v=>v.includes('COMPLETE')));
  await page.getByText('SAFE: R06 reached the clear, accessible West Exit.',{exact:true}).waitFor();
  assert.deepEqual(await page.locator('.report-numbers strong').allTextContents(),['40','39','1','97.5%']);
  await page.getByText('Viewer-selected decision · Confidence 85/100',{exact:true}).waitFor();
  await page.getByText('97.5% is a scripted prototype result, not a real-world automation estimate.',{exact:true}).waitFor();
  await screenshot('22-vercel-showcase-final.png');console.log('PASS real clock: red/block/freeze, indefinite judgment gate, A/85 recovery, West Exit and 40/39/1/97.5% report.');
  await page.getByRole('button',{name:/^Reset/}).click();await state('idle');await count();assert.equal(await page.locator('.report').count(),0);assert.equal(await resident('R06').getAttribute('data-color'),'green');
  const mobileContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const mobile=await mobileContext.newPage();observe(mobile);await mobile.goto(base,{waitUntil:'networkidle'});
  await mobile.getByRole('button',{name:'2D View',exact:true}).click();
  async function noOverflow(){assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');}
  await noOverflow();
  await mobile.locator('[data-resident=R02]').tap();await mobile.locator('.profile-id').getByText('R02',{exact:true}).waitFor();
  await mobile.locator('[data-resident=R06]').tap();await mobile.locator('.profile-id').getByText('R06',{exact:true}).waitFor();
  if(process.env.UPDATE_SCREENSHOTS!=='0') await mobile.screenshot({path:path.join(screenshots,'23-vercel-showcase-mobile.png'),fullPage:true});
  await mobile.getByRole('button',{name:'Skip to Human Takeover',exact:true}).click();
  await mobile.locator('main[data-stage=human][data-reduced-motion=true]').waitFor();await noOverflow();
  const markerBounds=await mobile.locator('[data-resident] circle:not(.selection-ring)').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,r:r.width/2};}));
  for(let i=0;i<markerBounds.length;i++)for(let j=i+1;j<markerBounds.length;j++){
    const a=markerBounds[i],b=markerBounds[j];assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>a.r+b.r,'Reduced-motion occupants must remain individually visible');
  }
  assert.equal(await mobile.locator('[data-resident=R06]').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  if(process.env.UPDATE_SCREENSHOTS!=='0') await mobile.screenshot({path:path.join(screenshots,'24-vercel-showcase-mobile-takeover.png'),fullPage:true});
  for(const c of ['B','C']){
    if(c==='C'){await mobile.getByRole('button',{name:/^Reset/}).click();await mobile.getByRole('button',{name:'Skip to Human Takeover',exact:true}).click();}
    await mobile.getByRole('radio',{name:c==='B'?/B Continue to East Exit/:/C Refuge Point/}).check();
    await mobile.getByRole('button',{name:/Submit Human Decision/}).click();
    await mobile.locator('main[data-stage=result]').waitFor({timeout:20000});
    await mobile.getByText(c==='B'?'UNSAFE: R06 remains at the blocked East Exit approach.':'PENDING: R06 is at the refuge point; staff assistance requested; evacuation unconfirmed.',{exact:true}).waitFor();
    assert.equal(await mobile.locator('[data-resident=R06]').getAttribute('data-location'),c==='B'?'East Corridor':'Refuge Point');await noOverflow();
  }
  await mobile.reload({waitUntil:'networkidle'});await mobile.locator('main[data-stage=idle]').waitFor();
  assert.equal(await mobile.locator('.report').count(),0);
  assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
  assert.ok(requests.every(u=>new URL(u).origin===new URL(base).origin),'unexpected external/backend request');
  assert.deepEqual(errors,[]);console.log('PASS mobile 390px: usable/no overflow, reduced motion, B/C consequences, reset; no browser errors, storage or external requests.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
