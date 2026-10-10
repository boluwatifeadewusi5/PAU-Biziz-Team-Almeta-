import {useState} from 'react'
import {Link} from 'react-router-dom'
import {ArrowUpRight,Search,ShoppingBag} from 'lucide-react'
import CampusImage from './CampusImage'
import {categoryImage} from './media'
type Business={id:string;name:string;description:string;category:string;logoUrl:string}
type Post={id:string;title:string;description:string;category:string;businessName:string;imageUrl:string;price?:string}
export default function ExplorePage({posts,businesses,query,category,onCategory}:{posts:Post[];businesses:Business[];query:string;category:string;onCategory:(c:string)=>void}){
 const [tab,setTab]=useState<'offers'|'businesses'>('offers')
 const matches=(text:string,c:string)=>(category==='For you'||category===c)&&text.toLowerCase().includes(query.trim().toLowerCase())
 const offers=posts.filter(p=>matches(`${p.title} ${p.description} ${p.businessName}`,p.category))
 const shops=businesses.filter(b=>matches(`${b.name} ${b.description}`,b.category))
 const categories=['For you','Food & drinks','Transport','Fashion','Tech & services','Beauty & grooming','Academic support','Other']
 return <section className="explore-page"><header className="explore-heading"><span className="eyebrow">SAME CAMPUS. MORE POSSIBILITIES.</span><h1>Find your next<br/><em>campus favourite.</em></h1><p>Search the people, products, and services making life at PAU a little better.</p></header><div className="explore-categories" aria-label="Explore categories">{categories.map(c=><button key={c} className={category===c?'selected':''} aria-pressed={category===c} onClick={()=>onCategory(c)}>{c==='For you'?<ShoppingBag size={20}/>:<CampusImage category={c} src={categoryImage(c,100)} alt=""/>}<span>{c==='For you'?'All categories':c}</span></button>)}</div><div className="discovery-result-bar"><div role="group" aria-label="Result type"><button className={tab==='offers'?'selected':''} onClick={()=>setTab('offers')}>Offers <span>{offers.length}</span></button><button className={tab==='businesses'?'selected':''} onClick={()=>setTab('businesses')}>Businesses <span>{shops.length}</span></button></div><small>{query?`Results for “${query}”`:'Discover around campus'}</small></div>
 {tab==='offers'?<div className="explore-offers">{offers.map(p=><article key={p.id}><Link className="explore-offer-image" to={`/posts/${p.id}`}><CampusImage category={p.category} src={p.imageUrl} alt={p.title}/><span>{p.category}</span></Link><div><small>{p.businessName}</small><h2>{p.title}</h2><p>{p.description}</p><footer><strong>{p.price||'Contact for price'}</strong><Link to={`/posts/${p.id}`}>View offer <ArrowUpRight size={16}/></Link></footer></div></article>)}</div>:<div className="explore-businesses">{shops.map(b=><Link to={`/businesses/${b.id}`} key={b.id}><CampusImage category={b.category} src={b.logoUrl} alt=""/><div><small>{b.category}</small><h2>{b.name}</h2><p>{b.description}</p></div><ArrowUpRight size={20}/></Link>)}</div>}
 {!(tab==='offers'?offers.length:shops.length)&&<div className="empty-state"><Search size={28}/><h3>No matches just yet.</h3><p>Try a different phrase or choose another category.</p></div>}</section>
}
