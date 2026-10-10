import AdminPage from './AdminPage'
import BusinessReviewStatus from './BusinessReviewStatus'
import CampusImage from './CampusImage'
import SocialActions from './SocialActions'
import { categoryImage } from './media'
import ProfileEditor from './ProfileEditor'
import { prepareImage } from './images'
import { backendReady, currentUser } from './auth'
import { listBusinesses, listOwnedBusinesses, listPosts, persistBusiness, persistPost } from './database'
import ManagePosts from './ManagePosts'
import CampusFeed from './CampusFeed'
import { AccountAccess, Account } from './AccountScreens'
import './campus.css'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness, Building2, UserRound,
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

type Role = 'student' | 'business'
type Category = 'Food & drinks' | 'Beauty & grooming' | 'Tech & services' | 'Fashion' | 'Academic support' | 'Wellness' | 'Transport' | 'Other'

type Business = {
  id: string
  name: string
  description: string
  category: Category
  whatsapp: string
  email: string
  location: string
  logoUrl: string
  approval_status?: 'pending'|'approved'|'rejected'
  review_note?: string
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
const CATEGORIES: Category[] = ['Food & drinks', 'Beauty & grooming', 'Tech & services', 'Fashion', 'Academic support', 'Wellness', 'Transport', 'Other']

const sampleBusinesses: Business[] = [
  {
    id: 'snack-hub',
    name: 'Sweet Discovery',
    description: 'Snacks for the PAU community. Business details are awaiting owner confirmation.',
    category: 'Food & drinks',
    whatsapp: '',
    email: '',
    location: 'Main Cafeteria Walkway, PAU',
    logoUrl: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'campus-cuts',
    name: 'Aleftav Shuttle',
    description: 'Off-campus transportation for the PAU community. Contact details and schedules will be added by the business owner.',
    category: 'Transport',
    whatsapp: '',
    email: '',
    location: 'Hostel Square, PAU',
    logoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'laptop-fixers',
    name: 'Laptop Fixers',
    description: 'Fast troubleshooting, software cleanup, and accessory recommendations by classmates.',
    category: 'Tech & services',
    whatsapp: '',
    email: '',
    location: 'Innovation Hub, PAU',
    logoUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80',
  },
]

const samplePosts: Post[] = [
  {
    id: 'post-coffee-box',
    businessId: 'snack-hub',
    businessName: 'Sweet Discovery',
    title: 'Breakfast Combo Box',
    description: 'Discover snacks from Sweet Discovery. Ask the owner about the current menu and availability.',
    category: 'Food & drinks',
    imageUrl: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&w=1200&q=80',
    price: undefined,
    availability: 'Ask owner for availability',
  },
  {
    id: 'post-braids',
    businessId: 'campus-cuts',
    businessName: 'Aleftav Shuttle',
    title: 'Off-campus transportation',
    description: 'Explore off-campus transportation with Aleftav Shuttle. Request current routes and pickup information from the business owner.',
    category: 'Transport',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    price: undefined,
    availability: 'Contact owner for current schedule',
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
  { name: 'Sweet Discovery', category: 'Food & drinks', title: 'Your next study-break craving.', icon: Coffee, style: 'food', label: 'Fresh on campus', price: 'Small bites. Big mood.' },
  { name: 'Aleftav Shuttle', category: 'Transport', title: 'A fresh look, between lectures.', icon: Scissors, style: 'beauty', label: 'Made for your schedule', price: 'Your campus glow-up.' },
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

const fileToDataUrl = prepareImage

function formatWhatsAppLink(number: string, title?:string) {
  const normalized = number.replace(/[^\d+]/g, '')
  const value = /^0\d{10}$/.test(normalized) ? '234' + normalized.slice(1) : normalized.startsWith('+') ? normalized.slice(1) : normalized
  return `https://wa.me/${value}${title ? '?text=' + encodeURIComponent('Hi! I found your offer "' + title + '" on PAU biziz. Is it available?') : ''}`
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
      <main className="welcome-main">
        <section className="hero" aria-labelledby="onboarding-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> SAME CAMPUS. MORE POSSIBILITIES.
            </p>
            <h1 id="onboarding-title">Discover. Support. Grow.</h1>
            <p className="hero-intro">
              PAU biziz helps students discover campus businesses and helps business owners reach their next
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
                Explore businesses <ArrowRight size={16} />
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
                Discover your campus community
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
          confirmation: 'Demo details accepted. Continue to set up your business; no account has been created.',
        }
      : {
          title: 'Create your student account',
          subtitle: 'Join PAU biziz to discover, support, and grow with campus businesses.',
          confirmation: 'Demo details accepted. Explore the feed; no account has been created.',
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
            <Link className="button gold" to={role === 'business' ? '/business/setup' : '/feed'}>
              Continue to demo <ArrowRight size={17} />
            </Link>
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
                <CampusImage category={post.category} src={sanitizeImageUrl(post.imageUrl)} alt={post.title} />
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
                <CampusImage category={business.category} src={sanitizeImageUrl(business.logoUrl)} alt={`${business.name} logo`} />
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
          <p>That post may have been removed from the feed. Return to feed and pick another offer.</p>
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
      <Link className="button secondary profile-back" to="/feed"><ChevronLeft size={17}/>Back to feed</Link>
      <Brand />
      <article className="surface-card post-details-card">
        <CampusImage category={post.category} src={sanitizeImageUrl(post.imageUrl)} alt={post.title} className="detail-image" />
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
          <SocialActions postId={post.id}/>
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
              <a className="button primary" aria-disabled={!business?.whatsapp} onClick={e=>{if(!business?.whatsapp)e.preventDefault()}} href={business?.whatsapp ? formatWhatsAppLink(business.whatsapp,post.title) : undefined} target="_blank" rel="noreferrer">
                <Phone size={16} /> {business?.whatsapp ? 'Contact on WhatsApp' : 'Contact details coming soon'}
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
          <p>We could not find that business in the directory.</p>
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
      <Link className="button secondary profile-back" to="/feed"><ChevronLeft size={17}/>Back to feed</Link>
      <Brand />
      <section className="surface-card profile-card">
        <div className="profile-header">
          <CampusImage category={business.category} src={sanitizeImageUrl(business.logoUrl)} alt={`${business.name} logo`} />
          <div>
            <small>{business.category}</small>
            <h1>{business.name}</h1>
            <p>{business.description}</p>
          </div>
        </div>
        <div className="contact-row">
          <a href={formatWhatsAppLink(business.whatsapp)} target="_blank" rel="noreferrer">
            <Phone size={16} /> {business.whatsapp || 'Contact details coming soon'}
          </a>
          <span>{business.email}</span>
          <span>{business.location}</span>
        </div>

        <h2>Business posts</h2>
        {businessPosts.length ? (
          <div className="profile-posts">
            {businessPosts.map((post) => (
              <Link key={post.id} to={`/posts/${post.id}`} className="profile-post-item">
                <CampusImage category={post.category} src={sanitizeImageUrl(post.imageUrl)} alt={post.title} />
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
  const navigate = useNavigate()
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

  useEffect(()=>{if(!currentBusiness)return;setDraft({name:currentBusiness.name,description:currentBusiness.description,category:currentBusiness.category,whatsapp:currentBusiness.whatsapp,logoUrl:currentBusiness.logoUrl});setLogoPreview(currentBusiness.logoUrl)},[currentBusiness?.id])
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
    setLogoPreview(preview); setIsSaved(false)
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setIsSaving(true)
    let savedLogo = logoPreview || draft.logoUrl.trim()


    const savedBusiness: Business = {
      id: currentBusiness?.id || MY_BUSINESS_ID,
      name: draft.name.trim(),
      description: draft.description.trim(),
      category: draft.category,
      whatsapp: draft.whatsapp.trim(),
      email: '',
      location: 'PAU campus',
      logoUrl: savedLogo || categoryImage(draft.category,200),
    }

    try { await onSave(savedBusiness) } catch(error) { setErrors({name: error instanceof Error ? error.message : 'Unable to save'}); setIsSaving(false); return }
    setIsSaving(false)
    setIsSaved(true)
    navigate('/business/status', {replace:true})
  }

  return (
    <main className="route-shell">
      <Brand />
      <section className="surface-card form-card">
        <span className="eyebrow route-eyebrow">BUSINESS SETUP</span>
        <h1>{currentBusiness ? 'Edit your business profile' : 'Set up your business profile'}</h1>
        <p>Submit your business for review against PAU’s verified student-business list. Approved businesses can publish offers. Changes to your business details require another review.</p>{currentBusiness&&<p className="review-note">Status: {currentBusiness.approval_status||'pending'}{currentBusiness.review_note?` · ${currentBusiness.review_note}`:''}</p>}

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
          <input id="business-logo-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { void handleFileChange(event.target.files?.[0] || null).catch(error => setErrors({image: error.message, name:error.message})); }} />

          {logoPreview ? <><CampusImage className="image-preview" src={sanitizeImageUrl(logoPreview)} alt="Business logo preview" /><button type="button" className="button secondary" onClick={()=>{setLogoPreview('');setLogoFile(null);update('logoUrl','')}}>Remove logo</button></> : null}

          <button className="button primary" disabled={isSaving}>
            {isSaving ? 'Submitting...' : 'Submit business for review'}
          </button>
        </form>

        {isSaved ? <p className="success-pill">Business profile saved. <Link to="/feed">Go to feed →</Link></p> : null}
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
    if(draft.imageUrl.trim()){try{if(new URL(draft.imageUrl.trim()).pathname==='/' )nextErrors.image='Use a direct image link, not a website homepage, or upload your photo.'}catch{nextErrors.image='Enter a valid image URL or upload a photo.'}}
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

    try { await onPublish(nextPost) } catch(error) { setErrors({title: error instanceof Error ? error.message : 'Unable to publish'}); setIsPublishing(false); return }
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
          <p>Share your latest products, services, and offers with your campus.</p>

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
            <input id="post-image-file" type="file" accept="image/*" onChange={(event) => { void handleFileChange(event.target.files?.[0] || null).catch(error => setErrors({image: error.message, name:error.message})); }} />
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
              <CampusImage src={sanitizeImageUrl(imagePreview || draft.imageUrl)} alt="Post preview" className="detail-image" />
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
  const routeLocation = useLocation()
  const [savedBusiness, setSavedBusiness] = useState<Business | null>(() => readStoredBusiness())
  const [createdPosts, setCreatedPosts] = useState<Post[]>(() => readStoredPosts())

  const [remoteBusinesses, setRemoteBusinesses] = useState<Business[]>([])
  const [remotePosts, setRemotePosts] = useState<Post[]>([])
  useEffect(() => { if (!backendReady) return; Promise.all([listBusinesses(),listPosts(),listOwnedBusinesses()]).then(([bs,ps,owned])=>{
    const visible=bs.filter((b:any)=>b.approval_status==='approved');const preferred=visible.filter((b:any)=>!visible.some((other:any)=>other.id!==b.id&&other.owner_id===b.owner_id&&other.name.trim().toLowerCase()===b.name.trim().toLowerCase()&&ps.some((p:any)=>p.business_id===other.id)&&!ps.some((p:any)=>p.business_id===b.id)));const mapped=preferred.map((b:any)=>({...b,logoUrl:!b.logo_url || b.logo_url.includes('photo-1556157382-97eda2d62296') ? categoryImage(b.category,200) : b.logo_url,email:'',location:'PAU campus'}));setRemoteBusinesses(mapped);
    setRemotePosts(ps.filter((p:any)=>mapped.some((b:Business)=>b.id===p.business_id)).map((p:any)=>({...p,businessId:p.business_id,businessName:mapped.find((b:Business)=>b.id===p.business_id)?.name||'Campus business',imageUrl:p.image_url})));
    const session=JSON.parse(localStorage.getItem('biziz-session')||'null');const mine=owned.find((b:any)=>b.owner_id===session?.user?.id&&ps.some((p:any)=>p.business_id===b.id))||owned.find((b:any)=>b.owner_id===session?.user?.id);setSavedBusiness(mine?{...mine,logoUrl:mine.logo_url||categoryImage(mine.category,200),email:'',location:'PAU campus'}:null)
  }).catch(()=>{}); }, [routeLocation.pathname])
  const businesses = useMemo(() => backendReady?remoteBusinesses:sampleBusinesses,[remoteBusinesses])
  const posts = useMemo(() => backendReady?remotePosts:samplePosts,[remotePosts])

  const saveBusiness = async (business: Business) => {
    const row = await persistBusiness(business); business = {...business,id:row.id,approval_status:row.approval_status,review_note:row.review_note}
    setSavedBusiness(business)
    window.localStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(business))
  }

  const publishPost = async (post: Post) => {
    if (!savedBusiness) throw new Error('Set up your business before publishing.');if(savedBusiness.approval_status!=='approved')throw new Error('Your business must be approved before publishing.'); const row = await persistPost({...post,businessId:savedBusiness.id}); post = {...post,id:row.id,businessId:savedBusiness.id,businessName:savedBusiness.name}
    setRemotePosts(state=>[post,...state]);
    setCreatedPosts((state) => {
      const nextPosts = [post, ...state]
      window.localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(nextPosts))
      return nextPosts
    })
  }

  return (
    <Routes>
      <Route path="/admin" element={<AdminPage/>}/>
      <Route path="/business/status" element={<BusinessReviewStatus business={savedBusiness}/>}/>
      {['/posts/manage','/posts/:postId/edit'].map(path=><Route key={path} path={path} element={<ManagePosts onUpdated={row=>{const change=(p:Post)=>p.id===row.id?{...p,...row,category:row.category as Category,imageUrl:row.image_url}:p;setRemotePosts(state=>state.map(change));setCreatedPosts(state=>{const next=state.map(change);localStorage.setItem(POSTS_STORAGE_KEY,JSON.stringify(next));return next})}}/>}/>)}
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<AccountAccess mode="login" />} />
      <Route path="/account/edit" element={<ProfileEditor />} />
      <Route path="/account" element={<Account />} />
      <Route path="/signup" element={<AccountAccess mode="signup" />} />
      <Route path="/search" element={<Navigate to={'/explore'+routeLocation.search} replace/>}/>
      {['/explore','/notifications','/saved','/following'].map(path=><Route key={path} path={path} element={<CampusFeed posts={posts} businesses={businesses} businessReview={savedBusiness}/>} />)}
      <Route path="/feed" element={<CampusFeed posts={posts} businesses={businesses} businessReview={savedBusiness} />} />
      <Route path="/posts/new" element={!currentUser() ? <Navigate to="/login?role=business" replace /> : !savedBusiness ? <Navigate to="/business/setup" replace /> : savedBusiness.approval_status!=='approved' ? <Navigate to="/business/status" replace/> : <CreatePost business={savedBusiness} onPublish={publishPost} />} />
      <Route path="/posts/:postId" element={<PostDetails posts={posts} businesses={businesses} />} />
      <Route path="/businesses/:businessId" element={<BusinessProfile businesses={businesses} posts={posts} />} />
      <Route path="/business/setup" element={currentUser() ? <BusinessSetup currentBusiness={savedBusiness} onSave={saveBusiness} /> : <Navigate to="/login?role=business" replace />} />
      <Route path="*" element={<ScreenHandoff title="Let’s get you back on campus." owner="the team" />} />
    </Routes>
  )
}








