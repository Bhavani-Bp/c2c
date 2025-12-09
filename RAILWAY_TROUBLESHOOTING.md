# 🔧 Railway Root Directory Troubleshooting

## Problem: Set "server" but still getting `/app/index.js` error

### ✅ Step 1: Verify the Setting

1. **Railway Dashboard → Your Service → Settings**
2. **Check "Root Directory" field**
3. Should show: `server`
4. **Screenshot it** to confirm

---

### ✅ Step 2: Trigger Fresh Deployment

After changing Root Directory, Railway **doesn't always redeploy automatically**.

**Do this:**

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **⋮** (three dots menu)
4. Click **"Redeploy"**
5. **DO NOT** click "Restart" - that won't work!

**OR delete the deployment:**
1. Click **⋮** on latest deployment
2. Click **"Remove"**
3. Railway will auto-trigger a new deployment

---

### ✅ Step 3: Check Build Logs

In the new deployment, look for:

**Correct:**
```
📁 Root directory: server
Installing dependencies in /app/server
npm install
Found: package.json
```

**Wrong (if still broken):**
```
📁 Root directory: /
Installing dependencies in /app
```

---

### ✅ Step 4: If Still Broken - Delete Service

Railway sometimes caches the root directory setting.

**Nuclear option (cleanest fix):**

1. **Settings → Danger Zone**
2. Click **"Delete Service"**
3. Confirm deletion
4. Create **New Service**:
   - Deploy from GitHub repo
   - Select `c2c` repository
5. **IMMEDIATELY set Root Directory = `server`** (before first deploy)
6. Add environment variable: `YOUTUBE_API_KEY`
7. Let it deploy

---

### ✅ Step 5: Alternative - Use Nixpacks Config

If Railway UI keeps ignoring Root Directory, use file-based config instead.

Create this file in repo root:

**`nixpacks.json`:**
```json
{
  "setup": {
    "nixpkgs": ["nodejs-18_x"]
  },
  "install": {
    "directory": "server",
    "cmds": ["npm ci"]
  },
  "start": {
    "directory": "server",
    "cmd": "npm start"
  }
}
```

Then:
```bash
git add nixpacks.json
git commit -m "Add nixpacks config for server directory"
git push
```

Railway will use this config file.

---

## 🎯 Expected Success Indicators

Once it works, you'll see in Railway logs:

```
✅ Detected Node.js
✅ Root: /app/server
✅ npm install
✅ > npm start
✅ > node index.js
✅ ✅ CORS configured for: [ ... ]
✅ SERVER RUNNING ON PORT 43917
```

**NOT:**
```
❌ Root: /app
❌ Error: Cannot find module 'dotenv'
❌ /app/index.js
```

---

## 📋 Quick Checklist

- [ ] Root Directory setting shows "server" in Railway UI
- [ ] Clicked "Redeploy" after changing setting
- [ ] Checked build logs for `/app/server` path
- [ ] If still broken, delete service and recreate
- [ ] Alternative: use nixpacks.json config file

**The issue is 100% Railway not using the server/ directory. Once that's fixed, everything will work!**
