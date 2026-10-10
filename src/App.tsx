import { Link, Route, Routes } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, ShoppingBag, Search, MapPin, Sparkles, Coffee, Scissors, Laptop, Heart, ChevronLeft } from 'lucide-react'

function Brand() { return <Link className="brand" to="/" aria-label="PAU biziz home"><span className="brand-mark"><ShoppingBag size={23} /></span><span>PAU <em>biziz</em></span></Link> }

const discoveries = [
  { name: 'The Snack Hub', category: 'Food & drinks', title: 'Your next study-break craving.', icon: Coffee, style: 'food', label: 'Fresh on campus', price: 'Small bites. Big mood.' },
  { name: 'Campus Cuts', category: 'Beauty & grooming', title: 'A fresh look, between lectures.', icon: Scissors, style: 'beauty', label: 'Made for your schedule', price: 'Your campus glow-up.' },
  { name: 'Laptop Fixers', category: 'Tech & services', title: 'Back to work. Without the stress.', icon: Laptop, style: 'tech', label: 'Help, close to home', price: 'Good people. Smart fixes.' },
]

function Welcome() {
  return <div className="welcome">
    <header className="topbar"><Brand /><span className="campus-label"><MapPin size={14}/> THE PAU COMMUNITY</span><Link to="/login" className="login-link">Log in <ArrowUpRight size={16}/></Link></header>
    <main>
      <section className="hero">
        <div className="hero-copy"><span className="eyebrow"><span/> SAME CAMPUS. MORE POSSIBILITIES.</span>
          <h1>Your campus.<br/>Your people.<br/><span>Your next find.</span></h1>
          <p>From your next lunch spot to the person who can fix your laptop. Discover the businesses built by people right here at PAU.</p>
          <div className="hero-actions"><Link className="button primary" to="/feed">Explore businesses <ArrowRight size={18}/></Link><Link className="button secondary" to="/signup">Join the community</Link></div>
          <div className="hero-note"><span className="mini-avatars"><i>O</i><i>T</i><i>R</i></span><span>Discover local. Support your own.<br/><strong>No account needed to explore.</strong></span></div>
        </div>
        <div className="hero-visual" aria-label="Illustrated preview of campus businesses">
          <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
          <span className="floating-note"><Sparkles size={17}/> A little closer to everything.</span>
          <div className="preview-shell"><div className="preview-header"><span className="preview-brand">PAU <b>biziz</b></span><Search size={17}/></div><div className="preview-tabs"><span className="selected">For you</span><span>Food</span><span>Fashion</span><span>Services</span></div>
            <div className="preview-business"><span className="business-avatar"><Coffee size={18}/></span><div><strong>The Snack Hub</strong><small>Food & drinks · PAU campus</small></div><span className="preview-tag">Discover</span></div>
            <div className="food-art"><span className="art-caption">A GOOD DAY<br/>STARTS HERE.</span><div className="cup"><div className="cup-lid"/><span>SNACK<br/><b>HUB</b></span></div><div className="cookie cookie-one"/><div className="cookie cookie-two"/><span className="art-sticker">made with<br/><b>good vibes ✦</b></span></div>
            <div className="preview-caption"><strong>A little fuel for your next big idea.</strong><p>Fresh bites, cold drinks & your favourite campus stop.</p><span><MapPin size={12}/> Right here at PAU <Heart size={15}/></span></div>
          </div>
          <div className="floating-business"><span><Scissors size={22}/></span><div><small>YOUR NEXT DISCOVERY</small><strong>Campus Cuts</strong><p>Fresh looks. Familiar faces.</p></div><ArrowUpRight size={20}/></div>
          <span className="handwritten">Good things are<br/>closer than you think.</span>
        </div>
      </section>
      <section className="discovery-section"><div className="section-heading"><div><span className="eyebrow">A CAMPUS FULL OF POSSIBILITIES</span><h2>There’s a biz for that.</h2></div><Link to="/feed">Find your next favourite <ArrowRight size={17}/></Link></div>
        <div className="discovery-grid">{discoveries.map(({name,category,title,icon:Icon,style,label,price}) => <Link to="/feed" className={`discovery-card ${style}`} key={name}><div className="card-art"><span className="card-label">{label}</span><Icon size={68} strokeWidth={1.25}/><span className="card-art-copy">{price}</span><span className="card-arrow"><ArrowUpRight size={19}/></span></div><div className="card-info"><small>{category}</small><h3>{name}</h3><p>{title}</p></div></Link>)}</div>
        <p className="sample-note">A glimpse of what’s possible · Illustrative businesses</p>
      </section>
      <section className="owner-banner"><div><span className="eyebrow">BUILT SOMETHING GOOD?</span><h2>Your next customer could<br/>be sitting in your next class.</h2><p>Give your campus business a place to be discovered.</p></div><Link className="button gold" to="/signup">Put your biz on the map <ArrowRight size={18}/></Link></section>
    </main><footer><Brand/><span>Discover. Support. Grow.</span><small>Made for the PAU community.</small></footer>
  </div>
}

function ScreenHandoff({title,owner}:{title:string;owner:string}) { return <main className="handoff"><Brand/><span className="eyebrow">BUILD IN PROGRESS</span><h1>{title}</h1><p>This route is ready for {owner}’s screen. The welcome page is the first completed iteration.</p><Link to="/" className="button primary"><ChevronLeft size={18}/> Back to welcome</Link></main> }

export default function App() { return <Routes><Route path="/" element={<Welcome/>}/><Route path="/login" element={<ScreenHandoff title="Welcome back." owner="Vincent"/>}/><Route path="/signup" element={<ScreenHandoff title="Find your campus community." owner="Ruth"/>}/><Route path="/feed" element={<ScreenHandoff title="Your campus discoveries." owner="Ruth"/>}/><Route path="*" element={<ScreenHandoff title="Let’s get you back on campus." owner="the team"/>}/></Routes> }
