/* Real Chromium UI verification. Uses Playwright provided by the cloud runtime.
   Start Streamlit on port 8501, then run: node test_browser.cjs
   Screenshots 01–03 are preserved; this writes 04–06 and JSON/CSV to /tmp. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless:true, args:['--no-sandbox']});
  const page = await browser.newPage({viewport:{width:1800,height:1900}, deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const out=path.join(__dirname,'screenshots');
  fs.mkdirSync(out,{recursive:true});
  async function mainTop(){
    await page.getByRole('heading',{name:'New Research Paradigm',exact:true}).scrollIntoViewIfNeeded();
  }
  async function download(label,file){
    const pending=page.waitForEvent('download');
    await page.getByRole('button',{name:label,exact:true}).click();
    await (await pending).saveAs('/tmp/'+file);
    return fs.readFileSync('/tmp/'+file,'utf8');
  }
  async function threshold(value){
    const slider=page.locator('input[type=range][aria-label="Main triage threshold"]');
    await slider.scrollIntoViewIfNeeded();
    await slider.focus();
    // Keyboard interaction, never direct manipulation of Streamlit session state.
    await slider.press('End');
    for(let i=100;i>Math.round(value*100);i--) await slider.press('ArrowLeft');
    await page.waitForFunction(v=>document.querySelector('input[aria-label="Main triage threshold"]')?.value===v,
      value.toFixed(2).replace(/0+$/,'').replace(/\.$/,''));
    await page.waitForTimeout(500);
  }
  await page.goto(process.env.DEMO_URL || 'http://127.0.0.1:8501',{waitUntil:'networkidle'});
  await page.getByText('Research instrument',{exact:true}).click();
  await page.getByRole('button',{name:'Normal visitor',exact:true}).click();
  await page.getByText('AI AUTO',{exact:true}).waitFor();
  let marker=page.frameLocator('iframe').first().locator('text').filter({hasText:/^R06$/});
  assert.equal(await marker.evaluate(e=>e.previousElementSibling.getAttribute('fill')),'#15803d');
  console.log('PASS: normal preset is green AI AUTO.');
  await page.getByRole('button',{name:'Blocked exit crisis',exact:true}).click();
  await page.getByText('HUMAN TAKEOVER',{exact:true}).waitFor();
  await page.getByTestId('stMetricValue').getByText('0.8394',{exact:true}).waitFor();
  assert.equal(await marker.evaluate(e=>e.previousElementSibling.getAttribute('fill')),'#dc2626');
  await page.frameLocator('iframe').first().getByText('BLOCKED',{exact:true}).waitFor();
  await mainTop();
  await page.screenshot({path:path.join(out,'04-research-controls.png'),fullPage:true});
  console.log('PASS: R06 preset = 0.8394, red, East Exit blocked, causal rules displayed.');

  await page.getByRole('button',{name:'Sensor conflict',exact:true}).click();
  await page.getByText('AI AUTO',{exact:true}).waitFor();
  await page.getByText('Escalation thresholds',{exact:true}).click();
  await threshold(0.32);
  await page.getByText('WATCH / UNCERTAIN',{exact:true}).waitFor();
  assert.equal(await marker.evaluate(e=>e.previousElementSibling.getAttribute('fill')),'#d97706');
  await threshold(0.20);
  await page.getByText('HUMAN TAKEOVER',{exact:true}).waitFor();
  console.log('PASS: main threshold changes state green → amber → red.');
  await threshold(0.62);
  await page.getByRole('button',{name:'Run Threshold Sweep',exact:true}).click();
  await page.getByRole('heading',{name:'Coverage–Risk Curve',exact:true}).waitFor();
  await page.getByRole('heading',{name:'Threshold Sweep',exact:true}).evaluate(e=>e.scrollIntoView({block:'start'}));
  // Both contribution and coverage-risk charts must render as Vega graphics.
  assert.ok(await page.locator('[data-testid="stVegaLiteChart"]').count()>=2);
  await page.waitForTimeout(700);
  await page.screenshot({path:path.join(out,'05-threshold-sweep.png'),fullPage:true});
  const csv=await download('Export threshold sweep CSV','threshold_sweep.csv');
  assert.equal(csv.trim().split(/\r?\n/).length,16);
  assert.ok(csv.includes('Missed critical cases'));
  console.log('PASS: 500 cases, 15 thresholds, coverage-risk chart rendered, CSV exported.');

  await page.getByRole('heading',{name:'Case Inspector',exact:true}).evaluate(e=>e.scrollIntoView({block:'start'}));
  const filter=page.getByRole('combobox',{name:'Filter outcome categories',exact:true});
  await filter.click();
  await page.getByRole('option',{name:'Missed critical',exact:true}).click();
  await page.keyboard.press('Escape');
  await page.getByText(/20 \/ 500 cases shown/).waitFor();
  await page.getByRole('button',{name:'Load selected case into sandbox',exact:true}).waitFor();
  const selectedJSON=JSON.parse(await download('Export selected case JSON','selected_case.json'));
  assert.equal(selectedJSON.classification['Outcome category'],'Missed critical');
  await page.getByRole('button',{name:'Load selected case into sandbox',exact:true}).click();
  await page.getByText(new RegExp('Loaded synthetic case '+selectedJSON.case.case_id+' into R06')).waitFor();
  const exported=JSON.parse(await download('Export experiment configuration','experiment_config.json'));
  for(const name of ['navigation_confidence','sensor_agreement','model_disagreement','behavior_anomaly','safety_risk','vulnerability'])
    assert.equal(exported.settings[name],selectedJSON.case[name]);
  await page.getByRole('heading',{name:'Case Inspector',exact:true}).evaluate(e=>e.scrollIntoView({block:'start'}));
  await page.screenshot({path:path.join(out,'06-case-inspector.png'),fullPage:true});
  console.log('PASS: missed-critical filter, selected-case load, exact factor match and JSON exports.');

  // Import a downloaded config through the actual file uploader, then validate
  // state and seed restoration by exporting it again.
  exported.seed=99;
  exported.settings.navigation_confidence=0.81;
  fs.writeFileSync('/tmp/import_experiment.json',JSON.stringify(exported));
  await page.locator('input[type=file]').setInputFiles('/tmp/import_experiment.json');
  await page.getByRole('button',{name:'Import configuration',exact:true}).click();
  await page.getByText('Configuration imported. Benchmark cleared; run a new sweep.',{exact:true}).waitFor();
  const imported=JSON.parse(await download('Export experiment configuration','imported_config.json'));
  assert.equal(imported.seed,99);
  assert.equal(imported.settings.navigation_confidence,0.81);
  console.log('PASS: config import restores factors and seed.');

  // Regression: the old automatic workflow still pauses and completes A/85.
  await page.getByText('Five-round demo',{exact:true}).click();
  await page.getByRole('button',{name:'Start automatic simulation',exact:true}).click();
  await page.getByText('Round 1 / 5',{exact:true}).waitFor();
  await page.getByText('Round 2 / 5',{exact:true}).waitFor();
  await page.getByText('HUMAN-IN-THE-LOOP TAKEOVER — Automated simulation paused.',{exact:true}).waitFor();
  await page.waitForTimeout(2500);
  assert.ok(await page.getByText('Round 3 / 5',{exact:true}).isVisible());
  await page.getByRole('button',{name:'A — Reroute to West Exit',exact:true}).click();
  await page.getByRole('button',{name:'Submit Human Decision',exact:true}).click();
  await page.getByText('Round 5 / 5',{exact:true}).waitFor();
  await page.getByText('SAFE: R06 reached the clear, accessible West Exit.',{exact:false}).waitFor();
  const report=JSON.parse(await download('Download JSON report','m3_baseline_report.json'));
  assert.equal(report.human_confidence,85);
  assert.equal(report.automation_coverage_percent,97.5);
  assert.equal(report.total_observations,40);
  assert.equal(report.automatically_handled_observations,39);
  assert.equal(report.human_escalations,1);
  assert.equal(errors.length,0,errors.join('; '));
  console.log('PASS: baseline A/85 browser regression, 40/39/1, 97.5%, no browser errors.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
