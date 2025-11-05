# Deployment Guide - Programmatic SEO Tool

This guide covers deployment options for your Programmatic SEO Tool to various platforms.

## Quick Deployment Options

### 1. Railway (Recommended for Beginners)

Railway offers simple deployment with MongoDB hosting.

**Steps:**
1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Add MongoDB service in Railway
4. Set environment variables:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb://mongo:27017/programmatic-seo-tool
   SITE_URL=https://yourapp.railway.app
   BASIC_AUTH_USERNAME=admin
   BASIC_AUTH_PASSWORD=your-secure-password
   SESSION_SECRET=your-random-secret-key
   ```
5. Deploy automatically from GitHub

**Cost:** $5-20/month depending on usage

### 2. Render + MongoDB Atlas

**Backend Deployment on Render:**
1. Create account at [render.com](https://render.com)
2. Connect GitHub repo
3. Create Web Service:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Environment: Node
4. Set environment variables (see .env.example)

**Frontend Deployment:**
1. Create Static Site on Render
2. Build Command: `cd frontend && npm install && npm run build`
3. Publish Directory: `frontend/dist`

**Database - MongoDB Atlas:**
1. Create free cluster at [mongodb.com](https://cloud.mongodb.com)
2. Get connection string
3. Add to MONGODB_URI in Render environment

**Cost:** Free tier available, $7+/month for production

### 3. Vercel + PlanetScale/MongoDB Atlas

**Backend (API Routes):**
1. Deploy to Vercel as serverless functions
2. Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "src": "/admin/(.*)", "dest": "/frontend/dist/index.html" },
    { "src": "/api/(.*)", "dest": "/backend/server.js" },
    { "src": "/(.*)", "dest": "/backend/server.js" }
  ]
}
```

**Cost:** Free tier generous, pay per usage

### 4. DigitalOcean App Platform

1. Create account at DigitalOcean
2. Create new App from GitHub
3. Configure build and run commands
4. Add managed MongoDB database
5. Set environment variables

**Cost:** $5-25/month

## Environment Variables Setup

For any deployment platform, set these environment variables:

```bash
# Required
NODE_ENV=production
MONGODB_URI=your-mongodb-connection-string
SITE_URL=https://yourdomain.com
BASIC_AUTH_USERNAME=admin
BASIC_AUTH_PASSWORD=secure-password-here
SESSION_SECRET=random-secret-key-here

# Optional
PORT=3000
MAX_FILE_SIZE=5242880
GOOGLE_ANALYTICS_ID=your-ga-id
```

## Pre-Deployment Checklist

### 1. Update Security Settings
- [ ] Change default admin password
- [ ] Generate strong session secret
- [ ] Enable HTTPS redirect
- [ ] Update CORS settings for production domain

### 2. Database Setup
- [ ] Create production database
- [ ] Add database indexes for performance
- [ ] Test connection string
- [ ] Set up database backups

### 3. Domain and DNS
- [ ] Purchase domain name
- [ ] Configure DNS records
- [ ] Set up SSL certificate (usually automatic)
- [ ] Update SITE_URL in environment variables

### 4. Performance
- [ ] Enable compression (already configured)
- [ ] Set up CDN for static assets (optional)
- [ ] Configure caching headers
- [ ] Test page load speeds

### 5. SEO Setup
- [ ] Submit sitemap to Google Search Console
- [ ] Add Google Analytics
- [ ] Verify site with Google
- [ ] Test structured data

## Local to Production Migration

### 1. Export Local Data (if needed)
```bash
# Export from local MongoDB
mongodump --db programmatic-seo-tool --out ./backup

# Import to production (MongoDB Atlas example)
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/programmatic-seo-tool" ./backup/programmatic-seo-tool
```

### 2. Update Configuration
```javascript
// Update frontend/src/config.js for production
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://yourapi.com' 
  : 'http://localhost:3000';
```

## Monitoring and Maintenance

### 1. Error Tracking
- Use platform logging (Railway, Render, etc.)
- Set up error alerts
- Monitor response times

### 2. Database Monitoring
- Monitor connection pool
- Track query performance
- Set up automated backups

### 3. SEO Monitoring
- Monitor sitemap.xml accessibility
- Check for 404 errors
- Track page indexing status

## Custom Domain Setup

### 1. DNS Configuration
```
Type    Name    Value
A       @       your-platform-ip
CNAME   www     your-app-domain.platform.com
```

### 2. SSL Certificate
Most platforms (Railway, Render, Vercel) provide automatic SSL certificates. Just add your domain in the platform settings.

## Scaling Considerations

### Database
- Use MongoDB Atlas for automatic scaling
- Add database indexes for frequent queries
- Consider database connection pooling

### Application
- Enable clustering for Node.js (if supported by platform)
- Use load balancing (handled by most platforms)
- Cache frequently accessed data

### CDN
- Use platform CDN or CloudFlare
- Cache static assets and images
- Enable gzip compression

## Troubleshooting

### Common Issues:

1. **Database Connection Timeout**
   - Check MongoDB Atlas IP whitelist
   - Verify connection string format
   - Test connection locally first

2. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies in package.json
   - Test build process locally

3. **Environment Variables Not Loading**
   - Verify variable names match exactly
   - Check for trailing spaces
   - Restart application after changes

4. **Static Files Not Serving**
   - Check build output directory
   - Verify static file paths
   - Test locally with production build

## Cost Optimization

### Free/Low-Cost Options:
1. **Railway**: $5/month with MongoDB included
2. **Render**: Free tier for small apps
3. **Vercel + MongoDB Atlas**: Free tier available
4. **Heroku**: Free tier discontinued, but $7/month dynos available

### Production Ready:
1. **DigitalOcean**: $25/month for app + database
2. **AWS/GCP**: Variable, $20-100/month typical
3. **Railway Pro**: $20/month for higher limits

Choose based on your expected traffic and budget. Start with Railway or Render free tier for testing, then scale up as needed.