import { getSession } from './auth'
const url=import.meta.env.VITE_SUPABASE_URL
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
async function request(table:string,method='GET',body?:unknown,query=''){
 const session=await getSession()
 if(!url||!key)throw new Error('Publishing will open once the database is connected. Your form has been kept.')
 if(method!=='GET'&&!session?.access_token)throw new Error('Please log in before publishing.')
 const response=await fetch(`${url}/rest/v1/${table}${query}`,{method,headers:{apikey:key,...(session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{ }),'Content-Type':'application/json',Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{})})
 const result=await response.json();if(!response.ok)throw new Error(result.message||'Unable to save. Please try again.');return result
}
export const listBusinesses=()=>request('businesses')
export async function listOwnedBusinesses(){const session=await getSession();return session?request('businesses','GET',undefined,`?owner_id=eq.${encodeURIComponent(session.user.id)}&order=created_at.desc`):[]}
export const listPosts=()=>request('posts','GET',undefined,'?order=created_at.desc')
export async function persistBusiness(b:{id:string;name:string;description:string;category:string;whatsapp:string;logoUrl:string},options:{createNew?:boolean}={}){
 const session=await getSession();if(!session?.user)throw new Error('Please log in to set up your business.')
 const data={owner_id:session.user.id,name:b.name,description:b.description,category:b.category,whatsapp:b.whatsapp,logo_url:b.logoUrl}
 let id=b.id
 if(id==='my-business'&&options.createNew){
  const sameName=await request('businesses','GET',undefined,`?owner_id=eq.${encodeURIComponent(session.user.id)}&name=eq.${encodeURIComponent(b.name.trim())}&select=id&limit=1`)
  if(sameName[0])throw new Error('You already own a business with this name. Open My businesses to edit it.')
 }
 if(id==='my-business'&&!options.createNew){
  const existing=await request('businesses','GET',undefined,`?owner_id=eq.${encodeURIComponent(session.user.id)}&select=id&order=created_at.desc&limit=1`)
  if(existing[0])id=existing[0].id
 }
 const updating=id!=='my-business';const rows=await request('businesses',updating?'PATCH':'POST',data,updating?`?id=eq.${encodeURIComponent(id)}`:'');if(!rows[0])throw new Error('No business was saved. Make sure you are signed in as its owner.');return rows[0]
}
export async function persistPost(p:{businessId:string;title:string;description:string;category:string;imageUrl:string;price?:string;availability:string}){
 return (await request('posts','POST',{business_id:p.businessId,title:p.title,description:p.description,category:p.category,image_url:p.imageUrl,price:p.price,availability:p.availability}))[0]
}
export async function updatePost(id:string,p:{title:string;description:string;category:string;imageUrl:string;price?:string;availability:string}){
 const rows=await request('posts','PATCH',{title:p.title,description:p.description,category:p.category,image_url:p.imageUrl,price:p.price||null,availability:p.availability},`?id=eq.${encodeURIComponent(id)}`)
 if(!rows[0])throw new Error('Only the business owner can edit this post.')
 return rows[0]
}
