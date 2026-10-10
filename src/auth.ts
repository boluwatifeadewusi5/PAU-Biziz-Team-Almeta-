const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
export const backendReady = Boolean(url && key)
export function currentUser(): {name:string;email:string} | null { try { const s=JSON.parse(localStorage.getItem('biziz-session')||'null'); return s?.user ? { name:s.user.user_metadata?.name||'PAU student',email:s.user.email } : null } catch { return null } }
export async function authenticate(mode:'login'|'signup',email:string,password:string,name='') {
 if(!backendReady) throw new Error('Account access is being connected. You can explore businesses while setup is completed.')
 const response=await fetch(`${url}/auth/v1/${mode==='signup'?'signup':'token?grant_type=password'}`,{method:'POST',headers:{apikey:key!,'Content-Type':'application/json'},body:JSON.stringify({email,password,...(mode==='signup'?{data:{name}}:{})})})
 const result=await response.json(); if(!response.ok) throw new Error(result.msg||result.error_description||result.message||'Unable to continue. Please try again.')
 if(result.access_token) localStorage.setItem('biziz-session',JSON.stringify(result))
 return Boolean(result.access_token)
}
export function signOut(){localStorage.removeItem('biziz-session')}
