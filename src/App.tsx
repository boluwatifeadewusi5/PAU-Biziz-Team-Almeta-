import { useMemo, useState } from 'react'
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChevronLeft,
  Coffee,
  Eye,
  EyeOff,
  Heart,
  Home,
  Laptop,
  ListFilter,
  MapPin,
  Phone,
  Plus,
  Scissors,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
} from 'lucide-react'

type Category = 'Food & drinks' | 'Beauty & grooming' | 'Tech & services' | 'Fashion' | 'Academic support' | 'Wellness' | 'Other'

type Business = {
  id: string
  name: string
  description: string
  category: Category
  whatsapp: string
  email: string
  location: string
  logoUrl: string
}

type Post = {
  id: string
  businessId: string
  businessName: string
  title: string
  description: string
  category: Category
  imageUrl: string
  price?: string
  availability: string
}

type BusinessDraft = {
  name: string
  description: string
  category: Category
  whatsapp: string
  logoUrl: string
}

type CreatePostDraft = {
  title: string
  description: string
  category: Category
  price: string
  availability: string
  imageUrl: string
}

const BUSINESS_STORAGE_KEY = 'pau-biziz-business'
const POSTS_STORAGE_KEY = 'pau-biziz-created-posts'
const MY_BUSINESS_ID = 'my-business'
const CATEGORIES: Category[] = ['Food & drinks', 'Beauty & grooming', 'Tech & services', 'Fashion', 'Academic support', 'Wellness', 'Other']

const sampleBusinesses: Business[] = [
  {
    id: 'snack-hub',
    name: 'The Snack Hub',
    description: 'Fresh pastries, chilled drinks, and quick energy for your studio and lecture breaks.',
    category: 'Food & drinks',
    whatsapp: '+234 803 100 0011',
    email: 'hello@snackhub.demo',
    location: 'Main Cafeteria Walkway, PAU',
    logoUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'campus-cuts',
    name: 'Campus Cuts',
    description: 'Student-friendly haircuts and grooming sessions that fit your class schedule.',
    category: 'Beauty & grooming',
    whatsapp: '+234 812 222 7788',
    email: 'bookings@campuscuts.demo',
    location: 'Hostel Square, PAU',
    logoUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'laptop-fixers',
    name: 'Laptop Fixers',
    description: 'Fast troubleshooting, software cleanup, and accessory recommendations by classmates.',
    category: 'Tech & services',
    whatsapp: '+234 814 500 4412',
    email: 'support@laptopfixers.demo',
    location: 'Innovation Hub, PAU',
    logoUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80',
  },
]

const samplePosts: Post[] = [
  {
    id: 'post-coffee-box',
    businessId: 'snack-hub',
    businessName: 'The Snack Hub',
    title: 'Breakfast Combo Box',
    description: 'Butter croissant, fruit cup, and iced coffee packed fresh for your 8 a.m. class.',
    category: 'Food & drinks',
    imageUrl: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&w=1200&q=80',
    price: '₦2,500',
    availability: 'Available today · Pickup before 11:30 a.m.',
  },
  {
    id: 'post-braids',
    businessId: 'campus-cuts',
    businessName: 'Campus Cuts',
    title: 'Protective Braids Appointment',
    description: 'Neat knotless braids with style consultation. Student slots every evening from 5 p.m.',
    category: 'Beauty & grooming',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    price: 'From ₦10,000',
    availability: '4 spots left this week',
  },
  {
    id: 'post-laptop-service',
    businessId: 'laptop-fixers',
    businessName: 'Laptop Fixers',
    title: 'Same-day Laptop Tune-up',
    description: 'Fan cleaning, software optimization, and battery check for Windows and Mac devices.',
    category: 'Tech & services',
    imageUrl: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
    price: '₦6,000',
    availability: 'Open for walk-ins',
  },
]

