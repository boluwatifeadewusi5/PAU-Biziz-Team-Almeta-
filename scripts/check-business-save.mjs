import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import ts from 'typescript'
const source=fs.readFileSync(new URL('../src/database.ts',import.meta.url),'utf8')
 .replace("import { getSession } from './auth'",'const getSession = globalThis.testSession')
 .replaceAll('import.meta.env.VITE_API_URL',"'http://api.test'")
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
function scenario(session={access_token:'test-session'},response={id:7,name:'Shop',category:'Tech'},ok=true){
 const calls=[],storage=new Map()
 const context={exports:{},testSession:async()=>session,crypto:{randomUUID:()=> 'browser-id'},localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},fetch:async(url,options)=>{calls.push({url,...options});return {ok,status:ok?200:422,json:async()=>response}}}
 vm.runInNewContext(compiled,context)
 return {calls,api:context.exports}
}
const b={id:'my-business',name:'Shop',description:'Campus shop',category:'Tech',whatsapp:'+2348000000000',logoUrl:''}
const create=scenario();const saved=await create.api.persistBusiness(b)
assert.equal(saved.id,'7');assert.equal(create.calls[0].method,'PUT');assert.equal(create.calls[0].url,'http://api.test/owner/business')
assert.equal(create.calls[0].headers.Authorization,'Bearer test-session');assert.equal(JSON.parse(create.calls[0].body).whatsapp_number,b.whatsapp)
const denied=scenario(null);await assert.rejects(()=>denied.api.persistBusiness(b),/log in/);assert.equal(denied.calls.length,0)
const p={title:'Offer',description:'Test offer',category:'Tech',imageUrl:'',price:'₦3,500',availability:'available'}
const publish=scenario(undefined,{id:10,business_id:7,price_label:'₦3,500',business_name:'Shop'});const post=await publish.api.persistPost(p)
assert.equal(post.businessId,'7');assert.equal(JSON.parse(publish.calls[0].body).price_amount,3500)
const invalid=scenario();await assert.rejects(()=>invalid.api.persistPost({...p,price:'negotiable'}),/price/);assert.equal(invalid.calls.length,0)
const free=scenario();await free.api.persistPost({...p,price:'0'});assert.equal(JSON.parse(free.calls[0].body).price_amount,0)
const contact=scenario();await contact.api.persistPost({...p,price:''});assert.equal(JSON.parse(contact.calls[0].body).price_mode,'contact')
const failure=scenario(undefined,{detail:[{loc:['body','name'],msg:'Required'}]},false);await assert.rejects(()=>failure.api.persistBusiness(b),/name: Required/)
const browser=scenario(null,{liked:true,likes:1});await browser.api.toggleLike('10');assert.equal(browser.calls[0].headers['x-client-id'],'browser-id')
console.log('Passed: business mapping, Supabase bearer header, signed-out rejection, NGN parsing, zero/contact pricing, validation errors and public likes.')
