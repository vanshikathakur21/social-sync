# 🚀 Cloudflare Pages Deployment - Quick Steps

## Prerequisites
- Cloudflare account
- Wrangler CLI installed: `npm install -g wrangler`
- API keys from your original `app.py` file

## Step 1: Authenticate
```bash
wrangler login
```

## Step 2: Build the Application
```bash
cd social-sync-nextjs
npm install
npm run build
```

## Step 3: Create Pages Project
```bash
wrangler pages project create social-sync-nextjs
```

## Step 4: Set Environment Variables
```bash
wrangler pages secret put OPENAI_API_KEY --project-name=social-sync-nextjs
wrangler pages secret put TWITTER_API_KEY --project-name=social-sync-nextjs
wrangler pages secret put TWITTER_API_SECRET --project-name=social-sync-nextjs
wrangler pages secret put TWITTER_ACCESS_TOKEN --project-name=social-sync-nextjs
wrangler pages secret put TWITTER_ACCESS_SECRET --project-name=social-sync-nextjs
```

*Use the actual values from `env-template.txt`*

## Step 5: Deploy
```bash
wrangler pages deploy out --project-name=social-sync-nextjs
```

## Step 6: Test
1. Open the provided Cloudflare Pages URL
2. Test form submission and file download
3. Test AI post generation
4. Test Twitter posting

## ✅ Done!
Your app is now live on Cloudflare Pages with global CDN distribution.

---

**Need help?** Check the full `DEPLOYMENT_GUIDE.md` for detailed instructions and troubleshooting.