const discoveries = [
  { name: 'The Snack Hub', category: 'Food & drinks', title: 'Your next study-break craving.', icon: Coffee, style: 'food', label: 'Fresh on campus', price: 'Small bites. Big mood.' },
  { name: 'Campus Cuts', category: 'Beauty & grooming', title: 'A fresh look, between lectures.', icon: Scissors, style: 'beauty', label: 'Made for your schedule', price: 'Your campus glow-up.' },
  { name: 'Laptop Fixers', category: 'Tech & services', title: 'Back to work. Without the stress.', icon: Laptop, style: 'tech', label: 'Help, close to home', price: 'Good people. Smart fixes.' },
]

function readStoredBusiness(): Business | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(BUSINESS_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Business
  } catch {
    return null
  }
}

function readStoredPosts(): Post[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(POSTS_STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Post[]) : []
  } catch {
    return []
  }
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

function formatWhatsAppLink(number: string) {
  const normalized = number.replace(/[^\d+]/g, '')
  const value = normalized.startsWith('+') ? normalized.slice(1) : normalized
  return `https://wa.me/${value}`
}

function sanitizeImageUrl(url: string, fallback = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80') {
  const value = url.trim()
  if (!value) return fallback
  if (value.startsWith('data:image/')) return value
  try {
    const parsed = new URL(value, 'https://pau-biziz.local')
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString()
    return fallback
  } catch {
    return fallback
  }
}

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
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <span /> SAME CAMPUS. MORE POSSIBILITIES.
            </span>
            <h1>
              Discover · Support · Grow.<br />
              <span>Your next find is nearby.</span>
            </h1>
            <p>
              From your next lunch spot to the person who can fix your laptop. Discover the businesses built by people right
              here at PAU.
            </p>
            <div className="hero-actions">
              <Link className="button primary" to="/feed">
                Explore businesses <ArrowRight size={18} />
              </Link>
              <Link className="button secondary" to="/login">
                Log in
              </Link>
              <Link className="button gold" to="/signup">
                Create account
              </Link>
            </div>
            <div className="hero-note">
              <span className="mini-avatars">
                <i>O</i>
                <i>T</i>
                <i>R</i>
              </span>
              <span>
                Discover local. Support your own.
                <br />
                <strong>No account needed to explore.</strong>
              </span>
            </div>
          </div>
          <div className="hero-visual" aria-label="Illustrated preview of campus businesses">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="floating-note">
              <Sparkles size={17} /> A little closer to everything.
            </span>
            <div className="preview-shell">
              <div className="preview-header">
                <span className="preview-brand">
                  PAU <b>biziz</b>
                </span>
                <Search size={17} />
              </div>
              <div className="preview-tabs">
                <span className="selected">For you</span>
                <span>Food</span>
                <span>Fashion</span>
                <span>Services</span>
              </div>
              <div className="preview-business">
                <span className="business-avatar">
                  <Coffee size={18} />
                </span>
                <div>
                  <strong>The Snack Hub</strong>
                  <small>Food & drinks · PAU campus</small>
                </div>
                <span className="preview-tag">Discover</span>
              </div>
              <div className="food-art">
                <span className="art-caption">
                  A GOOD DAY
                  <br />
                  STARTS HERE.
                </span>
                <div className="cup">
                  <div className="cup-lid" />
                  <span>
                    SNACK
                    <br />
                    <b>HUB</b>
                  </span>
                </div>
                <div className="cookie cookie-one" />
                <div className="cookie cookie-two" />
                <span className="art-sticker">
                  made with
                  <br />
                  <b>good vibes ✦</b>
                </span>
              </div>
              <div className="preview-caption">
                <strong>A little fuel for your next big idea.</strong>
                <p>Fresh bites, cold drinks & your favourite campus stop.</p>
                <span>
                  <MapPin size={12} /> Right here at PAU <Heart size={15} />
                </span>
              </div>
            </div>
            <div className="floating-business">
              <span>
                <Scissors size={22} />
              </span>
              <div>
                <small>YOUR NEXT DISCOVERY</small>
                <strong>Campus Cuts</strong>
                <p>Fresh looks. Familiar faces.</p>
              </div>
              <ArrowUpRight size={20} />
            </div>
            <span className="handwritten">
              Good things are
              <br />
              closer than you think.
            </span>
          </div>
        </section>
        <section className="discovery-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A CAMPUS FULL OF POSSIBILITIES</span>
              <h2>There’s a biz for that.</h2>
            </div>
            <Link to="/feed">
              Find your next favourite <ArrowRight size={17} />
            </Link>
          </div>
          <div className="discovery-grid">
            {discoveries.map(({ name, category, title, icon: Icon, style, label, price }) => (
              <Link to="/feed" className={`discovery-card ${style}`} key={name}>
                <div className="card-art">
                  <span className="card-label">{label}</span>
                  <Icon size={68} strokeWidth={1.25} />
                  <span className="card-art-copy">{price}</span>
                  <span className="card-arrow">
                    <ArrowUpRight size={19} />
                  </span>
                </div>
                <div className="card-info">
                  <small>{category}</small>
                  <h3>{name}</h3>
                  <p>{title}</p>
                </div>
              </Link>
            ))}
          </div>
          <p className="sample-note">A glimpse of what’s possible · Illustrative businesses</p>
        </section>
        <section className="owner-banner">
          <div>
            <span className="eyebrow">BUILT SOMETHING GOOD?</span>
            <h2>
              Your next customer could
              <br />
              be sitting in your next class.
            </h2>
            <p>Give your campus business a place to be discovered.</p>
          </div>
          <Link className="button gold" to="/signup">
            Put your biz on the map <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer>
        <Brand />
        <span>Discover. Support. Grow.</span>
        <small>Made for the PAU community.</small>
      </footer>
    </div>
  )
}

