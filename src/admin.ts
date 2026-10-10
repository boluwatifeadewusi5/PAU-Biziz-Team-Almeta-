import {getSession,supabase} from './auth'
export async function isAdmin(){if(!supabase||!await getSession())return false;const {data,error}=await supabase.rpc('is_biziz_admin');return !error&&data===true}
