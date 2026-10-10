const url=import.meta.env.VITE_SUPABASE_URL
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
async function request(table:string,method='GET',body?:unknown,query=''){
 let session;try{session=JSON.parse(localStorage.getItem('biziz-session')||'null')}catch{session=null}
 if(!url||!key)throw new Error('Publishing will open once the database is connected. Your form has been kept.')
 if(method!=='GET'&&!session?.access_token)throw new Error('Please log in before publishing.')
 const response=await fetch(`${url}/rest/v1/${table}${query}`,{method,headers:{apikey:key,...(session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{ }),'Content-Type':'application/json',Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{})})
 const result=await response.json();if(!response.ok)throw new Error(result.message||'Unable to save. Please try again.');return result
}
export const listBusinesses=()=>request('businesses')
export const listPosts=()=>request('posts','GET',undefined,'?order=created_at.desc')
export async function persistBusiness(b:{id:string;name:string;description:string;category:string;whatsapp:string;logoUrl:string}){
 const session=JSON.parse(localStorage.getItem('biziz-session')||'null');if(!session?.user)throw new Error('Please log in to set up your business.')
 const data={owner_id:session.user.id,name:b.name,description:b.description,category:b.category,whatsapp:b.whatsapp,logo_url:b.logoUrl}
 const updating=b.id!=='my-business';return (await request('businesses',updating?'PATCH':'POST',data,updating?`?id=eq.${encodeURIComponent(b.id)}`:''))[0]
}
export async function persistPost(p:{businessId:string;title:string;description:string;category:string;imageUrl:string;price?:string;availability:string}){
 return (await request('posts','POST',{business_id:p.businessId,title:p.title,description:p.description,category:p.category,image_url:p.imageUrl,price:p.price,availability:p.availability}))[0]
}
