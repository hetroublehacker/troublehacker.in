# troublehacker.in

Source for [troublehacker.in](https://troublehacker.in/), the personal portfolio of product security analyst and vulnerability researcher Aditya Soni (HeTroubleHacker).

## What is included

- A responsive, single-page portfolio with no build-time dependencies
- Search and social metadata plus Schema.org `Person` and `WebSite` data
- Keyboard, reduced-motion, mobile, and no-JavaScript fallbacks
- `robots.txt`, `sitemap.xml`, a web app manifest, and a custom 404 page
- A standard `/.well-known/security.txt` contact
- A dependency-free validation script and GitHub Actions check

## Run locally

Serve the repository root with any static HTTP server. For example:

```sh
python -m http.server 8080
```

Then open <http://localhost:8080/>.

## Validate

Requires Node.js 20 or later:

```sh
node scripts/validate-site.mjs
```

The same validation runs automatically for pushes and pull requests.

## Deployment

The site is served as a static GitHub Pages project from the default branch. `CNAME` keeps the custom domain configured as `troublehacker.in`.

Update `sitemap.xml` and the expiry date in `.well-known/security.txt` when publishing future changes.
