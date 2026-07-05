# Vercel Deployment

The frontend (client) is deployed on Vercel.

**When creating your Vercel project, set the Root Directory to `client`.**

Vercel will pick up `client/vercel.json` automatically, which handles the React SPA routing.

Do NOT deploy from the repo root — the root directory does not contain a Vite app.
