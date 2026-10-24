const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve('dist');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.ttf':'font/ttf','.png':'image/png','.svg':'image/svg+xml'};
const session = {success:true,user:'AuthTest',uid:4242,token:'service-token',clientId:'qcommunity',accountType:'qo',attributes:{score:0,frozen:false}};
(async () => {
 const browser = await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'darwin' ? 'chrome' : 'chromium'),headless:true});
 try {
  async function setup() {
   const page = await browser.newPage();
   const calls = [], errors = [];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://qoriginal.vip/**',async route=>{
    let file = path.resolve(root,'.'+new URL(route.request().url()).pathname);
    if (!file.startsWith(root+path.sep)) return route.abort();
    try { if (!(await fs.stat(file)).isFile()) file=path.join(root,'index.html'); }
    catch { file=path.join(root,'index.html'); }
    return route.fulfill({body:await fs.readFile(file),contentType:mime[path.extname(file)] || 'application/octet-stream'});
   });
   await page.route('https://api.qoriginal.vip/**',async route=>{
    const request=route.request(), url=new URL(request.url());
    const body=request.postDataJSON();
    calls.push({path:url.pathname,body});
    const json=(body,status=200)=>route.fulfill({status,json:body});
    if(url.pathname==='/qo/authorization/account')return json({username:'AuthTest',uid:4242,playtime:0});
    if(url.pathname==='/qo/game/login')return json({result:true,token:'central-credential'});
    if(url.pathname==='/qo/game/qq-login')return json({request_id:'request-1',code:'A1B2C3D4',expires_in:900},201);
    if(url.pathname==='/qo/game/qq-login/request-1')return json({status:'authorized',token:'qq-credential'});
    if(url.pathname==='/qo/auth/ticket/grant'){
     assert.ok(['Bearer central-credential','Bearer qq-credential'].includes(request.headers().authorization));
     const redirect=new URL(body.service);redirect.searchParams.set('ticket','ST-test');
     return json({result:true,redirectUrl:redirect.href});
    }
    if(url.pathname==='/qo/auth/serviceValidate')return body.ticket==='ST-invalid'?json({success:false,code:'INVALID_TICKET',message:'expired'},401):json(session);
    if(url.pathname==='/qo/auth/session/refresh')return json(session);
    return json({});
   });
   return {page,calls,errors};
  }
  {
   const {page,calls,errors}=await setup();
   await page.goto('https://qoriginal.vip/login?redirect=%2Fterms');
   await page.waitForURL(url=>url.pathname==='/cas');
   const service=new URL(page.url()).searchParams.get('service');
   assert.equal(new URL(service).pathname,'/login');
   assert.equal(new URL(service).searchParams.get('redirect'),'/terms');
   await page.locator('input[autocomplete=username]').fill('AuthTest');
   await page.locator('input[autocomplete=current-password]').fill('test-only');
   await page.locator('button[type=submit]').click();
   await page.waitForURL('https://qoriginal.vip/terms');
   assert.equal(await page.evaluate(()=>localStorage.getItem('token')),'service-token');
   assert.equal(await page.evaluate(()=>localStorage.getItem('qo.cas.token')),'central-credential');
   assert.equal(calls.filter(c=>c.path==='/qo/auth/serviceValidate').length,1);
   assert.equal(calls.find(c=>c.path==='/qo/auth/serviceValidate').body.service,service);
   assert.deepEqual(errors,[]);
   await page.close();
  }
  {
   const {page,calls,errors}=await setup();
   const callback='https://ai.qoriginal.vip/?view=builder#workspace';
   await page.route('https://ai.qoriginal.vip/**',route=>route.fulfill({contentType:'text/html',body:'Callback received'}));
   await page.goto('https://qoriginal.vip/cas?method=qq&service='+encodeURIComponent(callback));
   assert.equal(await page.locator('input[type=password]').count(),0);
   await page.locator('input[inputmode=numeric]').fill('12345678');
   await page.locator('button[type=submit]').click();
   await page.waitForURL(url=>url.hostname==='ai.qoriginal.vip');
   assert.equal(new URL(page.url()).searchParams.get('ticket'),'ST-test');
   assert.equal(new URL(page.url()).hash,'#workspace');
   assert.equal(calls.filter(c=>c.path==='/qo/game/login').length,0);
   assert.equal(calls.filter(c=>c.path==='/qo/auth/ticket/grant').length,1);
   await page.goto('https://qoriginal.vip/terms');
   assert.equal(await page.evaluate(()=>localStorage.getItem('token')),null);
   assert.equal(await page.evaluate(()=>localStorage.getItem('qo.cas.token')),'qq-credential');
   assert.deepEqual(errors,[]);
   await page.close();
  }
  {
   const {page,calls}=await setup();
   await page.addInitScript(()=>sessionStorage.setItem('qhub.cas.service','https://qoriginal.vip/login?redirect=%2Flogin&state=test-state'));
   await page.goto('https://qoriginal.vip/login?redirect=%2Flogin&state=test-state&ticket=ST-invalid');
   await page.getByText('expired',{exact:true}).waitFor();
   assert.equal(new URL(page.url()).searchParams.has('ticket'),false);
   assert.equal(await page.locator('input[type=password]').count(),0);
   await page.getByRole('button').click();
   await page.waitForURL(url=>url.pathname==='/cas');
   assert.equal(new URL(new URL(page.url()).searchParams.get('service')).searchParams.get('redirect'),'/');
   assert.equal(calls.filter(c=>c.path==='/qo/auth/serviceValidate').length,1);
   await page.close();
  }
  {
   const {page,calls,errors}=await setup();
   await page.addInitScript(()=>{localStorage.setItem('token','service-token');localStorage.setItem('qhub.auth.method','cas')});
   await page.goto('https://qoriginal.vip/login?redirect=%2Fterms');
   await page.waitForURL('https://qoriginal.vip/terms');
   assert.equal(calls.filter(c=>c.path==='/qo/auth/session/refresh').length,1);
   assert.equal(calls.filter(c=>c.path==='/qo/auth/ticket/grant').length,0);
   assert.equal(await page.locator('input[type=password]').count(),0);
   assert.deepEqual(errors,[]);
   await page.close();
  }
  {
   const {page,calls}=await setup();
   await page.route('https://api.qoriginal.vip/qo/auth/ticket/grant',route=>route.fulfill({status:503,json:{result:false,message:'Authorization unavailable'}}));
   await page.goto('https://qoriginal.vip/cas?service='+encodeURIComponent('https://ai.qoriginal.vip/'));
   await page.locator('input[autocomplete=username]').fill('AuthTest');
   await page.locator('input[autocomplete=current-password]').fill('test-only');
   await page.locator('button[type=submit]').click();
   await page.getByText('Authorization unavailable',{exact:true}).waitFor();
   assert.equal(new URL(page.url()).pathname,'/cas');
   assert.equal(await page.evaluate(()=>localStorage.getItem('token')),null);
   assert.equal(calls.filter(c=>c.path==='/qo/auth/serviceValidate').length,0);
   await page.screenshot({path:require('node:os').tmpdir()+'/qhub-cas-portal.png'});
   await page.close();
  }
  {
   const {page,calls}=await setup();
   await page.goto('https://qoriginal.vip/login?ticket=ST-unsolicited');
   await page.getByRole('button').waitFor();
   assert.equal(calls.filter(c=>c.path==='/qo/auth/serviceValidate').length,0);
   assert.equal(await page.evaluate(()=>localStorage.getItem('token')),null);
   await page.close();
  }
  for(const failure of [
   {status:401,body:{message:'Invalid token'}},
   {status:200,body:{error:1}},
   {status:200,body:{error:3}},
   {status:200,body:{code:'INVALID_TOKEN'}},
  ]) {
   const {page,errors}=await setup();
   await page.addInitScript(()=>{
    if(!sessionStorage.getItem('invalid-session-seeded')) {
     localStorage.setItem('token','expired-token');localStorage.setItem('username','AuthTest');
     localStorage.setItem('user','{}');localStorage.setItem('qhub.auth.method','cas');
     sessionStorage.setItem('invalid-session-seeded','1');
    }
    new MutationObserver(()=>{
     if(document.querySelector('.terms-review-dialog'))sessionStorage.setItem('terms-shown-before-login','1');
    }).observe(document,{childList:true,subtree:true});
   });
   let termsRequests=0;
   await page.route('https://qoriginal.vip/content/terms/**',route=>{termsRequests++;return route.fulfill({status:503,body:'Notice unavailable'});});
   await page.route('https://api.qoriginal.vip/qo/authorization/account',async route=>{
    await new Promise(resolve=>setTimeout(resolve,150));
    return route.fulfill({status:failure.status,json:failure.body});
   });
   await page.goto('https://qoriginal.vip/news/2026oct?tag=updates#latest');
   await page.waitForURL(url=>url.pathname==='/cas');
   await page.locator('input[autocomplete=username]').waitFor();
   assert.equal(await page.evaluate(()=>sessionStorage.getItem('terms-shown-before-login')),null);
   assert.deepEqual(await page.evaluate(()=>['token','username','user','qhub.auth.method'].map(key=>localStorage.getItem(key))),[null,null,null,null]);
   const service=new URL(new URL(page.url()).searchParams.get('service'));
   assert.equal(service.searchParams.get('redirect'),'/news/2026oct?tag=updates#latest');
   assert.equal(termsRequests,0,'Authentication fails before the notice is requested');
   assert.deepEqual(errors,[]);
   await page.close();
  }
  {
   const {page}=await setup();
   await page.addInitScript(()=>{localStorage.setItem('token','service-token');localStorage.setItem('username','AuthTest')});
   await page.route('https://api.qoriginal.vip/qo/authorization/account',route=>route.fulfill({status:503,json:{message:'unavailable'}}));
   await page.goto('https://qoriginal.vip/news/2026oct');
   await page.waitForLoadState('networkidle');
   assert.equal(new URL(page.url()).pathname,'/news/2026oct');
   assert.equal(await page.evaluate(()=>localStorage.getItem('token')),'service-token');
   assert.equal(await page.locator('.terms-review-dialog').count(),0,'An unverified session cannot open an agreement dialog');
   await page.close();
  }
  {
   const {page}=await setup();
   await page.addInitScript(()=>{
    if(!sessionStorage.getItem('valid-session-seeded')) {
     localStorage.setItem('token','service-token');localStorage.setItem('username','AuthTest');
     sessionStorage.setItem('valid-session-seeded','1');
    }
   });
   let release=false;const pending=[];
   const account={username:'AuthTest',uid:4242,playtime:0};
   await page.route('https://api.qoriginal.vip/qo/authorization/account',route=>{
    if(release)return route.fulfill({json:account});
    pending.push(route);
   });
   await page.goto('https://qoriginal.vip/news/2026oct');
   assert.equal(await page.locator('.terms-review-dialog').count(),0);
   release=true;
   for(const route of pending)await route.fulfill({json:account});
   await page.locator('.terms-review-dialog').waitFor();
   assert.equal(await page.evaluate(()=>localStorage.getItem('token')),'service-token');
   await page.locator('.terms-review-content').hover();
   await page.mouse.wheel(0,100000);
   await page.locator('.terms-review-checkbox input').check();
   await page.route('https://api.qoriginal.vip/qo/authorization/account',route=>route.fulfill({status:401,json:{message:'expired'}}));
   await page.locator('.terms-accept-button').click();
   await page.waitForURL(url=>url.pathname==='/cas');
   assert.equal(await page.evaluate(()=>localStorage.getItem('token')),null);
   assert.equal(await page.evaluate(()=>localStorage.getItem('qcommunity.terms.accepted.authtest')),null);
   await page.close();
  }
  console.log('PASS: QHub CAS-only entry, password/QQ portal ticket grant, callback isolation, expired ticket cleanup, invalid-session login redirects and auth-before-terms');
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
