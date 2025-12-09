# Railway Deployment Guide - Monorepo Fix

## ⚠️ Your Repo Structure (The Problem)

Your repository is a **monorepo** with this structure:
```
connect_to_connect/
├── client/          ← Frontend (Next.js)
├── server/          ← Backend (Node.js + Socket.IO)
│   ├── package.json ✅
│   ├── index.js     ✅
│   └── ...
├── requirements.txt ❌ (This confuses Railway!)
└── package.json
```

**Problem:** Railway sees `requirements.txt` at the root and thinks it's a Python project!

## ✅ Solutions Implemented

### Solution 1: Railway Configuration Files (Recommended)

I've created two configuration files that tell Railway to use the `server/` directory:

#### **railway.json**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd server && npm install"
  },
  "deploy": {
    "startCommand": "cd server && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### **nixpacks.toml**
```toml
[phases.setup]
nixPkgs = ["nodejs-18_x"]

[phases.install]
cmds = ["cd server && npm ci"]

[phases.build]
cmds = ["echo 'Build complete'"]

[phases.start]
cmd = "cd server && npm start"
```

These files explicitly tell Railway:
- ✅ Use Node.js 18
- ✅ Install from `server/package.json`
- ✅ Start from `server/` directory
- ✅ Ignore the Python `requirements.txt`

---

## 🚀 Railway Deployment Steps (Updated)

### Step 1: Commit New Config Files
```bash
git add railway.json nixpacks.toml
git commit -m "Add Railway monorepo configuration"
git push
```

### Step 2: Deploy to Railway

**Option A: Using Root Directory Setting (Easiest)**
1. Go to Railway Dashboard
2. Create New Project → Deploy from GitHub
3. Select your `c2c` repository
4. In **Settings** → **Service Settings**:
   - Set **Root Directory** = `server`
   - This tells Railway to only look at the server folder

**Option B: Use Config Files**
1. Deploy normally from GitHub
2. Railway will detect `railway.json` and `nixpacks.toml`
3. It will automatically use the `server/` directory

### Step 3: Set Environment Variables
In Railway Dashboard → Variables:
```
YOUTUBE_API_KEY=your_youtube_api_key_here
NODE_ENV=production
```

### Step 4: Get Railway URL
After deployment: `https://your-app-name.up.railway.app`

### Step 5: Update Vercel
Set in Vercel environment variables:
```
NEXT_PUBLIC_BACKEND_URL=https://your-app-name.up.railway.app
NEXT_PUBLIC_SOCKET_URL=https://your-app-name.up.railway.app
NEXT_PUBLIC_API_URL=https://your-app-name.up.railway.app
```

---

## 🔧 Alternative: Remove requirements.txt

If you don't need `requirements.txt`, you can:
```bash
git rm requirements.txt
git commit -m "Remove unused requirements.txt"
git push
```

This will stop confusing Railway.

---

## ✅ What's in server/package.json (Already Correct)

```json
{
  "name": "server",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"  ✅ CORRECT!
  },
  "dependencies": {
    "express": "^5.1.0",
    "socket.io": "^4.8.1",
    ...
  }
}
```

---

## 🎯 Why This Fixes the Error

**Before:**
- Railway scans root directory
- Finds `requirements.txt`
- Thinks: "This is Python!"
- Tries to run Python build
- Fails: "No start command found"

**After:**
- Railway reads `railway.json` or Root Directory setting
- Uses `server/` directory only
- Finds `package.json` with `"start": "node index.js"`
- Thinks: "This is Node.js!"
- Successfully builds and deploys

---

## 🧪 Testing

1. **Check Railway Logs:**
   - Should see: "Detected Node.js"
   - Should NOT see: "Detected Python"

2. **Test Backend:**
   ```
   https://your-app.up.railway.app/
   ```
   Should return: `{ "message": "Connect to Connect Server is running!" }`

3. **Test Search API:**
   ```
   https://your-app.up.railway.app/api/search?query=test
   ```

---

## 📋 Deployment Checklist

- [x] `server/package.json` has `"start": "node index.js"` ✅
- [x] Created `railway.json` configuration ✅
- [x] Created `nixpacks.toml` configuration ✅
- [ ] Commit and push config files
- [ ] Deploy to Railway
- [ ] Set Root Directory to `server` (or use config files)
- [ ] Add `YOUTUBE_API_KEY` to Railway
- [ ] Update Vercel environment variables
- [ ] Test deployment

Your backend is now ready for Railway deployment! 🎉
