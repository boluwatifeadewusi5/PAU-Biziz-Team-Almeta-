# Frontend coordination

Ruth branch: `frontend_ruth`, tracking remote `Frontend_Ruth`.

Stack: React, TypeScript, Vite, React Router, Lucide icons, plain CSS.

## Ownership

- Ruth: welcome, signup, feed, post details, business profile, business setup, create post.
- Vincent: login, search, my account, post management.
- Coordinate edits to `src/App.tsx`, `src/styles.css`, and dependency files before merging.

## Routes

`/` welcome (implemented), `/login` partner handoff, `/signup` Ruth next iteration, `/feed` Ruth subsequent iteration.

Planned: `/search`, `/posts/:postId`, `/businesses/:businessId`, `/account`, `/business/setup`, `/posts/new`, `/business/posts`.

The handoff screens deliberately identify unfinished functionality. Authentication and backend persistence are not implemented. Welcome-page business cards are illustrative, not real listings. Explore leads to the feed handoff until that screen is built.

## Local development

Run `npm install`, then `npm run dev`. Run `npm run build` before handoff.

Use navy `#082b43`, gold `#c99321`, warm white `#fbfaf6`, Manrope headings and DM Sans body text (system sans-serif fallback). No secrets belong in the frontend or repository.
