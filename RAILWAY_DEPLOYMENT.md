# Railway Deployment Guide

## ✅ Code Changes Made

Your backend is now Railway-ready! Here's what was configured:

### 1. Dynamic PORT ✅
```javascript
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
```
Railway will provide the PORT automatically.

### 2. Trust Proxy ✅ (Added)
```javascript
app.set("trust proxy", 1);
```
Allows Railway's proxy to correctly handle cookies and IP addresses.

### 3. CORS Configuration ✅
```javascript
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://c2c-kappa.vercel.app"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
```

### 4. Socket.IO Setup ✅
```javascript
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:3000",
            "https://c2c-kappa.vercel.app"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});
```

---

## 📋 Railway Deployment Steps

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"

### Step 2: Deploy from GitHub
1. Click "Deploy from GitHub repo"
2. Select your `c2c` repository
3. Railway will auto-detect Node.js

### Step 3: Set Environment Variables
In Railway Dashboard → Variables, add:

```
YOUTUBE_API_KEY=your_youtube_api_key_here
NODE_ENV=production
```

**Important:** Railway automatically provides `PORT`, don't set it manually.

### Step 4: Get Railway URL
After deployment, Railway gives you a URL like:
```
https://your-app-name.up.railway.app
```

### Step 5: Update Vercel Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_BACKEND_URL=https://your-app-name.up.railway.app
NEXT_PUBLIC_SOCKET_URL=https://your-app-name.up.railway.app
NEXT_PUBLIC_API_URL=https://your-app-name.up.railway.app
```

### Step 6: Redeploy Frontend
1. Go to Vercel Dashboard
2. Click "Redeploy"
3. Wait for deployment to complete

---

## 🧪 Testing

### 1. Test Backend Health
Open in browser:
```
https://your-app-name.up.railway.app/
```

Expected response:
```json
{
  "message": "Connect to Connect Server is running!",
  "status": "active",
  "availableEndpoints": [...]
}
```

### 2. Test Search API
```
https://your-app-name.up.railway.app/api/search?query=test
```

Expected response:
```json
{
  "success": true,
  "videos": [...]
}
```

### 3. Test in Production
1. Open your Vercel app
2. Create a room
3. Search for videos
4. Test video sync between users

---

## 📦 What's Included

- ✅ WebSocket support (Socket.IO)
- ✅ REST APIs (search, create-room, join-room, etc.)
- ✅ Environment variables
- ✅ CORS configured
- ✅ Proxy support
- ✅ Auto-scaling
- ✅ Free tier (500 hours/month)

---

## 🔧 Troubleshooting

### Deployment fails
- Check Railway logs in dashboard
- Verify `package.json` has `start` script
- Ensure Node.js version compatible (16+)

### CORS errors
- Add your Railway URL to CORS origins in code
- Redeploy after changes

### Socket.IO not connecting
- Check Railway URL is HTTPS (Railway provides this automatically)
- Verify `NEXT_PUBLIC_SOCKET_URL` in Vercel matches Railway URL exactly

### Environment variables not working
- Double-check variable names in Railway dashboard
- Redeploy after adding variables

---

## 💰 Free Tier Limits

Railway free tier includes:
- 500 hours/month runtime
- $5 credit/month
- Shared resources

This is plenty for development and moderate usage.

---

## 🎉 Next Steps

1. Commit and push code changes
2. Deploy to Railway
3. Update Vercel environment variables
4. Test production deployment

Your backend will be fully hosted and ready to scale!
