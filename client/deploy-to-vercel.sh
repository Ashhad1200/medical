#!/bin/bash

echo "🚀 Medical POS Frontend - Vercel Deployment Script"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the client directory"
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the project first
echo "🏗️  Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to Vercel
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    
    echo ""
    echo "🎉 Deployment Complete!"
    echo ""
    echo "🔗 Your app is now live!"
    echo "📱 Backend API: https://medical-production-308c.up.railway.app/"
    echo "🌐 Frontend: Check the URL provided by Vercel above"
    echo ""
    echo "🔐 Demo Login Credentials:"
    echo "   Admin: admin / admin123"
    echo "   Counter: counter / counter123"
    echo "   Warehouse: warehouse / warehouse123"
    echo ""
    echo "Happy selling! 💊🏥"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi 