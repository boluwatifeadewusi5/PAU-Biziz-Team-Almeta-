import { getSession } from './auth'
export const apiUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
export const categories = ['Food', 'Fashion', 'Academics', 'Tech', 'Services'] as const
export function clientId() {
 let id = localStorage.getItem('biziz-client-id')
 if (!id) { id = crypto.randomUUID(); localStorage.setItem('biziz-client-id', id) }
 return id
}
export async function request(path:string, method='GET', body?:unknown) {
 const session = await getSession()
 if(path.startsWith('/owner/') && !session?.access_token) throw new Error('Please log in to manage your business.')
 let response:Response
 try { response = await fetch(apiUrl + path, {method, headers: {'Content-Type':'application/json', 'x-client-id':clientId(), ...(session?.access_token ? {Authorization:`Bearer ${session.access_token}`} : {})}, ...(body !== undefined ? {body:JSON.stringify(body)} : {})}) }
 catch { throw new Error('Cannot reach the backend. Please check it is running and try again.') }
 const data = await response.json()
 if (!response.ok) {
  const detail = data.detail
  const message = Array.isArray(detail) ? detail.map((e:{loc:string[];msg:string}) => `${e.loc.slice(1).join('.') || 'Form'}: ${e.msg}`).join('; ') : detail
  throw Object.assign(new Error(message || 'Unable to complete request'), {status:response.status})
 }
 return data
}
const placeholder = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80'
export function mapBusiness(b:any) { return {...b,id:String(b.id),whatsapp:b.whatsapp_number||'',websiteUrl:b.website_url||'',logoUrl:b.logo_url||placeholder,email:'',location:b.fulfillment_info||'PAU campus',whatsappLink:b.whatsapp_link,websiteLink:b.website_link} }
export function mapPost(p:any) { return {...p,id:String(p.id),businessId:String(p.business_id),businessName:p.business_name,imageUrl:p.image_url||placeholder,price:p.price_label,whatsappLink:p.whatsapp_link,websiteLink:p.website_link} }
export const listBusinesses = async () => (await request('/businesses')).map(mapBusiness)
export const listPosts = async () => (await request('/posts')).map(mapPost)
export const getPost = async (id:string) => mapPost(await request(`/posts/${encodeURIComponent(id)}`))
export const getBusiness = async (id:string) => {const b=await request(`/businesses/${encodeURIComponent(id)}`);return {...mapBusiness(b),posts:b.posts.map(mapPost)}}
export const ownerBusiness = async () => {try{return mapBusiness(await request('/owner/business'))}catch(e){if((e as {status:number}).status===400)return null;throw e}}
async function imageUrl(value:string) {return value.startsWith('data:') ? (await request('/owner/media','POST',{data_url:value})).url : value || null}
export async function persistBusiness(b:{name:string;description:string;category:string;whatsapp:string;logoUrl:string;websiteUrl?:string}) {
 return mapBusiness(await request('/owner/business','PUT',{name:b.name,description:b.description,category:b.category,whatsapp_number:b.whatsapp||null,website_url:b.websiteUrl||null,logo_url:await imageUrl(b.logoUrl)}))
}
export async function persistPost(p:{title:string;description:string;category:string;imageUrl:string;price?:string;availability:string}) {
 const text = p.price?.trim() || ''
 const numeric = text.replace(/[₦,\s]/g,'')
 if (text && (!/^\d+(\.\d{1,2})?$/.test(numeric))) throw new Error('Enter a nonnegative NGN price, or leave price blank for Contact for price.')
 return mapPost(await request('/owner/posts','POST',{title:p.title,description:p.description,category:p.category,image_url:await imageUrl(p.imageUrl),price_mode:text?'amount':'contact',price_amount:text?Number(numeric):null,publication_status:'published'}))
}
export const toggleLike = (id:string) => request(`/posts/${id}/like`,'POST')
export const loadComments = (id:string) => request(`/posts/${id}/comments`)
export const addComment = (id:string,author:string,text:string) => request(`/posts/${id}/comments`,'POST',{author,text})
