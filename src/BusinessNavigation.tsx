import {Link,useLocation,useNavigate} from 'react-router-dom'
export default function BusinessNavigation({businesses,activeId}:{businesses:{id:string;name:string}[];activeId?:string}){
 const location=useLocation(),navigate=useNavigate()
 if(['/','/feed','/login','/signup','/auth/callback'].includes(location.pathname))return null
 const businessPage=location.pathname.startsWith('/business/')||['/posts/new','/posts/manage','/businesses/mine','/account'].includes(location.pathname)
 function switchBusiness(id:string){const params=new URLSearchParams(location.search);params.set('business',id);const path=['/business/setup','/business/status','/posts/new','/posts/manage'].includes(location.pathname)?location.pathname:'/business/status';navigate(path+'?'+params.toString())}
 return <nav className="business-navigation" aria-label="Page navigation"><Link className="button secondary" to={location.pathname.startsWith('/admin/')?'/admin':'/feed'}>← {location.pathname.startsWith('/admin/')?'Management':'Back to feed'}</Link>{businessPage&&businesses.length>0&&<><label>Switch business<select aria-label="Switch business" value={activeId||''} onChange={e=>switchBusiness(e.target.value)}><option value="" disabled>Choose business</option>{businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><Link className="button secondary" to="/business/new">+ Add business</Link></>}</nav>
}
