# 🔴 URGENT FIX: Vercel Environment Variable Error

## The Problem

Your app is crashing on Vercel with:
```
Application error: a client-side exception has occurred
Cannot read properties of undefined (reading 'length')
```

**Root Cause**: `NEXT_PUBLIC_SOCKET_URL` is not set in Vercel, causing Socket.IO to crash.

---

## ✅ THE FIX (Follow These Exact Steps)

### Step 1: Set Environment Variable in Vercel

1. Go to: **https://vercel.com/dashboard**
2. Click on your **c2c** project
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)
5. Click **Add New** button
6. Fill in:
   ```
   Name: NEXT_PUBLIC_SOCKET_URL
   Value: https://unenunciative-shapeless-peter.ngrok-free.dev
   ```
7. **IMPORTANT**: Check ALL THREE boxes:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
8. Click **Save**

### Step 2: Redeploy

1. Click **Deployments** tab (top menu)
2. Find the latest deployment
3. Click the **⋯** (three dots) on the right
4. Click **Redeploy**
5. Confirm by clicking **Redeploy** again
6. Wait 1-2 minutes for deployment to complete

### Step 3: Verify the Fix

After deployment completes:

1. Open your Vercel app URL
2. Open browser console (F12)
3. Look for this log:
   ```
   🚨 SOCKET URL: https://unenunciative-shapeless-peter.ngrok-free.dev
   ```

If you see the URL (not `undefined`), the fix worked! ✅

---

## 🧪 Test the App

1. Create a room (you'll be host 👑)
2. Copy room ID
3. Open same URL on phone/another browser
4. Join same room
5. Host loads test video:
   ```
   https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
   ```
6. Click "Load & Sync"
7. Both devices should play in perfect sync!

---

## ❌ Common Mistakes to Avoid

### Mistake 1: Adding Quotes
❌ **Wrong**:
```
"NEXT_PUBLIC_SOCKET_URL"="https://..."
```

✅ **Correct**:
```
NEXT_PUBLIC_SOCKET_URL=https://...
```

### Mistake 2: Not Checking All Environments
You MUST check all three:
- ✅ Production
- ✅ Preview
- ✅ Development

### Mistake 3: Forgetting to Redeploy
Environment variables only take effect AFTER redeployment!

### Mistake 4: Using .env.local
Vercel does NOT read `.env.local` from Git.
You MUST set variables in Vercel Dashboard.

---

## 🔍 Still Not Working?

### Check 1: Is ngrok running?
```powershell
# Check if ngrok is active
curl http://localhost:4040
```

If not running:
```powershell
ngrok http --host-header=rewrite 3001
```

### Check 2: Is backend running?
```powershell
cd server
npm start
```

Should show:
```
SERVER RUNNING ON PORT 3001 (accessible via 0.0.0.0)
```

### Check 3: Check browser console
Open F12 → Console tab

Look for:
- ✅ `🚨 SOCKET URL: https://...` (should show your ngrok URL)
- ❌ `🚨 SOCKET URL: undefined` (means env var not set)

---

## 📊 What Changed

I've updated `RoomClient.tsx` to add a runtime check:

```typescript
// Before (would crash)
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
const socketInstance = io(socketUrl, ...);

// After (shows helpful error)
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

console.log('🚨 SOCKET URL:', socketUrl);

if (!socketUrl) {
    console.error('❌ NEXT_PUBLIC_SOCKET_URL is not defined!');
    setConnectionStatus('disconnected');
    setSyncStatus('❌ Missing NEXT_PUBLIC_SOCKET_URL environment variable');
    return; // Prevents crash
}

const socketInstance = io(socketUrl, ...);
```

Now instead of crashing, you'll see a clear error message!

---

## ✅ Success Checklist

- [ ] Environment variable added in Vercel
- [ ] All three environments checked (Production, Preview, Development)
- [ ] Redeployed from Deployments tab
- [ ] Browser console shows `🚨 SOCKET URL: https://...`
- [ ] No crash, app loads successfully
- [ ] Can create/join rooms
- [ ] Videos sync across devices

---

**Once all checkboxes are ✅, your synchronized video playback system is ready!** 🎬