function Signup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isComplete, setIsComplete] = useState(false)

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!fullName.trim()) nextErrors.fullName = 'Please enter your full name.'
    if (!email.trim()) nextErrors.email = 'Please enter your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Please enter a valid email address.'
    if (!password) nextErrors.password = 'Please enter a password.'
    else if (password.length < 8) nextErrors.password = 'Password should be at least 8 characters.'
    if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your password.'
    else if (confirmPassword !== password) nextErrors.confirmPassword = 'Passwords do not match.'
    return nextErrors
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setIsSubmitting(true)
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    setIsSubmitting(false)
    setIsComplete(true)
  }

  return (
    <main className="route-shell auth-shell">
      <Brand />
      <section className="surface-card auth-card">
        {!isComplete ? (
          <>
            <span className="eyebrow route-eyebrow">JOIN THE PAU COMMUNITY</span>
            <h1>Create your account</h1>
            <p>Set up your student profile so you can discover businesses and share your own offers.</p>
            <form className="stack-form" onSubmit={submit} noValidate>
              <label htmlFor="signup-fullname">Full name</label>
              <input
                id="signup-fullname"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                aria-invalid={Boolean(errors.fullName)}
              />
              {errors.fullName ? <small className="field-error">{errors.fullName}</small> : null}

              <label htmlFor="signup-email">Email address</label>
              <input
                id="signup-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? <small className="field-error">{errors.email}</small> : null}

              <label htmlFor="signup-password">Password</label>
              <div className="password-field">
                <input
                  id="signup-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password ? <small className="field-error">{errors.password}</small> : null}

              <label htmlFor="signup-confirm-password">Confirm password</label>
              <div className="password-field">
                <input
                  id="signup-confirm-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword ? <small className="field-error">{errors.confirmPassword}</small> : null}

              <button className="button primary" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </button>
            </form>
            <p className="route-meta">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </>
        ) : (
          <div className="success-state">
            <span className="eyebrow route-eyebrow">ACCOUNT READY</span>
            <h1>Welcome, {fullName.split(' ')[0] || 'friend'}!</h1>
            <p>
              Your signup details were captured in this demo flow. Next, head to the login screen or go straight to the feed
              to explore sample campus offers.
            </p>
            <div className="inline-actions">
              <button className="button primary" onClick={() => navigate('/login')}>
                Go to login
              </button>
              <button className="button secondary" onClick={() => navigate('/feed')}>
                Explore businesses
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function Feed({ posts, businesses }: { posts: Post[]; businesses: Business[] }) {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'All' | Category>('All')

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory
      const searchText = `${post.title} ${post.description} ${post.businessName}`.toLowerCase()
      const matchesQuery = !query.trim() || searchText.includes(query.toLowerCase())
      return matchesCategory && matchesQuery
    })
  }, [posts, query, selectedCategory])

  return (
    <main className="feed-shell">
      <aside className="feed-sidebar" aria-label="Feed navigation">
        <Brand />
        <nav className="sidebar-nav">
          <NavLink to="/feed" className="nav-item">
            <Home size={17} /> Home feed
          </NavLink>
          <NavLink to="/business/setup" className="nav-item">
            <Building2 size={17} /> Set up business
          </NavLink>
          <NavLink to="/posts/new" className="nav-item">
            <Plus size={17} /> Create post
          </NavLink>
        </nav>
        <div className="sidebar-callout">
          <h3>Campus marketplace</h3>
          <p>Browse demos now. Save your business profile and your posts will appear in this feed.</p>
          <Link className="button gold" to="/posts/new">
            New post
          </Link>
        </div>
      </aside>

      <section className="feed-content">
        <header className="feed-header">
          <div>
            <span className="eyebrow route-eyebrow">DISCOVER · SUPPORT · GROW</span>
            <h1>Home feed</h1>
            <p>Find student-run offers around campus and connect directly with the business owners.</p>
          </div>
          <Link className="button primary" to="/posts/new">
            <Plus size={16} /> Create post
          </Link>
        </header>

        <label className="search-box" htmlFor="feed-search">
          <Search size={16} />
          <input
            id="feed-search"
            placeholder="Search posts or businesses"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="chip-row" role="group" aria-label="Post categories">
          <button
            className={`chip ${selectedCategory === 'All' ? 'chip-active' : ''}`}
            onClick={() => setSelectedCategory('All')}
            type="button"
          >
            All
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              className={`chip ${selectedCategory === category ? 'chip-active' : ''}`}
              onClick={() => setSelectedCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        {filteredPosts.length ? (
          <div className="post-grid">
            {filteredPosts.map((post) => (
              <article key={post.id} className="post-card">
                <img src={sanitizeImageUrl(post.imageUrl)} alt={post.title} />
                <div className="post-card-body">
                  <small>{post.category}</small>
                  <h3>{post.title}</h3>
                  <p>{post.description}</p>
                  <div className="post-meta">
                    <span>{post.price || 'Price on request'}</span>
                    <span>{post.availability}</span>
                  </div>
                  <div className="post-links">
                    <Link to={`/posts/${post.id}`}>View details</Link>
                    <Link to={`/businesses/${post.businessId}`}>Visit business</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <ListFilter size={24} />
            <h3>No posts match your search yet.</h3>
            <p>Try another category or clear your search. You can also create a new demo post.</p>
            <Link className="button primary" to="/posts/new">
              Create a post
            </Link>
          </div>
        )}

        <section className="surface-card business-shortcuts">
          <h2>Explore businesses</h2>
          <div className="business-list">
            {businesses.map((business) => (
              <Link key={business.id} to={`/businesses/${business.id}`} className="business-list-item">
                <img src={sanitizeImageUrl(business.logoUrl)} alt={`${business.name} logo`} />
                <span>
                  <strong>{business.name}</strong>
                  <small>{business.category}</small>
                </span>
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
        </section>
      </section>

      <nav className="mobile-nav" aria-label="Mobile feed actions">
        <Link to="/feed" aria-label="Home feed">
          <Home size={18} />
          <span>Feed</span>
        </Link>
        <Link to="/business/setup" aria-label="Business setup">
          <Store size={18} />
          <span>Business</span>
        </Link>
        <Link to="/posts/new" aria-label="Create post">
          <Plus size={18} />
          <span>Create</span>
        </Link>
      </nav>
    </main>
  )
}

function PostDetails({ posts, businesses }: { posts: Post[]; businesses: Business[] }) {
  const { postId } = useParams()
  const post = posts.find((entry) => entry.id === postId)

  if (!post) {
    return (
      <main className="route-shell">
        <Brand />
        <div className="surface-card not-found-card">
          <h1>Post not found</h1>
          <p>That post may have been removed from this demo feed. Return to feed and pick another offer.</p>
          <div className="inline-actions">
            <Link className="button primary" to="/feed">
              Back to feed
            </Link>
            <Link className="button secondary" to="/posts/new">
              Create a post
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const business = businesses.find((entry) => entry.id === post.businessId)

  return (
    <main className="route-shell post-details-shell">
      <Brand />
      <article className="surface-card post-details-card">
        <img src={sanitizeImageUrl(post.imageUrl)} alt={post.title} className="detail-image" />
        <div className="detail-content">
          <small>{post.category}</small>
          <h1>{post.title}</h1>
          <p>{post.description}</p>
          <div className="detail-grid">
            <div>
              <h3>Price</h3>
              <p>{post.price || 'Price on request'}</p>
            </div>
            <div>
              <h3>Availability</h3>
              <p>{post.availability}</p>
            </div>
          </div>
          <section className="seller-card">
            <h2>Seller information</h2>
            <p>
              <strong>{business?.name || post.businessName}</strong>
              <br />
              {business?.description || 'Campus business from the PAU community.'}
            </p>
            <div className="inline-actions">
              <Link className="button secondary" to={`/businesses/${post.businessId}`}>
                View business profile
              </Link>
              <a className="button primary" href={formatWhatsAppLink(business?.whatsapp || '+234000000000')} target="_blank" rel="noreferrer">
                <Phone size={16} /> Contact on WhatsApp
              </a>
            </div>
          </section>
        </div>
      </article>
    </main>
  )
}

function BusinessProfile({ businesses, posts }: { businesses: Business[]; posts: Post[] }) {
  const { businessId } = useParams()
  const business = businesses.find((entry) => entry.id === businessId)

  if (!business) {
    return (
      <main className="route-shell">
        <Brand />
        <div className="surface-card not-found-card">
          <h1>Business not found</h1>
          <p>We could not find that business in the current demo data.</p>
          <div className="inline-actions">
            <Link className="button primary" to="/feed">
              Back to feed
            </Link>
            <Link className="button secondary" to="/business/setup">
              Set up your business
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const businessPosts = posts.filter((post) => post.businessId === business.id)

  return (
    <main className="route-shell">
      <Brand />
      <section className="surface-card profile-card">
        <div className="profile-header">
          <img src={sanitizeImageUrl(business.logoUrl)} alt={`${business.name} logo`} />
          <div>
            <small>{business.category}</small>
            <h1>{business.name}</h1>
            <p>{business.description}</p>
          </div>
        </div>
        <div className="contact-row">
          <a href={formatWhatsAppLink(business.whatsapp)} target="_blank" rel="noreferrer">
            <Phone size={16} /> {business.whatsapp}
          </a>
          <span>{business.email}</span>
          <span>{business.location}</span>
        </div>

        <h2>Business posts</h2>
        {businessPosts.length ? (
          <div className="profile-posts">
            {businessPosts.map((post) => (
              <Link key={post.id} to={`/posts/${post.id}`} className="profile-post-item">
                <img src={sanitizeImageUrl(post.imageUrl)} alt={post.title} />
                <span>
                  <strong>{post.title}</strong>
                  <small>{post.price || 'Price on request'} · {post.availability}</small>
                </span>
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state compact-empty">
            <h3>No posts from this business yet.</h3>
            <p>Check back soon or add a post in the create-post flow.</p>
          </div>
        )}
      </section>
    </main>
  )
}

function BusinessSetup({ onSave, currentBusiness }: { onSave: (business: Business) => void; currentBusiness: Business | null }) {
  const [draft, setDraft] = useState<BusinessDraft>({
    name: currentBusiness?.name || '',
    description: currentBusiness?.description || '',
    category: currentBusiness?.category || 'Other',
    whatsapp: currentBusiness?.whatsapp || '',
    logoUrl: currentBusiness?.logoUrl || '',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState(currentBusiness?.logoUrl || '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const update = (key: keyof BusinessDraft, value: string) => {
    setDraft((state) => ({ ...state, [key]: value }))
    setIsSaved(false)
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!draft.name.trim()) nextErrors.name = 'Business name is required.'
    if (!draft.description.trim()) nextErrors.description = 'Please add a short business description.'
    if (!draft.whatsapp.trim()) nextErrors.whatsapp = 'WhatsApp number is required for contact.'
    else if (!/^[\d+\s-]{7,}$/.test(draft.whatsapp)) nextErrors.whatsapp = 'Please enter a valid WhatsApp number.'
    return nextErrors
  }

  const handleFileChange = async (file: File | null) => {
    setLogoFile(file)
    if (!file) {
      if (!draft.logoUrl) setLogoPreview('')
      return
    }
    const preview = await fileToDataUrl(file)
    setLogoPreview(preview)
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setIsSaving(true)
    let savedLogo = draft.logoUrl.trim()
    if (logoFile) {
      savedLogo = await fileToDataUrl(logoFile)
    }

    const savedBusiness: Business = {
      id: MY_BUSINESS_ID,
      name: draft.name.trim(),
      description: draft.description.trim(),
      category: draft.category,
      whatsapp: draft.whatsapp.trim(),
      email: 'yourbiz@pau.demo',
      location: 'PAU campus',
      logoUrl: savedLogo || 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=200&q=80',
    }

    onSave(savedBusiness)
    setIsSaving(false)
    setIsSaved(true)
  }

  return (
    <main className="route-shell">
      <Brand />
      <section className="surface-card form-card">
        <span className="eyebrow route-eyebrow">BUSINESS SETUP</span>
        <h1>Set up your business profile</h1>
        <p>Saved data stays in your browser using localStorage for this demo experience.</p>

        <form className="stack-form" onSubmit={submit} noValidate>
          <label htmlFor="business-name">Business name</label>
          <input id="business-name" value={draft.name} onChange={(event) => update('name', event.target.value)} aria-invalid={Boolean(errors.name)} />
          {errors.name ? <small className="field-error">{errors.name}</small> : null}

          <label htmlFor="business-description">Description</label>
          <textarea
            id="business-description"
            rows={4}
            value={draft.description}
            onChange={(event) => update('description', event.target.value)}
            aria-invalid={Boolean(errors.description)}
          />
          {errors.description ? <small className="field-error">{errors.description}</small> : null}

          <label htmlFor="business-category">Category</label>
          <select id="business-category" value={draft.category} onChange={(event) => update('category', event.target.value)}>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <label htmlFor="business-whatsapp">WhatsApp number</label>
          <input
            id="business-whatsapp"
            value={draft.whatsapp}
            onChange={(event) => update('whatsapp', event.target.value)}
            placeholder="+234..."
            aria-invalid={Boolean(errors.whatsapp)}
          />
          {errors.whatsapp ? <small className="field-error">{errors.whatsapp}</small> : null}

          <label htmlFor="business-logo-url">Logo URL (optional)</label>
          <input
            id="business-logo-url"
            value={draft.logoUrl}
            onChange={(event) => {
              update('logoUrl', event.target.value)
              if (event.target.value) setLogoPreview(event.target.value)
            }}
            placeholder="https://..."
          />

          <label htmlFor="business-logo-file">Or upload logo (optional)</label>
          <input id="business-logo-file" type="file" accept="image/*" onChange={(event) => void handleFileChange(event.target.files?.[0] || null)} />

          {logoPreview ? <img className="image-preview" src={sanitizeImageUrl(logoPreview)} alt="Business logo preview" /> : null}

          <button className="button primary" disabled={isSaving}>
            {isSaving ? 'Saving profile...' : 'Save business profile'}
          </button>
        </form>

        {isSaved ? <p className="success-pill">Saved. Your business profile is now available in this demo feed.</p> : null}
      </section>
    </main>
  )
}

function CreatePost({ onPublish, business }: { onPublish: (post: Post) => void; business: Business | null }) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState<CreatePostDraft>({
    title: '',
    description: '',
    category: business?.category || 'Other',
    price: '',
    availability: '',
    imageUrl: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishedPost, setPublishedPost] = useState<Post | null>(null)

  const update = (key: keyof CreatePostDraft, value: string) => setDraft((state) => ({ ...state, [key]: value }))

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!draft.title.trim()) nextErrors.title = 'Post title is required.'
    if (!draft.description.trim()) nextErrors.description = 'Post description is required.'
    if (!draft.availability.trim()) nextErrors.availability = 'Please describe availability.'
    if (!imagePreview && !draft.imageUrl.trim()) nextErrors.image = 'Add an image URL or upload a file.'
    return nextErrors
  }

  const handleFileChange = async (file: File | null) => {
    setImageFile(file)
    if (!file) {
      if (!draft.imageUrl.trim()) setImagePreview('')
      return
    }
    const preview = await fileToDataUrl(file)
    setImagePreview(preview)
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setIsPublishing(true)
    let image = draft.imageUrl.trim()
    if (imageFile) image = await fileToDataUrl(imageFile)
    if (!image && imagePreview) image = imagePreview

    const nextPost: Post = {
      id: `post-${Date.now()}`,
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      price: draft.price.trim() || undefined,
      availability: draft.availability.trim(),
      imageUrl: image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80',
      businessId: business?.id || sampleBusinesses[0].id,
      businessName: business?.name || sampleBusinesses[0].name,
    }

    onPublish(nextPost)
    setIsPublishing(false)
    setPublishedPost(nextPost)
    setDraft({ title: '', description: '', category: business?.category || 'Other', price: '', availability: '', imageUrl: '' })
    setImageFile(null)
    setImagePreview('')
  }

  return (
    <main className="route-shell">
      <Brand />
      <section className="surface-card form-card create-post-layout">
        <div>
          <span className="eyebrow route-eyebrow">CREATE A POST</span>
          <h1>Publish a campus offer</h1>
          <p>Your published post is saved locally in this browser and appears immediately in the feed.</p>

          <form className="stack-form" onSubmit={submit} noValidate>
            <label htmlFor="post-title">Post title</label>
            <input id="post-title" value={draft.title} onChange={(event) => update('title', event.target.value)} aria-invalid={Boolean(errors.title)} />
            {errors.title ? <small className="field-error">{errors.title}</small> : null}

            <label htmlFor="post-description">Description</label>
            <textarea
              id="post-description"
              rows={4}
              value={draft.description}
              onChange={(event) => update('description', event.target.value)}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description ? <small className="field-error">{errors.description}</small> : null}

            <label htmlFor="post-category">Category</label>
            <select id="post-category" value={draft.category} onChange={(event) => update('category', event.target.value)}>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <label htmlFor="post-price">Price (optional)</label>
            <input id="post-price" value={draft.price} onChange={(event) => update('price', event.target.value)} placeholder="e.g. ₦3,500" />

            <label htmlFor="post-availability">Availability</label>
            <input
              id="post-availability"
              value={draft.availability}
              onChange={(event) => update('availability', event.target.value)}
              placeholder="e.g. Available weekdays from 2 p.m."
              aria-invalid={Boolean(errors.availability)}
            />
            {errors.availability ? <small className="field-error">{errors.availability}</small> : null}

            <label htmlFor="post-image-url">Image URL fallback</label>
            <input
              id="post-image-url"
              value={draft.imageUrl}
              onChange={(event) => {
                update('imageUrl', event.target.value)
                if (event.target.value) setImagePreview(event.target.value)
              }}
              placeholder="https://..."
            />

            <label htmlFor="post-image-file">Or upload image</label>
            <input id="post-image-file" type="file" accept="image/*" onChange={(event) => void handleFileChange(event.target.files?.[0] || null)} />
            {errors.image ? <small className="field-error">{errors.image}</small> : null}

            <button className="button primary" disabled={isPublishing}>
              {isPublishing ? 'Publishing...' : 'Publish post'}
            </button>
          </form>

          {publishedPost ? (
            <div className="success-pill">
              Published <strong>{publishedPost.title}</strong>. <button onClick={() => navigate('/feed')}>Go to feed</button>
            </div>
          ) : null}
        </div>

        <aside className="preview-panel" aria-label="Post preview">
          <h2>Preview</h2>
          <div className="preview-card">
            {imagePreview || draft.imageUrl ? (
              <img src={sanitizeImageUrl(imagePreview || draft.imageUrl)} alt="Post preview" className="detail-image" />
            ) : (
              <div className="preview-placeholder">Image preview appears here</div>
            )}
            <h3>{draft.title || 'Your post title'}</h3>
            <p>{draft.description || 'Describe what students should know about this offer.'}</p>
            <small>{draft.category}</small>
            <small>{draft.price || 'Price on request'}</small>
            <small>{draft.availability || 'Add availability details'}</small>
          </div>
        </aside>
      </section>
    </main>
  )
}

function ScreenHandoff({ title, owner }: { title: string; owner: string }) {
  return (
    <main className="handoff">
      <Brand />
      <span className="eyebrow">BUILD IN PROGRESS</span>
      <h1>{title}</h1>
      <p>This route is ready for {owner}’s screen. The welcome page is the first completed iteration.</p>
      <Link to="/" className="button primary">
        <ChevronLeft size={18} /> Back to welcome
      </Link>
    </main>
  )
}

export default function App() {
  const [savedBusiness, setSavedBusiness] = useState<Business | null>(() => readStoredBusiness())
  const [createdPosts, setCreatedPosts] = useState<Post[]>(() => readStoredPosts())

  const businesses = useMemo(() => {
    if (!savedBusiness) return sampleBusinesses
    const rest = sampleBusinesses.filter((business) => business.id !== MY_BUSINESS_ID)
    return [savedBusiness, ...rest]
  }, [savedBusiness])

  const posts = useMemo(() => [...createdPosts, ...samplePosts], [createdPosts])

  const saveBusiness = (business: Business) => {
    setSavedBusiness(business)
    window.localStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(business))
  }

  const publishPost = (post: Post) => {
    setCreatedPosts((state) => {
      const nextPosts = [post, ...state]
      window.localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(nextPosts))
      return nextPosts
    })
  }

  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<ScreenHandoff title="Welcome back." owner="Vincent" />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/feed" element={<Feed posts={posts} businesses={businesses} />} />
      <Route path="/posts/new" element={<CreatePost business={savedBusiness} onPublish={publishPost} />} />
      <Route path="/posts/:postId" element={<PostDetails posts={posts} businesses={businesses} />} />
      <Route path="/businesses/:businessId" element={<BusinessProfile businesses={businesses} posts={posts} />} />
      <Route path="/business/setup" element={<BusinessSetup currentBusiness={savedBusiness} onSave={saveBusiness} />} />
      <Route path="*" element={<ScreenHandoff title="Let’s get you back on campus." owner="the team" />} />
    </Routes>
  )
}
