import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import ts from 'typescript'
const source=fs.readFileSync(new URL('../src/auth.ts',import.meta.url),'utf8')
 .replace("import { createClient, type Session } from '@supabase/supabase-js'",'const createClient=globalThis.testClient')
 .replaceAll('import.meta.env.VITE_SUPABASE_URL',"'https://test.invalid'")
 .replaceAll('import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY',"'public-key'")
 .replaceAll('import.meta.env.VITE_STUDENT_EMAIL_DOMAIN',"'pau.edu.ng'")
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
function setup({autoConfirm=false,verifyError=null,confirmed=true}={}){
 const calls=[],storage=new Map()
 const session={access_token:'private-test-token',user:{id:'student-id',email:'student@pau.edu.ng',email_confirmed_at:confirmed?'2026-10-24T00:00:00Z':null,user_metadata:{name:'PAU Student'}}}
 const context={exports:{},URL,window:{location:{origin:'https://test.invalid'}},localStorage:{setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k),getItem:k=>storage.get(k)||null},fetch:async()=>({ok:true,json:async()=>({mailer_autoconfirm:autoConfirm})}),testClient:()=>({auth:{signUp:async args=>{calls.push(['signup',args]);return {data:{session:null},error:null}},verifyOtp:async args=>{calls.push(['verify',args]);return {data:{session,user:session.user},error:verifyError}},resend:async args=>{calls.push(['resend',args]);return {error:null}},signOut:async()=>{calls.push(['signout'])}}})}
 vm.runInNewContext(compiled,context);return {api:context.exports,calls,storage}
}
const closed=setup({autoConfirm:true});await assert.rejects(()=>closed.api.authenticate('signup','student@pau.edu.ng','test-password','Student'),/being activated/);assert.equal(closed.calls.length,0)
const test=setup();await assert.rejects(()=>test.api.verifySignupOtp('student@gmail.com','123456'),/pau.edu.ng/);await assert.rejects(()=>test.api.resendSignupOtp('student@pau.edu.ng.evil','123456'),/pau.edu.ng/);await assert.rejects(()=>test.api.verifySignupOtp('student@pau.edu.ng','12ab56'),/code/);assert.equal(test.calls.length,0)
await test.api.verifySignupOtp('STUDENT@PAU.EDU.NG','123456');assert.equal(test.calls[0][1].email,'student@pau.edu.ng');assert.equal(test.calls[0][1].type,'email');assert.equal(test.api.currentUser().id,'student-id');assert.ok(!test.storage.get('biziz-session').includes('private-test-token'))
await test.api.resendSignupOtp('STUDENT@PAU.EDU.NG');assert.equal(test.calls.at(-1)[1].type,'signup');assert.equal(test.calls.at(-1)[1].email,'student@pau.edu.ng')
const expired=setup({verifyError:{code:'otp_expired',message:'Expired'}});await assert.rejects(()=>expired.api.verifySignupOtp('student@pau.edu.ng','123456'),e=>e.code==='otp_expired');assert.equal(expired.api.currentUser(),null)
const unconfirmed=setup({confirmed:false});await assert.rejects(()=>unconfirmed.api.verifySignupOtp('student@pau.edu.ng','123456'),/not completed/);assert.equal(unconfirmed.api.currentUser(),null)
console.log('Passed: fail-closed signup configuration, exact-domain OTP/resend, invalid and expired code rejection, verified session, and no duplicate token cache.')
