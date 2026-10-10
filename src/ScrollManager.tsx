import {useLayoutEffect,useRef} from 'react'
import {useLocation,useNavigationType} from 'react-router-dom'
const positions=new Map<string,number>()
export default function ScrollManager(){
 const location=useLocation();const action=useNavigationType();const previous=useRef<{key:string;path:string}|null>(null)
 useLayoutEffect(()=>{const old=previous.current;if(old&&old.path!==location.pathname){positions.set(old.key,window.scrollY);window.scrollTo({top:action==='POP'?positions.get(location.key)||0:0,behavior:'instant'})}previous.current={key:location.key,path:location.pathname}},[location.key,location.pathname,action])
 return null
}
