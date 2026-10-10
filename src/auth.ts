import { createClient, type Session } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
export const backendReady = Boolean(url && key)
export const supabase = backendReady ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' } }) : null
let activeSession: Session | null = null
export function storeSession(session: Session | null) {
 const changed = activeSession?.user.id !== session?.user.id
 activeSession = session
 if (session) localStorage.setItem('biziz-session', JSON.stringify(session))
 else localStorage.removeItem('biziz-session')
 if(changed) window.dispatchEvent(new Event('biziz-auth-change'))
}
export async function getSession() {
 if (!supabase) return null
 const { data, error } = await supabase.auth.getSession()
 if (error) throw error
 storeSession(data.session)
 return data.session
}
export function currentUser(): {name:string;email:string;role:string} | null {
 const user = activeSession?.user
 return user ? {name:user.user_metadata?.name || 'PAU student',email:user.email || '',role:user.user_metadata?.role || localStorage.getItem('biziz-signup-role') || 'student'} : null
}
export function accountDestination() { return currentUser()?.role === 'business' ? '/business/setup' : '/feed' }
export async function authenticate(mode:'login'|'signup',email:string,password:string,name='',role='student') {
 if(!supabase) throw new Error('Account access is being connected. You can explore businesses while setup is completed.')
 if(mode==='signup') localStorage.setItem('biziz-signup-role',role)
 const result=mode==='signup' ? await supabase.auth.signUp({email,password,options:{data:{name,role},emailRedirectTo:`${window.location.origin}/auth/callback`}}) : await supabase.auth.signInWithPassword({email,password})
 if(result.error) throw result.error
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
