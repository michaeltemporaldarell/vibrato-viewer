# 🚀 Quick Deploy to Vercel

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Vibrato Viewer"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/vibrato-viewer.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your `vibrato-viewer` repository
4. Click "Deploy"

That's it! ✨

Vercel will:
- Auto-detect the Vite framework
- Install dependencies
- Build the frontend
- Deploy the Python serverless function
- Provide you with a live URL

## Your Live App

After deployment (~2-3 minutes), you'll get:
- **Production URL**: `https://your-project.vercel.app`
- **Auto HTTPS**: SSL certificate included
- **Global CDN**: Fast loading worldwide
- **Serverless API**: `/api/analyze` endpoint

## Test It

1. Visit your Vercel URL
2. Upload a WAV file
3. Watch the magic happen! 🎵

## Next Steps

- **Custom Domain**: Add in Vercel dashboard → Settings → Domains
- **Environment Variables**: Configure in Settings → Environment Variables (none needed by default)
- **Analytics**: Enable in Settings → Analytics
- **Automatic Deployments**: Every push to `main` = new deployment

## Need Help?

See [DEPLOY.md](DEPLOY.md) for detailed instructions and troubleshooting.

