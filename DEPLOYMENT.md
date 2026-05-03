# 🚀 Deploying ParkTrack KW to Vercel

This guide will walk you through hosting your ParkTrack KW app on Vercel so anyone can access the demo from any device.

---

## 📋 Prerequisites

Before starting, you'll need:
- A **GitHub account** (free at https://github.com)
- A **Vercel account** (free at https://vercel.com)
- Your **LocationIQ API key** (from https://locationiq.com)

---

## Step 1️⃣: Initialize Git Repository

If you haven't already, initialize a Git repository in your project:

```bash
cd parktrack-kw
git init
git add .
git commit -m "Initial commit: ParkTrack KW parking app"
```

---

## Step 2️⃣: Create a GitHub Repository

### 2.1 Go to GitHub and create a new repository

1. Visit https://github.com/new
2. **Repository name**: `parktrack-kw`
3. **Description**: "Intelligent parking management system for Kitchener-Waterloo"
4. **Public** or **Private** (your choice)
5. ✅ Check: "Add a README file" (uncheck - we have our own)
6. Click **"Create repository"**

### 2.2 Add the remote and push your code

Copy the HTTPS URL from your new repository, then run:

```bash
# Add the remote repository
git remote add origin https://github.com/yourusername/parktrack-kw.git

# Rename branch to main (if needed)
git branch -M main

# Push your code
git push -u origin main
```

**✨ Your code is now on GitHub!**

---

## Step 3️⃣: Set Up Vercel

### 3.1 Sign in to Vercel

1. Visit https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

### 3.2 Create a new project

1. On the Vercel dashboard, click **"Add New..."** → **"Project"**
2. In the **"Import Git Repository"** section, find `parktrack-kw`
3. Click **"Import"**

### 3.3 Configure the project

The default settings should work fine:

- **Framework Preset**: React
- **Build Command**: `npm run build` (default)
- **Output Directory**: `build` (default)
- **Install Command**: `npm install` (default)

✅ Keep everything as default and click **"Deploy"**

---

## Step 4️⃣: Set Environment Variables on Vercel

Before your app can work, you need to add your **LocationIQ API key** to Vercel:

### 4.1 Navigate to Environment Variables

1. After deployment (or from dashboard), click your project
2. Go to **Settings** → **Environment Variables**

### 4.2 Add your API key

1. Click **"Add New"** → **"Environment Variable"**
2. **Name**: `REACT_APP_LOCATIONIQ_API_KEY`
3. **Value**: Paste your LocationIQ API key (from https://locationiq.com)
4. **Select environments**: Check ✅ all (Production, Preview, Development)
5. Click **"Save"**

**⚠️ Important**: React environment variables must start with `REACT_APP_` prefix for them to be available in the browser!

---

## Step 5️⃣: Redeploy with Environment Variables

After adding environment variables, you need to redeploy:

### 5.1 Trigger a redeploy

1. Go to **Deployments** tab
2. Find your latest deployment
3. Click the **"..." menu** → **"Redeploy"**
4. Click **"Redeploy"**

Or simply push a new commit to GitHub:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

**⏳ Wait 2-3 minutes for deployment to complete**

---

## Step 6️⃣: Access Your Live App

### 6.1 Get your Vercel URL

1. Go to your Vercel dashboard
2. Your project URL will be displayed (e.g., `https://parktrack-kw.vercel.app`)
3. Click the URL to open your live app!

### 6.2 Custom domain (optional)

To use a custom domain like `parktrack.dev`:

1. In project **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain
4. Follow the DNS configuration steps
5. Wait for DNS propagation (5-48 hours)

---

## 🎯 Testing Your Live Deployment

### Test Checklist

- [ ] App loads without errors
- [ ] Map displays correctly
- [ ] Your location shows on the map
- [ ] Search functionality works
- [ ] Parking zones appear with correct colors
- [ ] Clicking zones shows information
- [ ] Timer functionality works
- [ ] Browser notifications work (may need to grant permission)

### Common Issues & Fixes

#### ❌ "Environment variables are not defined"
- Re-check environment variables in Vercel settings
- Make sure the variable name is exactly: `REACT_APP_LOCATIONIQ_API_KEY`
- Redeploy after adding variables

#### ❌ "Map not loading"
- Check browser console (F12 → Console tab)
- Verify internet connection
- Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

#### ❌ "Search returns no results"
- Verify your LocationIQ API key is valid
- Check if your API key has the correct permissions
- Check the browser network tab for API errors

#### ❌ "Geolocation not working"
- Grant location permission when prompted
- Vercel uses HTTPS (required for geolocation)
- Some browsers may require user interaction first

---

## 📤 Sharing Your Demo

### Share with friends & colleagues:

1. **Direct link**: Share your Vercel URL
   ```
   https://parktrack-kw.vercel.app
   ```

2. **Short link**: Use a URL shortener like bit.ly
   ```
   https://bit.ly/parktrack-kw
   ```

3. **Social media**: Share on Twitter, LinkedIn, etc.
   ```
   🅿️ Check out ParkTrack KW - An intelligent parking app for 
   the Kitchener-Waterloo region! 
   
   🗺️ Interactive map
   ⏱️ Smart timers
   🚨 Notifications
   
   Live demo: https://parktrack-kw.vercel.app
   GitHub: https://github.com/yourusername/parktrack-kw
   ```

4. **QR Code**: Generate a QR code linking to your app using:
   - https://qr-code-generator.com
   - https://www.qr-code-generator.com/

---

## 🔄 Continuous Deployment

### Automatic updates

Every time you push changes to GitHub, Vercel automatically deploys them:

1. Make changes locally
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin main
   ```

2. Vercel automatically:
   - Detects the push
   - Builds your app
   - Deploys to the live URL
   - Shows deployment status on dashboard

---

## 📊 Monitoring Your Deployment

### Check deployment status

1. **Deployments tab**: See all deployment history
2. **Build logs**: Click a deployment to see build logs
3. **Analytics**: View traffic and performance metrics
4. **Errors**: Check for any build or runtime errors

---

## 🔐 Security Best Practices

### Protect your API keys

1. **Never commit `.env` to Git**
   - The `.gitignore` should already exclude it
   - Verify: check if `.env` is in `.gitignore`

2. **Always use Vercel environment variables**
   - Never paste keys directly in code
   - Use environment variables only

3. **Rotate API keys regularly**
   - Generate a new LocationIQ API key
   - Update it in Vercel settings
   - Keep only current keys active

4. **Monitor API usage**
   - Check LocationIQ dashboard for quota usage
   - Set up alerts for high usage
   - Upgrade plan if needed

---

## 📈 Scaling Your App

### If your app gets popular:

1. **Upgrade Vercel Plan**
   - Free tier: Great for demos
   - Pro tier: Better performance, analytics, support

2. **Add caching**
   - Cache parking zone data
   - Use service workers

3. **Optimize performance**
   - Reduce bundle size
   - Lazy load components
   - Image optimization

---

## 🆘 Troubleshooting Deployment

### Check deployment logs

1. Go to **Deployments** tab
2. Click on failed deployment
3. Click **"Build Logs"** to see errors
4. Look for red error messages

### Common build errors

**"npm ERR! missing script: react-scripts"**
- Solution: Your `package.json` might be corrupted
- Fix: Delete `node_modules` and `package-lock.json`, run `npm install` again

**"Module not found"**
- Solution: A dependency is missing
- Fix: Ensure all imports match actual file names (case-sensitive on Linux/Vercel)

**"Cannot find module 'maplibre-gl'"**
- Solution: Dependencies didn't install properly
- Fix: Check `package.json` has all required dependencies

---

## 🎓 Next Steps

After successful deployment:

1. **Share your live app**
   - Send the Vercel URL to friends
   - Post on social media
   - Add to your portfolio

2. **Continue development**
   - Add new features locally
   - Push to GitHub
   - Watch it auto-deploy on Vercel

3. **Collect feedback**
   - Use GitHub Issues for bug reports
   - Ask users what features they'd like
   - Iterate and improve

4. **Monitor analytics**
   - Check Vercel analytics
   - Track user engagement
   - Optimize based on usage patterns

---

## 💡 Pro Tips

### Deployment Pro Tips

1. **Use preview URLs for testing**
   - Create branches for features
   - Get automatic preview URLs
   - Test before merging to main

2. **Add a GitHub Actions workflow**
   - Run tests before deploying
   - Ensure code quality
   - Prevent bad deploys

3. **Use environment-specific URLs**
   - Different API keys for dev/prod
   - Different behavior based on environment

4. **Monitor errors with Sentry**
   - Add error tracking
   - Get alerts on production errors
   - Debug issues faster

---

## 📚 Resources

- **Vercel Docs**: https://vercel.com/docs
- **React Deployment**: https://create-react-app.dev/deployment
- **LocationIQ API**: https://locationiq.com/docs
- **GitHub Guides**: https://guides.github.com

---

## 🎉 You're Done!

Your ParkTrack KW app is now live on the internet! 🚀

**Next time:** Simply push to GitHub and Vercel will automatically deploy your changes.

**Share your URL:** Your live app is available at your Vercel URL for anyone to visit!

---

**Questions?** Check the [README.md](./README.md) or [GitHub Issues](https://github.com/yourusername/parktrack-kw/issues)

**Happy deploying! 🎊**
