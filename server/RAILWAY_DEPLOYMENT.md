# Railway Deployment Guide - Medical POS Backend

## Pre-deployment Checklist ✅

- [x] MongoDB connection string configured
- [x] Environment variables set up
- [x] Railway configuration files created
- [x] Port configuration updated (Railway auto-assigns PORT)
- [x] CORS configured for production
- [x] Error handling implemented

## 🚀 Deploy to Railway

### Step 1: Prepare Repository

```bash
# Add and commit the railway files
git add .
git commit -m "feat: add Railway deployment configuration"
git push origin backend
```

### Step 2: Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "Deploy from GitHub repo"
4. Select your `medical` repository
5. Choose the `backend` branch
6. Select "Deploy from server folder" or set Root Directory to `server`

### Step 3: Environment Variables

Set these in Railway Dashboard > Variables:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://syedashhad17:BU0MDXOya910zMdR@medical.2fmd4gu.mongodb.net/medical?retryWrites=true&w=majority&appName=medical
JWT_SECRET=your-super-secret-railway-jwt-key-change-this-2024
CLIENT_URL=https://your-frontend-url.railway.app
```

### Step 4: Update Frontend URLs

After deployment, you'll get a Railway URL like:
`https://your-backend-name.railway.app`

Update your frontend to use this URL instead of localhost.

### Step 5: Database Setup

Your MongoDB Atlas connection is already configured. The app will automatically:

- Connect to your existing MongoDB cluster
- Use the `medical` database
- Create collections as needed

## 🔧 Post-Deployment

### Health Check

Your API will be available at:

```
https://your-backend-name.railway.app/health
```

### API Endpoints

```
https://your-backend-name.railway.app/api/auth/...
https://your-backend-name.railway.app/api/medicines/...
https://your-backend-name.railway.app/api/orders/...
```

### Seeding Database (Optional)

If you need to seed data, you can run:

```bash
# From Railway CLI or add as a deployment script
npm run seed
```

## 📝 Notes

1. **Port**: Railway automatically assigns a PORT environment variable
2. **MongoDB**: Using existing Atlas cluster
3. **Environment**: Set to production for Railway
4. **CORS**: Configured to accept requests from your frontend domain
5. **Rate Limiting**: Enabled for production security
6. **Error Handling**: Comprehensive error responses without stack traces in production

## 🔄 Automatic Deployments

Railway will automatically redeploy when you push to the `backend` branch.

## 🐛 Troubleshooting

If deployment fails:

1. Check Railway logs in the dashboard
2. Verify environment variables are set
3. Ensure MongoDB Atlas IP allowlist includes `0.0.0.0/0` for Railway
4. Check that all dependencies are in `package.json`

## 📊 Monitoring

Railway provides:

- Real-time logs
- Metrics dashboard
- Resource usage monitoring
- Custom domain support (if needed)

---

🎉 Your Medical POS backend is now ready for Railway deployment!
