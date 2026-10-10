import { FormEvent, useMemo, useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, ChevronLeft, MapPin, ShoppingBag, Sparkles, UserRound } from 'lucide-react'

type Role = 'student' | 'business'

function Brand() {
  return (
    <Link className="brand" to="/" aria-label="PAU biziz home">
      <span className="brand-mark">
        <ShoppingBag size={23} />
      </span>
      <span>
        PAU <em>biziz</em>
      </span>
    </Link>
  )
}

function Welcome() {
  return (
    <div className="welcome">
      <header className="topbar">
        <Brand />
        <span className="campus-label">
          <MapPin size={14} /> THE PAU COMMUNITY
        </span>
        <Link to="/login" className="login-link">
          Log in <ArrowUpRight size={16} />
        </Link>
      </header>
      <main className="welcome-main">
        <section className="hero" aria-labelledby="onboarding-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> SAME CAMPUS. MORE POSSIBILITIES.
            </p>
            <h1 id="onboarding-title">Discover. Support. Grow.</h1>
            <p className="hero-intro">
              PAU biziz helps students discover trusted campus businesses and helps business owners reach their next
              customer faster.
            </p>
            <div className="hero-actions" role="group" aria-label="Get started options">
              <Link
                className="button primary"
                to={{ pathname: '/signup', search: '?role=student' }}
                state={{ role: 'student' as Role }}
              >
                <UserRound size={18} />
                Get started as a student
              </Link>
              <Link
                className="button gold"
                to={{ pathname: '/signup', search: '?role=business' }}
                state={{ role: 'business' as Role }}
              >
                <BriefcaseBusiness size={18} />
                Get started as a business
              </Link>
            </div>
            <div className="secondary-actions">
              <Link className="text-link" to="/feed">
                Explore demo businesses <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <aside className="hero-panel" aria-label="PAU biziz highlights">
            <p className="panel-brand">
              PAU <em>biziz</em>
            </p>
            <p className="panel-tagline">Discover · Support · Grow</p>
            <ul>
              <li>
                <Sparkles size={15} />
                Find nearby campus offers in seconds
              </li>
              <li>
                <Sparkles size={15} />
                Promote your business to the PAU community
              </li>
              <li>
                <Sparkles size={15} />
                Start now with a short demo signup flow
              </li>
            </ul>
          </aside>
        </section>
      </main>
    </div>
  )
}

function Signup() {
  const location = useLocation()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const role = useMemo<Role>(() => {
    const stateRole = (location.state as { role?: string } | null)?.role
    if (stateRole === 'student' || stateRole === 'business') return stateRole
    const queryRole = new URLSearchParams(location.search).get('role')
    return queryRole === 'business' ? 'business' : 'student'
  }, [location.search, location.state])

  const roleCopy =
    role === 'business'
      ? {
          title: 'Set up your business account',
          subtitle: 'Share your business with students across PAU in a few quick steps.',
          confirmation: 'Your business account is ready for the next onboarding step.',
        }
      : {
          title: 'Create your student account',
          subtitle: 'Join PAU biziz to discover, support, and grow with campus businesses.',
          confirmation: 'Your student account is ready for the next onboarding step.',
        }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name || !email || !password) return
    setIsSubmitted(true)
  }

  return (
    <main className="signup-page">
      <header className="signup-topbar">
        <Brand />
        <Link className="text-link" to="/">
          <ChevronLeft size={16} />
          Back to welcome
        </Link>
      </header>
      <section className="signup-card" aria-labelledby="signup-title">
        <p className="eyebrow">
          <span /> SIGN UP
        </p>
        <h1 id="signup-title">{roleCopy.title}</h1>
        <p>{roleCopy.subtitle}</p>
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="signup-form">
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" name="fullName" type="text" value={name} onChange={(event) => setName(event.target.value)} required />
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button type="submit" className="button primary">
              Continue <ArrowRight size={17} />
            </button>
          </form>
        ) : (
          <div className="signup-confirmation" role="status" aria-live="polite">
            <p>{roleCopy.confirmation}</p>
            <Link className="button gold" to="/feed">
              Continue to demo feed <ArrowRight size={17} />
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}

function ScreenHandoff({ title, owner }: { title: string; owner: string }) {
  return (
    <main className="handoff">
      <Brand />
      <span className="eyebrow">
        <span /> BUILD IN PROGRESS
      </span>
      <h1>{title}</h1>
      <p>This route is ready for {owner}’s screen. The welcome page is the first completed iteration.</p>
      <Link to="/" className="button primary">
        <ChevronLeft size={18} /> Back to welcome
      </Link>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<ScreenHandoff title="Welcome back." owner="Vincent" />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/feed" element={<ScreenHandoff title="Your campus discoveries." owner="Ruth" />} />
      <Route path="*" element={<ScreenHandoff title="Let’s get you back on campus." owner="the team" />} />
    </Routes>
  )
}
