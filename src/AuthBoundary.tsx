import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase, getSession, storeSession, accountDestination } from './auth'

export default function AuthBoundary({children}:{children:ReactNode}) {
 const location=useLocation();const navigate=useNavigate();const [ready,setReady]=useState(!supabase);const [error,setError]=useState('')
 useEffect(()=>{
  if(!supabase)return
  let cancelled=false
  const hash=new URLSearchParams(window.location.hash.slice(1)); const callback=location.pathname==='/auth/callback'||hash.has('access_token')||hash.has('error')
  if(hash.has('error')){setError(hash.get('error_description')||'This confirmation link has expired. Please log in or request another confirmation.');history.replaceState(null,'',location.pathname)}
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{storeSession(session)})
  getSession().then(session=>{if(cancelled)return;if(callback&&!hash.has('error')){if(session)navigate(accountDestination(),{replace:true});else setError('This link has already been used or expired. If you confirmed your email, log in to continue.')}setReady(true)}).catch(e=>{if(!cancelled){setError(e.message);setReady(true)}})
  return()=>{cancelled=true;subscription.unsubscribe()}
 },[])
 if(error)return <main className="route-shell"><section className="surface-card"><h1>Let’s get you signed in.</h1><p role="alert">{error}</p><Link className="button primary" to="/login" onClick={()=>setError('')}>Continue to login</Link></section></main>
 if(!ready)return <main className="route-shell"><p role="status">Signing you in…</p></main>
 return children
}
