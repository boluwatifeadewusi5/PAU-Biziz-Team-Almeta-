import {useEffect,useState} from 'react'
import {NavLink} from 'react-router-dom'
import {ShieldCheck} from 'lucide-react'
import {isAdmin} from './admin'
export default function AdminLink(){const [allowed,setAllowed]=useState(false);useEffect(()=>{let alive=true;void isAdmin().then(value=>{if(alive)setAllowed(value)}).catch(()=>{});return()=>{alive=false}},[]);return allowed?<><NavLink to="/admin/verify-businesses"><ShieldCheck size={18}/>Verify businesses</NavLink><NavLink to="/admin/verified-list"><ShieldCheck size={18}/>PAU verified list</NavLink><NavLink to="/admin/review-history"><ShieldCheck size={18}/>Review history</NavLink></>:null}
