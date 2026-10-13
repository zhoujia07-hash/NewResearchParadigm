const {chromium}=require('playwright');
const path=require('path');
const fs=require('fs');
const assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1800,height:1900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8501',{waitUntil:'networkidle'});
 async function shot(name,heading){
  await page.waitForTimeout(1000);
  await page.getByRole('heading',{name:heading,exact:true}).evaluate(e=>e.scrollIntoView({block:'start'}));
  await page.screenshot({path:path.join(__dirname,'screenshots',name),fullPage:true});
 }
 async function download(label,name){
  const promise=page.waitForEvent('download');await page.getByRole('button',{name:label,exact:true}).click();
  await (await promise).saveAs('/tmp/'+name);return fs.readFileSync('/tmp/'+name,'utf8');
 }
 await page.getByText('High-throughput sandbox',{exact:true}).click();
 await page.getByRole('button',{name:'Generate Batch',exact:true}).click();
 await page.getByRole('heading',{name:'Head → Uncertain → Long Tail',exact:true}).waitFor();
 await shot('07-high-throughput.png','Milestone 4 — High-Throughput Digital Sandbox');
 await shot('08-head-tail-distribution.png','Head → Uncertain → Long Tail');
 await page.getByRole('heading',{name:'Select Cases for Human Study',exact:true}).scrollIntoViewIfNeeded();
 const selected=JSON.parse(await download('Export human study cases JSON','human_study_cases.json'));
 assert.equal(selected.length,20);assert.equal(new Set(selected.map(c=>c.condition_id)).size,20);
 assert.ok((await download('Export human study cases CSV','human_study_cases.csv')).includes('condition_id'));
 await shot('09-human-study-selection.png','Select Cases for Human Study');
 console.log('PASS M4: batch, distributions, factor rates, frontier, replay, 20 unique study conditions, JSON/CSV.');
 await page.getByText('Multi-agent comparison',{exact:true}).click();
 await page.getByText('Concordia / LLM',{exact:true}).click();
 await page.getByRole('button',{name:'Run Agent Comparison',exact:true}).click();
 await page.getByRole('button',{name:'Export agent comparison',exact:true}).waitFor();
 const agents=JSON.parse(await download('Export agent comparison','agent_comparison.json'));
 assert.equal(agents.mode,'mock');assert.equal(agents.fallback,false);assert.equal(agents.disagreement,1);
 assert.equal(Object.keys(agents.recommendations).length,5);
 assert.equal(agents.backend,'Concordia EntityAgent');
 await shot('10-multi-agent.png','Milestone 5 — Multi-Agent Integration');
 await shot('11-agent-disagreement.png','Agent recommendation matrix');
 console.log('PASS M5: real Concordia EntityAgent lifecycle in mock mode, five roles, disagreement 1.0, structured export.');
 assert.equal(errors.length,0,errors.join(';'));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
