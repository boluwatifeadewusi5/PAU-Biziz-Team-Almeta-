import { createClient, type Session } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
export const studentEmailDomain=(import.meta.env.VITE_STUDENT_EMAIL_DOMAIN||'pau.edu.ng').trim().toLowerCase().replace(/^@/,'')
export function isStudentEmail(email:string){const normalized=email.trim().toLowerCase();return /^[^\s@]+@[^\s@]+$/.test(normalized)&&normalized.split('@')[1]===studentEmailDomain}
function validBackendUrl(value:string|undefined){try{return Boolean(value)&&['http:','https:'].includes(new URL(value!).protocol)}catch{return false}}
export const backendReady = Boolean(validBackendUrl(url) && key && key!=='[SENSITIVE]')
export const supabase = backendReady ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' } }) : null
let activeSession: Session | null = null
export function storeSession(session: Session | null) {
 activeSession = session
 if (session) localStorage.setItem('biziz-session', JSON.stringify({user:{id:session.user.id}}))
 else localStorage.removeItem('biziz-session')
}
export async function getSession() {
 if (!supabase) return null
 const { data, error } = await supabase.auth.getSession()
 if (error) throw error
 storeSession(data.session)
 return data.session
}
export function currentUser(): {id:string;name:string;email:string;role:string} | null {
 const user = activeSession?.user
 return user ? {id:user.id,name:user.user_metadata?.name || 'PAU student',email:user.email || '',role:user.user_metadata?.role || localStorage.getItem('biziz-signup-role') || 'student'} : null
}
export function accountDestination() { if(currentUser()?.email.toLowerCase()==='bensagie4@gmail.com')return '/admin';return currentUser()?.role === 'business' ? '/business/setup' : '/feed' }
export async function authenticate(mode:'login'|'signup',email:string,password:string,name='',role='student') {
 if(!supabase) throw new Error('Account access is being connected. You can explore businesses while setup is completed.')
 if(mode==='signup'&&!isStudentEmail(email))throw new Error(`Student signup requires your @${studentEmailDomain} email. Admins use their existing admin login.`)
 if(mode==='signup'){
  const response=await fetch(`${url}/auth/v1/settings`,{headers:{apikey:key!}})
  if(!response.ok)throw new Error('Unable to check email verification. Please retry.')
  const settings=await response.json()
  if(settings.mailer_autoconfirm!==false)throw new Error('Verified signup is being activated. Please try again shortly.')
 }
 if(mode==='signup') localStorage.setItem('biziz-signup-role',role)
 const result=mode==='signup' ? await supabase.auth.signUp({email,password,options:{data:{name:name.trim()||email.split('@')[0],role},emailRedirectTo:`${window.location.origin}/auth/callback`}}) : await supabase.auth.signInWithPassword({email,password})
 if(result.error) throw result.error
 if(mode==='signup'&&result.data.session){await supabase.auth.signOut();storeSession(null);throw new Error('Email verification must be enabled before signup.')}
 storeSession(result.data.session)
 return Boolean(result.data.session)
}
export async function signOut(){ if(supabase) await supabase.auth.signOut();storeSession(null);localStorage.removeItem('biziz-signup-role') }
export async function availableProviders():Promise<('azure'|'google')[]>{
 if(!url||!key)return []
 const response=await fetch(`${url}/auth/v1/settings`,{headers:{apikey:key}});if(!response.ok)return []
 const settings=await response.json();return (['azure','google'] as const).filter(provider=>settings.external?.[provider])
}
export async function providerSignIn(provider:'azure'|'google',role:string){
 if(!supabase)throw new Error('Sign-in is not configured yet.')
 localStorage.setItem('biziz-signup-role',role)
 const {error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:`${window.location.origin}/auth/callback`,...(provider==='azure'?{scopes:'email'}:{})}})
 if(error)throw error
}

export async function verifySignupOtp(email:string,token:string){
 if(!supabase)throw new Error('Sign-in service is unavailable.')
 if(!isStudentEmail(email))throw new Error(`Use your @${studentEmailDomain} student email.`)
 if(!/^[0-9]{6,10}$/.test(token.trim()))throw new Error('Enter the code from your email.')
 const {data,error}=await supabase.auth.verifyOtp({email:email.trim().toLowerCase(),token:token.trim(),type:'email'})
 if(error)throw error
 if(!data.session||!data.user?.email_confirmed_at)throw new Error('Email verification was not completed. Request a new code.')
 storeSession(data.session)
}
export async function resendSignupOtp(email:string){
 if(!supabase)throw new Error('Sign-in service is unavailable.')
 if(!isStudentEmail(email))throw new Error(`Use your @${studentEmailDomain} student email.`)
 const {error}=await supabase.auth.resend({type:'signup',email:email.trim().toLowerCase()})
 if(error)throw error
}
