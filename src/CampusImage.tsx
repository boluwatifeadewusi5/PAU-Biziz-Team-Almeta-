import {useEffect,useState,type ImgHTMLAttributes} from 'react'
import {categoryImage} from './media'
export default function CampusImage({src,category,...props}:ImgHTMLAttributes<HTMLImageElement>&{category?:string}){
 const fallback=categoryImage(category||'Other')
 const valid=(value?:string)=>{if(!value)return fallback;if(value.startsWith('data:image/'))return value;try{const url=new URL(value,window.location.origin);return url.pathname==='/'?fallback:value}catch{return fallback}}
 const [source,setSource]=useState(()=>valid(src));useEffect(()=>setSource(valid(src)),[src,category])
 return <img {...props} src={source} onError={()=>{if(source!==fallback)setSource(fallback)}}/>
}
