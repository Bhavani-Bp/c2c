# Vercel Environment Variable Setup

## 🎯 Quick Setup for Vercel Deployment

Your code has been pushed to GitHub and Vercel will auto-deploy. You need to set the ngrok URL as an environment variable in Vercel.

### Step 1: Get Your Ngrok URL

Your ngrok should be running. Check the terminal where ngrok is running, or visit:
```
http://localhost:4040
```

Look for the **HTTPS** forwarding URL (e.g., `https://abcd1234.ngrok.app`)

### Step 2: Set Vercel Environment Variable

1. Go to: https://vercel.com/dashboard
2. Select your project: **c2c** (or whatever your project name is)
3. Click **Settings** (top navigation)
4. Click **Environment Variables** (left sidebar)
5. Add a new variable:
   - **Key**: `NEXT_PUBLIC_SOCKET_URL`
   - **Value**: `https://YOUR_NGROK_URL.ngrok.app` (paste your actual ngrok URL)
   - **Environments**: Check all three: ✅ Production ✅ Preview ✅ Development

6. Click **Save**

### Step 3: Redeploy

After adding the environment variable:
1. Go to **Deployments** tab
2. Click the three dots (...) on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete (~1-2 minutes)

### Step 4: Test

Once deployed:
1. Open your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Create a room (you'll be the host 👑)
3. Open the same URL on your phone or another device
4. Join the same room
5. Host loads a test video:
   ```
   https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
   ```
6. Click "Load & Sync" → Both devices should play in perfect sync!

---

## 🔍 Troubleshooting

### "Connection failed" on Vercel
- **Check**: Is the environment variable set correctly?
- **Check**: Did you redeploy after adding the variable?
- **Check**: Is ngrok still running?

### Videos don't sync
- **Check**: Are both users in the same room?
- **Check**: Is one user the host (👑 badge visible)?
- **Check**: Check browser console for errors (F12)

---

## ✅ Success Criteria

You'll know it's working when:
- ✅ Vercel deployment shows "Ready"
- ✅ No connection errors in browser console
- ✅ Host controls visible for first user
- ✅ Videos play in sync across devices (±100ms)

---

## 📱 Local Testing (Optional)

If you want to test locally first:

1. Create `client/.env.local`:
   ```env
   NEXT_PUBLIC_SOCKET_URL=https://YOUR_NGROK_URL.ngrok.app
   ```

2. Start frontend:
   ```powershell
   cd client
   npm run dev
   ```

3. Open http://localhost:3000 in two browser windows and test

---

**Need help?** Check the full [TESTING_GUIDE.md](file:///c:/Users/Bhavani/Desktop/Own_projects/connect_to_connect/TESTING_GUIDE.md)
