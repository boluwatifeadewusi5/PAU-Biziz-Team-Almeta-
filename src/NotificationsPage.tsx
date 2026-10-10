import useNotifications from './useNotifications'
import {Link} from 'react-router-dom'
import {Bell,Heart,MessageCircle} from 'lucide-react'
export default function NotificationsPage(){
 const {notices,loading,error,signedIn}=useNotifications(true)
 return <section className="notifications-page"><span className="eyebrow">YOUR CAMPUS CONNECTIONS</span><h1>Notifications</h1><p>Updates on your business offers, all in one place.</p>{loading?<p role="status">Loading updates…</p>:error?<p className="auth-notice" role="status">{error}</p>:!signedIn?<div className="notification-empty"><Bell size={38}/><h2>Stay in the loop.</h2><p>Log in to see activity on your business offers.</p><Link className="button primary" to="/login">Log in</Link></div>:!notices.length?<div className="notification-empty"><Bell size={38}/><h2>You’re all caught up.</h2><p>Likes and comments on your offers will appear here.</p><Link to="/explore">Explore campus businesses →</Link></div>:<div className="notification-list">{notices.map(n=><Link key={n.id} to={`/posts/${n.postId}`}><span>{n.kind==='like'?<Heart size={20}/>:<MessageCircle size={20}/>}</span><div><strong>{n.title}</strong><small>{new Date(n.date).toLocaleString('en-NG',{timeZone:'Africa/Lagos',dateStyle:'medium',timeStyle:'short'})}</small></div></Link>)}</div>}</section>
}
