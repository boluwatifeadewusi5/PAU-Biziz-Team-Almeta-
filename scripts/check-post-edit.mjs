import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import ts from 'typescript'
const source=fs.readFileSync(new URL('../src/database.ts',import.meta.url),'utf8').replace("import { getSession } from './auth'",'const getSession = globalThis.testSession').replaceAll('import.meta.env.VITE_SUPABASE_URL',"'https://test.invalid'").replaceAll('import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY',"'public-test-key'")
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
const draft={title:'Updated offer',description:'New description',category:'Transport',imageUrl:'data:image/webp;base64,test',price:'',availability:'Unavailable'}
function setup(session,rows){const calls=[];const context={exports:{},testSession:async()=>session,fetch:async(url,options)=>{calls.push({url,...options});return {ok:true,json:async()=>rows}}};vm.runInNewContext(compiled,context);return {edit:context.exports.updatePost,calls}}
const signedOut=setup(null,[]);await assert.rejects(()=>signedOut.edit('post-id',draft),/log in/);assert.equal(signedOut.calls.length,0)
const denied=setup({access_token:'session'},[]);await assert.rejects(()=>denied.edit('post-id',draft),/owner/)
const saved=setup({access_token:'session'},[{id:'post-id'}]);await saved.edit('post-id',draft);assert.equal(saved.calls[0].method,'PATCH');assert.ok(saved.calls[0].url.endsWith('?id=eq.post-id'));const body=JSON.parse(saved.calls[0].body);assert.equal(body.image_url,draft.imageUrl);assert.equal(body.availability,'Unavailable');assert.equal(body.price,null);assert.ok(!('business_id' in body))
console.log('Passed: signed-out rejection, owner-policy empty-result rejection, and targeted post/image/availability update.')
