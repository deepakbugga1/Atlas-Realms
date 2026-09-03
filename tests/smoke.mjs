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
page.on('pageerror', e => errors.push(String(e)));

const supabaseStub = `
window.supabase = {
  createClient() {
    const country = {id:'country-1', user_id:'user-1', country_name:'Test Realm', flag_emoji:'🜲', capital_region:'r1', region_ids:['r1'], treasury:1200, population:100000, food:500, iron:200, gold:100, oil:150, gems:20, military:100, score:100, turn_number:1, stability:80, production:100, infrastructure:20, education:20, healthcare:20, housing:20, buildings:{}, techs:[]};
    const regions = [
      {id:'r1',name:'Northgate',terrain:'Plains',climate:'Temperate',continent:'Aster',center_x:250,center_y:250,land_area_km2:1000,base_population:50000,resources:{food:20,iron:10,gold:5,oil:3},polygon:[[120,150],[300,140],[340,260],[210,300],[110,240]],borders:['r2']},
      {id:'r2',name:'Stonepass',terrain:'Mountains',climate:'Cold',continent:'Aster',center_x:520,center_y:270,land_area_km2:1200,base_population:30000,resources:{food:8,iron:25,gold:2,oil:1},polygon:[[340,180],[550,150],[620,280],[500,360],[340,300]],borders:['r1']}
    ];
    const countries = [country];
    function result(table){
      if(table==='regions') return {data:regions,error:null};
      if(table==='countries') return {data:countries,error:null};
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

await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', route => route.fulfill({status:200,contentType:'text/javascript',body:supabaseStub}));
await page.route(/\/functions\/v1\//, async route => {
  const body = JSON.parse(route.request().postData() || '{}');
  const payload = body.action === 'list_armies'
    ? {armies:[],country:{id:'country-1', user_id:'user-1', country_name:'Test Realm', flag_emoji:'🜲', capital_region:'r1', region_ids:['r1'], treasury:1200, population:100000, food:500, iron:200, gold:100, oil:150, gems:20, military:100, score:100, turn_number:1, stability:80, production:100, infrastructure:20, education:20, healthcare:20, housing:20, buildings:{}, techs:[]}}
    : {country:{id:'country-1',region_ids:['r1']},message:'ok'};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
});

await page.goto(`http://127.0.0.1:${port}/`, {waitUntil:'networkidle'});
await page.waitForSelector('.strategy-shell', {timeout:10000});
await page.waitForSelector('#strategyMap', {timeout:10000});
await page.waitForSelector('#strategyInspector', {timeout:10000});
await page.locator('#strategyMap .sp').first().click();
await page.locator('[data-layer2="terrain"]').click();
if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);

console.log('PASS: strategy shell mounted');
console.log('PASS: map and inspector rendered');
console.log('PASS: province selection and layer switching work');
console.log('PASS: no uncaught browser errors');

await browser.close();
server.close();
