import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import ts from 'typescript'

const source=fs.readFileSync(new URL('../src/database.ts',import.meta.url),'utf8')
 .replace("import { getSession } from './auth'",'const getSession = globalThis.testSession')
 .replaceAll('import.meta.env.VITE_SUPABASE_URL',"'https://test.invalid'")
 .replaceAll('import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY',"'public-test-key'")
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
const business={id:'my-business',name:'Test business',description:'Test description',category:'Other',whatsapp:'+2348000000000',logoUrl:''}
async function scenario(existing=[],session={access_token:'test-session',user:{id:'owner-1'}},saved=[{id:'saved-id'}]){
 const calls=[];const context={exports:{},testSession:async()=>session,fetch:async(url,options)=>{calls.push({url,...options});return {ok:true,json:async()=>options.method==='GET'?existing:saved}}}
 vm.runInNewContext(compiled,context)
 return {calls,save:context.exports.persistBusiness}
}
const create=await scenario();await create.save(business);assert.equal(create.calls.at(-1).method,'POST');assert.equal(JSON.parse(create.calls.at(-1).body).owner_id,'owner-1')
const existing=await scenario([{id:'existing-id'}]);await existing.save(business);assert.equal(existing.calls.at(-1).method,'PATCH');assert.ok(existing.calls.at(-1).url.endsWith('id=eq.existing-id'));assert.ok(existing.calls[0].url.includes('owner_id=eq.owner-1'))
const edit=await scenario();await edit.save({...business,id:'existing-id'});assert.equal(edit.calls.length,1);assert.equal(edit.calls[0].method,'PATCH');assert.equal('owner_id' in JSON.parse(edit.calls[0].body),false)
const unauthorized=await scenario([],null);await assert.rejects(()=>unauthorized.save(business),/log in/);assert.equal(unauthorized.calls.length,0)
const noSave=await scenario([],undefined,[]);await assert.rejects(()=>noSave.save(business),/No business was saved/)
const additional=await scenario();await additional.save({...business,name:'Second business'},{createNew:true});assert.equal(additional.calls.at(-1).method,'POST');assert.ok(additional.calls[0].url.includes('name=eq.Second%20business'));assert.equal(JSON.parse(additional.calls.at(-1).body).owner_id,'owner-1')
const duplicate=await scenario([{id:'already-owned'}]);await assert.rejects(()=>duplicate.save(business,{createNew:true}),/already own/);assert.equal(duplicate.calls.length,1)
console.log('Passed: create, update, duplicate prevention, signed-out rejection, empty-save error, additional business under the same owner, and duplicate-name rejection.')
