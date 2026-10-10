import {useEffect,useState} from 'react'
import {currentUser,getSession,supabase} from './auth'
export default function useProfile(){
 const [profile,setProfile]=useState({...currentUser(),avatar_url:'',bio:''})
 useEffect(()=>{let alive=true;async function load(){const session=await getSession();if(!session){if(alive)setProfile({avatar_url:'',bio:''});return}const metadata=session.user.user_metadata;const {data}=await supabase!.from('profiles').select('avatar_url,bio').eq('id',session.user.id).maybeSingle();if(alive)setProfile({...currentUser(),avatar_url:data?.avatar_url||metadata.avatar_url||'',bio:data?.bio||metadata.bio||''})}void load().catch(()=>{});const update=()=>void load().catch(()=>{});window.addEventListener('biziz-profile-updated',update);const sub=supabase?.auth.onAuthStateChange(()=>{setTimeout(update,0)});return()=>{alive=false;window.removeEventListener('biziz-profile-updated',update);sub?.data.subscription.unsubscribe()}},[])
 return profile
}
