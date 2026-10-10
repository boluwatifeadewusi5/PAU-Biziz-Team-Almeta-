# PAU biziz
 
**Discover what PAU businesses offer, and find what you need when you need it.**
 
A searchable campus business feed where students find products, services, and offers, and where business owners reach them.
 
[**Live App (PWA)**](https://pau-biziz.vercel.app/) · [**Repository**](https://github.com/boluwatifeadewusi5/PAU-Biziz-Team-Almeta-.git) · [**Report an Issue**](https://github.com/boluwatifeadewusi5/PAU-Biziz-Team-Almeta-.git/issues)
 
![Status](https://img.shields.io/badge/status-demo%20MVP-blue)
![Platform](https://img.shields.io/badge/platform-PWA-informational)
![License](https://img.shields.io/badge/license-TBD-lightgrey)
 
---
 
## Table of Contents
 
- [Overview](#overview)
- [The Problem](#the-problem)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [MVP Scope](#mvp-scope)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Quality Standards](#quality-standards)
- [Roadmap](#roadmap)
- [Team](#team)
- [Contributing](#contributing)
- [License](#license)
---
 
## Overview
 
PAU biziz connects students at Pan-Atlantic University with campus businesses. Business owners publish a persistent profile and post their products, services, and offers in a social-style feed. Students browse the feed, search by keyword, filter by category, inspect a business, and contact the seller directly on WhatsApp.
 
| User | Goal | What they do |
|---|---|---|
| **Student** | Find useful campus products and services | Browse, search, inspect, contact |
| **Business owner** | Reach students and keep offers current | Set up a profile, publish, edit, mark unavailable |
 
Students can browse without signing in. Owners authenticate before publishing.
 
## The Problem
 
Campus businesses already reach students through channels such as school email, but promotions sent this way are easy to miss and hard to find again when a need arises. PAU biziz gives businesses a lasting, searchable presence and gives students one place to look.
 
> **Note:** This is a working hypothesis, being validated through student and owner interviews (how students discover businesses, whether they miss useful offers, and how owners currently reach students).
 
## Key Features
 
**For students**
- **Discover feed:** newest available posts first, with image, title, business name, and price.
- **Keyword search:** case-insensitive matching across post titles and descriptions and business names and descriptions, with posts and businesses listed separately.
- **Category filters:** Food, Fashion, Academics, Tech, and Services. Filters combine with search.
- **Post details and business profiles:** price, availability, description, posting date, and all of a business's posts.
- **WhatsApp contact:** one tap opens a pre-filled message referring to the selected post.
**For business owners**
- **Business profile:** name, category, description, WhatsApp number, and optional pickup or delivery information.
- **Post publishing:** create a post with a preview, then publish it to the feed, search, and your profile.
- **Price modes:** a numeric NGN price or "Contact for price."
- **Post management:** edit posts and toggle availability. Unavailable posts leave the feed but keep their details.
## How It Works
 
**Student journey**
 
```
Discover → browse / filter / search → open post → check price, availability, business → contact on WhatsApp
```
 
**Owner journey**
 
```
Sell on PAU biziz → sign in → create business profile → dashboard → create post → preview → publish
```
 
Orders, payment, and fulfilment are arranged directly between student and seller, outside the app.
 
## MVP Scope
 
This repository contains a five-hour demonstration MVP focused on one end-to-end journey: publish, search, contact.
 
**Not included in this release:** following, saved posts, likes, comments, payments or checkout, in-app messaging, recommendations, ratings, notifications, campus verification, and automated email roundups. See the [Roadmap](#roadmap).
 
> The demo is not an unrestricted public launch. A public rollout needs decisions on owner eligibility, abuse reporting, moderation, and contact-data complaints.
 
## Tech Stack
 
> Replace the placeholders below with your chosen stack.
 
| Layer | Technology |
|---|---|
| Frontend | `< Typescript, React, CSS>` |
| Backend / data service | `<Python (FastAPI), SQLite, OpenAPI, scrypt etc.>` |
| Authentication | `<SupaBase Auth>` |
| Image storage | `<Cloud Storage>` |
| Hosting | `<Vercel>` |
 
## Getting Started
 
Access the live PWA at vthis link: 

 
### Demo owner account
 
A prepared owner account is used for the demonstration. Credentials are shared with the team privately and are not stored in this repository.
 
## Project Structure
 
```
.
├── src/
│   ├── pages/          # Discover, Post details, Business profile, Owner access, Dashboard
│   ├── components/     # Shared UI components
│   └── lib/            # Search, category list, WhatsApp link helpers
├── public/             # Static assets and PWA manifest
└── README.md
```
 
> Adjust to match your actual layout.
 
## Data Model
 
| Entity | Fields |
|---|---|
| **Owner** | `id`, authentication identity |
| **Business** | `id`, `owner_id`, `name`, `category`, `description`, `whatsapp_number`, `fulfillment_info` (optional), `created_at` |
| **Post** | `id`, `business_id`, `title`, `description`, `category`, `image_url`, `price_mode`, `price_amount` (optional), `currency` (default NGN), `availability`, `publication_status`, `created_at`, `updated_at` |
 
One owner manages one business in this MVP. Search is deterministic keyword matching with no AI dependency.
 
## Quality Standards
 
- Mobile-first layouts usable at 360 px width without horizontal scrolling.
- Labelled inputs, readable contrast, keyboard-operable controls, and visible focus states.
- Optimised images with placeholders when missing.
- Changes persist after refresh; owner permissions are enforced by the backend, not only the interface.
- Clear loading, empty, and error states. A failed save never falsely confirms publication or erases entered text.
- No verification badges unless a real verification process exists.
- Browsing collects no personal data from students. Business contact numbers are supplied knowingly by owners.
## Roadmap
 
Validate demand before prioritising:
 
- [ ] Self-service owner registration
- [ ] Following businesses and saved posts
- [ ] Email roundups that direct students to the platform
- [ ] Campus eligibility and school-email verification
- [ ] Moderation and abuse reporting
- [ ] Website contact for standalone digital businesses
- [ ] Seller-contact analytics (primary success metric: contact clicks)
## Team
 
| Name | Role | GitHub |
|---|---|---|
| Eyinoluwa Adewusi | `Product Manager` | [@username](https://www.linkedin.com/in/eyinoluwa-adewusi-676ba23a4/) |
| `Ruth Ben-Osagie` | `Front-end Lead` | [@username](https://www.linkedin.com/in/ruth-ben-osagie-b8309321a/) |
| `Kenechukwu Akubue` | `Backend Lead` | [@username](https://github.com/Kenechukwu-Akubue) |
| `Josermaria Ofor` | `Backend Support` | [@username](https://github.com/josemaria-codes101) |
| `Vincent Osugba` | `Front-end Support` | [@username](https://github.com/vosugba) |
 
## Contributing
 
1. Fork the repository and create a branch: `git checkout -b feature/short-description`
2. Commit with clear messages and open a pull request describing the change.
3. For larger changes, open an issue first to discuss scope.
## License
 
`<Choose a license, e.g. MIT>`. See [LICENSE](LICENSE) once added.
 
---
 
Built for the PAU community.
 

