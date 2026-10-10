# PAU Biziz

## Live preview deployment (GitHub Pages)

- This branch deploys with the workflow at `.github/workflows/deploy-pages.yml`.
- Deployment runs automatically on pushes to `Frontend_Ruth` and can also be started manually from **Actions**.
- Expected live URL: `https://boluwatifeadewusi5.github.io/PAU-Biziz-Team-Almeta-/`.

### One-time repository setup

1. Go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.

### Local build check

```bash
npm install
npm run build
```

The app is configured with the repository base path and a Pages SPA fallback so route navigation works on GitHub Pages while local `npm run dev` behavior stays unchanged.
