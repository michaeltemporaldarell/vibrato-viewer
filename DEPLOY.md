# Deploying Vibrato Viewer to Vercel 🚀

This guide will walk you through deploying both the frontend and backend to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free tier works great!)
2. [Vercel CLI](https://vercel.com/docs/cli) installed (optional, but recommended)
3. Git repository (GitHub, GitLab, or Bitbucket)

## Quick Deploy (Recommended)

### Option 1: Deploy via Vercel Dashboard

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Vibrato Viewer"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect the configuration from `vercel.json`

3. **Configure Environment Variables** (Optional)
   - In the Vercel dashboard, go to your project settings
   - Add environment variable if needed:
     - `VITE_API_URL` (leave empty for production, as we use relative paths)

4. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes for the build to complete
   - Your app will be live! 🎉

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # From the project root
   vercel
   
   # Follow the prompts:
   # - Set up and deploy? Y
   # - Which scope? [your account]
   # - Link to existing project? N
   # - What's your project's name? vibrato-viewer
   # - In which directory is your code located? ./
   ```

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Project Structure for Vercel

```
singing-thing/
├── api/                      # Serverless functions
│   ├── analyze.py           # Main analysis endpoint
│   └── requirements.txt     # Python dependencies
├── vibrato-viewer/          # Frontend
│   ├── src/
│   ├── dist/                # Build output
│   └── package.json
├── vercel.json              # Vercel configuration
└── README.md
```

## How It Works

### Frontend (Vite + React)
- Built and served from `vibrato-viewer/dist`
- Environment-aware API calls
- Static assets served from Vercel's CDN

### Backend (Python Serverless Function)
- Lives in `api/analyze.py`
- Deployed as a serverless function
- Auto-scales with traffic
- 60-second timeout for complex audio processing

### Routing
- Frontend: `yourdomain.vercel.app/*`
- API: `yourdomain.vercel.app/api/analyze`
- All API routes automatically proxied via `vercel.json` rewrites

## Local Development

For local development, keep using the dual-server approach:

**Terminal 1 - Backend:**
```bash
source venv/bin/activate
uvicorn backend:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd vibrato-viewer
npm run dev
```

The frontend will automatically use `http://localhost:8000` in development mode (via `.env.development`).

## Environment Variables

### Development (`.env.development`)
```env
VITE_API_URL=http://localhost:8000
```

### Production (Vercel)
No environment variables needed! The app uses relative paths (`/api/analyze`) which Vercel automatically routes to the serverless function.

## Troubleshooting

### Build Fails

**Issue**: "Module not found" or build errors
**Solution**: Make sure all dependencies are in `vibrato-viewer/package.json`
```bash
cd vibrato-viewer
npm install
```

### Serverless Function Timeout

**Issue**: Analysis takes too long (>60s)
**Solution**: The function timeout is already set to 60s in `vercel.json`. For very large files, you may need to optimize or use a different deployment strategy.

### CORS Errors

**Issue**: API requests blocked by CORS
**Solution**: The serverless function already includes CORS headers. If issues persist, check that you're using the correct API URL.

### Python Dependencies Missing

**Issue**: "No module named 'librosa'" in production
**Solution**: Vercel automatically installs from `api/requirements.txt`. Make sure it includes all dependencies:
```txt
numpy>=1.21.0
librosa>=0.10.0
scipy>=1.7.0
```

## Custom Domain (Optional)

1. Go to your project in Vercel dashboard
2. Settings → Domains
3. Add your custom domain
4. Follow the DNS configuration instructions
5. SSL certificate is automatically provisioned!

## Monitoring

Vercel provides built-in monitoring:
- **Analytics**: Track page views and performance
- **Logs**: View serverless function logs
- **Speed Insights**: Monitor Core Web Vitals

Access these in your project dashboard at [vercel.com](https://vercel.com).

## Continuous Deployment

Once connected to GitHub:
- Every push to `main` branch → Production deployment
- Every pull request → Preview deployment
- Automatic rollbacks if deployment fails

## Cost

**Vercel Free Tier includes:**
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless function execution
- ✅ Automatic HTTPS
- ✅ Preview deployments

Perfect for personal projects and demos!

## Support

For issues specific to Vercel deployment:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

For app-specific issues, check the main README.md

---

**That's it!** Your Vibrato Viewer should now be live and analyzing audio files from anywhere in the world! 🎵✨

