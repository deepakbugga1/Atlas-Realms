import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};

const server = createServer(async (req,res)=>{
  try {
    const path = normalize(new URL(req.url,'http://127.0.0.1').pathname);
    const file = path === '/' ? 'index.html' : path.slice(1);
    const body = await readFile(join(root,file));
    res.writeHead(200, {'content-type': mime[extname(file)] || 'text/plain'});
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});

await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const port = server.address().port;
const browser = await chromium.launch({headless:true});
const page = await browser.newPage();
const errors = [];
const failedRequests = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('requestfailed', request => failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'unknown failure'}`));

const supabaseStub = `
window.supabase = {
  createClient() {
    const country = {id:'country-1', user_id:'user-1', country_name:'Test Realm', flag_emoji:'🜲', capital_region:'r1', region_ids:['r1'], treasury:1200, population:100000, food:500, iron:200, gold:100, oil:150, gems:20, military:100, score:100, turn_number:1, stability:80, production:100, infrastructure:20, education:20, healthcare:20, housing:20, buildings:{}, techs:[]};
    const regions = [
      {id:'r1',name:'Northgate',terrain:'Plains',climate:'Temperate',continent:'Aster',center_x:250,center_y:250,land_area_km2:1000,base_population:50000,resources:{food:20,iron:10,gold:5,oil:3},polygon:[[120,150],[300,140],[340,260],[210,300],[110,240]],borders:['r2']},
      {id:'r2',name:'Stonepass',terrain:'Mountains',climate:'Cold',continent:'Aster',center_x:520,center_y:270,land_area_km2:1200,base_population:30000,resources:{food:8,iron:25,gold:2,oil:1},polygon:[[340,180],[550,150],[620,280],[500,360],[340,300]],borders:['r1']}
    ];
    function result(table){
      if(table==='regions') return {data:regions,error:null};
      if(table==='countries') return {data:[country],error:null};
      return {data:[],error:null};
    }
    function from(table){
      const chain={
        select(){ return chain; },
        order(){ return Promise.resolve(result(table)); },
        eq(){ return chain; },
        maybeSingle(){ return Promise.resolve({data:table==='countries'?country:null,error:null}); },
        then(resolve,reject){ return Promise.resolve(result(table)).then(resolve,reject); }
      };
      return chain;
    }
    const session = {access_token:'test-token',user:{id:'user-1',email:'test@example.com'}};
    return {
      from,
      auth:{
        async getSession(){return {data:{session}};},
        onAuthStateChange(callback){setTimeout(()=>callback('SIGNED_IN',session),0);return {data:{subscription:{unsubscribe(){}}}};},
        async signOut(){return {error:null};},
        async signInWithPassword(){return {error:null};},
        async signUp(){return {error:null};}
      }
    };
  }
};`;

await page.addInitScript({content: supabaseStub});
await page.route('**://cdn.jsdelivr.net/**', route => route.abort());
await page.route(/\/functions\/v1\//, async route => {
  const body = JSON.parse(route.request().postData() || '{}');
  const payload = body.action === 'list_armies'
    ? {armies:[],country:{id:'country-1', user_id:'user-1', country_name:'Test Realm', flag_emoji:'🜲', capital_region:'r1', region_ids:['r1'], treasury:1200, population:100000, food:500, iron:200, gold:100, oil:150, gems:20, military:100, score:100, turn_number:1, stability:80, production:100, infrastructure:20, education:20, healthcare:20, housing:20, buildings:{}, techs:[]}}
    : {country:{id:'country-1',region_ids:['r1']},message:'ok'};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
});

await page.goto(`http://127.0.0.1:${port}/`, {waitUntil:'networkidle'});
try {
  await page.waitForSelector('.strategy-shell', {timeout:10000});
  await page.waitForSelector('#strategyMap', {timeout:10000});
  await page.waitForSelector('#strategyInspector', {timeout:10000});
} catch (error) {
  const state = await page.evaluate(() => ({
    bodyText: document.body.innerText.slice(0, 1200),
    authHidden: document.querySelector('#authScreen')?.classList.contains('hidden'),
    foundHidden: document.querySelector('#foundScreen')?.classList.contains('hidden'),
    gameHidden: document.querySelector('#gameScreen')?.classList.contains('hidden'),
    strategyShellCount: document.querySelectorAll('.strategy-shell').length,
    strategyMapCount: document.querySelectorAll('#strategyMap').length,
    strategyInspectorCount: document.querySelectorAll('#strategyInspector').length
  }));
  throw new Error(`${error.message}\nUI state: ${JSON.stringify(state)}\nBrowser errors: ${errors.join(' | ') || 'none'}\nFailed requests: ${failedRequests.join(' | ') || 'none'}`);
}
await page.locator('#strategyMap .sp').first().click();
await page.locator('[data-layer2="terrain"]').click();
await page.locator('.strategy-shell').focus();
await page.keyboard.press('3');
if (await page.locator('[data-layer2="resources"]').evaluate(el => !el.classList.contains('active'))) {
  throw new Error('Keyboard layer shortcut did not activate resources layer');
}
await page.keyboard.press('m');
if (await page.locator('[data-layer2="military"]').evaluate(el => !el.classList.contains('active'))) {
  throw new Error('Military command shortcut did not activate military layer');
}
await page.keyboard.press('s');
if (await page.locator('#strategySearch').evaluate(el => document.activeElement !== el)) {
  throw new Error('Search shortcut did not focus the province search field');
}
await page.keyboard.press('0');
if (await page.locator('[data-layer2="political"]').evaluate(el => !el.classList.contains('active'))) {
  throw new Error('Political shortcut did not activate political layer');
}
await page.keyboard.press(']');
if (await page.locator('[data-layer2="terrain"]').evaluate(el => !el.classList.contains('active'))) {
  throw new Error('Next-layer shortcut did not cycle to terrain');
}
await page.keyboard.press('[');
if (await page.locator('[data-layer2="political"]').evaluate(el => !el.classList.contains('active'))) {
  throw new Error('Previous-layer shortcut did not cycle to political');
}
await page.keyboard.press('?');
if (!(await page.locator('.strategy-shortcuts').isHidden())) {
  throw new Error('Shortcut help toggle did not hide the help text');
}
await page.keyboard.press('?');
if (await page.locator('.strategy-shortcuts').isHidden()) {
  throw new Error('Shortcut help toggle did not restore the help text');
}
await page.keyboard.press('r');
await page.keyboard.press('+');
const zoom = await page.locator('#strategyViewport').getAttribute('data-zoom');
if (zoom !== '1.1') throw new Error(`Keyboard zoom shortcut did not update zoom: ${zoom}`);
await page.locator('[data-layer2="terrain"]').click();
const retainedZoom = await page.locator('#strategyViewport').getAttribute('data-zoom');
if (retainedZoom !== '1.1') throw new Error(`Layer switch did not retain zoom: ${retainedZoom}`);
const terrainPressed = await page.locator('[data-layer2="terrain"]').getAttribute('aria-pressed');
const politicalPressed = await page.locator('[data-layer2="political"]').getAttribute('aria-pressed');
if (terrainPressed !== 'true' || politicalPressed !== 'false') throw new Error(`Layer accessibility state incorrect: terrain=${terrainPressed}, political=${politicalPressed}`);
await page.keyboard.press('ArrowRight');
const status = await page.locator('.strategy-shortcut-status').textContent();
if (!status?.includes('Map panned')) throw new Error(`Arrow-key pan did not announce movement: ${status}`);
await page.keyboard.down('Control');
await page.keyboard.press('s');
await page.keyboard.up('Control');
if (await page.locator('#strategySearch').evaluate(el => document.activeElement !== el)) {
  throw new Error('Modified shortcut should not steal focus from the active control');
}
if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);
if (failedRequests.length) throw new Error(`Failed browser requests:\n${failedRequests.join('\n')}`);

console.log('PASS: strategy shell mounted');
console.log('PASS: map and inspector rendered');
console.log('PASS: province selection and layer switching work');
console.log('PASS: military command and search shortcuts work');
console.log('PASS: layer cycle, political shortcut, help toggle, reset, and zoom work');
console.log('PASS: zoom is retained across layer switches');
console.log('PASS: layer buttons expose accurate aria-pressed state');
console.log('PASS: keyboard map panning works');
console.log('PASS: modified shortcuts do not steal focus');
console.log('PASS: no uncaught browser errors');
console.log('PASS: no failed browser requests');

await browser.close();
server.close();
