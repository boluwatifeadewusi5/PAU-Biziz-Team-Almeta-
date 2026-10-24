import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import ts from 'typescript'
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
let signupCalls=0,loginCalls=0
const source=fs.readFileSync(new URL('../src/auth.ts',import.meta.url),'utf8').replace("import { createClient, type Session } from '@supabase/supabase-js'",'const createClient=globalThis.testClient').replaceAll('import.meta.env.VITE_SUPABASE_URL',"'https://test.invalid'").replaceAll('import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY',"'public-key'").replaceAll('import.meta.env.VITE_STUDENT_EMAIL_DOMAIN',"'pau.edu.ng'")
const context={exports:{},URL,fetch:async()=>({ok:true,json:async()=>({mailer_autoconfirm:false})}),window:{location:{origin:'https://pau-biziz.vercel.app'}},localStorage:{setItem(){},removeItem(){},getItem(){return null}},testClient:()=>({auth:{signUp:async()=>{signupCalls++;return {data:{session:null},error:null}},signInWithPassword:async()=>{loginCalls++;return {data:{session:null},error:null}}}})}
vm.runInNewContext(compile(source),context)
assert.equal(context.exports.isStudentEmail('Student@PAU.EDU.NG'),true)
for(const email of ['@pau.edu.ng','student space@pau.edu.ng','student@gmail.com','student@pau.edu.ng.fake','student@fakepau.edu.ng','student@pau.edu.ng@evil.com'])assert.equal(context.exports.isStudentEmail(email),false)
const invalid={...context,exports:{}};vm.runInNewContext(compile(source.replace("'https://test.invalid'","'[SENSITIVE]'")),invalid);assert.equal(invalid.exports.backendReady,false)
await assert.rejects(()=>context.exports.authenticate('signup','student@gmail.com','test-password'),/PAU|pau/);assert.equal(signupCalls,0)
await context.exports.authenticate('signup','student@pau.edu.ng','test-password','Student');assert.equal(signupCalls,1)
await context.exports.authenticate('login','bensagie4@gmail.com','test-password');assert.equal(loginCalls,1)
const errors={exports:{}};vm.runInNewContext(compile(fs.readFileSync(new URL('../src/authErrors.ts',import.meta.url),'utf8')),errors)
assert.match(errors.exports.authErrorMessage({code:'email_address_not_authorized'}),/sender/)
assert.match(errors.exports.authErrorMessage({status:429}),/limit/)
assert.match(errors.exports.authErrorMessage({code:'email_not_confirmed'}),/not confirmed/)
console.log('Passed: exact PAU domain, lookalike rejection before signup, existing Gmail admin login, and distinct sender/rate/confirmation errors.')
