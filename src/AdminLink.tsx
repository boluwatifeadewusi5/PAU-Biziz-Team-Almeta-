import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {ShieldCheck} from 'lucide-react'
import {isAdmin} from './admin'
export default function AdminLink(){const [allowed,setAllowed]=useState(false);useEffect(()=>{let alive=true;void isAdmin().then(value=>{if(alive)setAllowed(value)}).catch(()=>{});return()=>{alive=false}},[]);return allowed?<Link to="/admin"><ShieldCheck size={18}/>Admin reviews</Link>:null}
