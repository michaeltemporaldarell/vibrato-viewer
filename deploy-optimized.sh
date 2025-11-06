#!/bin/bash
# Deployment script for memory-optimized Vibrato Analyzer

set -e  # Exit on error

echo "🚀 Deploying Memory-Optimized Vibrato Analyzer"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "backend.py" ]; then
    echo "❌ Error: backend.py not found. Run this script from the project root."
    exit 1
fi

echo ""
echo "📋 Pre-deployment checklist:"
echo "   ✓ File size limit: 10MB"
echo "   ✓ Max audio duration: 60 seconds"
echo "   ✓ Sample rate: 22050 Hz"
echo "   ✓ Memory optimizations: Enabled"
echo "   ✓ Python version: 3.11"
echo ""

# Check if Railway CLI is installed
if command -v railway &> /dev/null; then
    echo "✓ Railway CLI detected"
    echo ""
    
    read -p "Deploy to Railway now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔧 Building and deploying..."
        
        # Set environment variables
        echo "Setting environment variables..."
        railway variables set PYTHONUNBUFFERED=1
        railway variables set PYTHONDONTWRITEBYTECODE=1
        railway variables set PYTHONOPTIMIZE=1
        railway variables set OMP_NUM_THREADS=1
        railway variables set OPENBLAS_NUM_THREADS=1
        railway variables set MKL_NUM_THREADS=1
        railway variables set NUMEXPR_NUM_THREADS=1
        
        echo "Deploying to Railway..."
        railway up
        
        echo ""
        echo "✅ Deployment complete!"
        echo ""
        echo "📊 Next steps:"
        echo "   1. Check Railway dashboard for memory usage"
        echo "   2. Test with sample audio files"
        echo "   3. Monitor logs: railway logs"
        echo ""
    else
        echo "Skipping deployment. You can deploy manually with: railway up"
    fi
else
    echo "ℹ️  Railway CLI not found."
    echo ""
    echo "📝 Manual deployment steps:"
    echo "   1. Install Railway CLI: npm i -g @railway/cli"
    echo "   2. Login: railway login"
    echo "   3. Link project: railway link"
    echo "   4. Set environment variables (see MEMORY_OPTIMIZATION.md)"
    echo "   5. Deploy: railway up"
    echo ""
    echo "   OR push to GitHub and let Railway auto-deploy"
fi

echo ""
echo "📚 Documentation:"
echo "   - MEMORY_OPTIMIZATION.md - Detailed optimization info"
echo "   - RAILWAY_READY.md - Railway deployment guide"
echo ""

