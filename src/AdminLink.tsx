import {currentUser} from './auth'
import {useEffect,useState} from 'react'
import {NavLink} from 'react-router-dom'
import {ShieldCheck} from 'lucide-react'
import {isAdmin} from './admin'
export default function AdminLink(){const [allowed,setAllowed]=useState(false);useEffect(()=>{let alive=true;void isAdmin().then(value=>{if(alive)setAllowed(value)}).catch(()=>{});return()=>{alive=false}},[]);return allowed||currentUser()?.email.toLowerCase()==='bensagie4@gmail.com'?<><NavLink to="/admin" end><ShieldCheck size={18}/>Management overview</NavLink><NavLink to="/admin/verify-businesses"><ShieldCheck size={18}/>Verify businesses</NavLink><NavLink to="/admin/verified-list"><ShieldCheck size={18}/>PAU verified list</NavLink><NavLink to="/admin/review-history"><ShieldCheck size={18}/>Review history</NavLink></>:null}
