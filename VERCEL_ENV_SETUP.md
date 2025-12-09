# Vercel Environment Variables Setup

## 🎯 Railway Backend URL
Your backend is now deployed at:
```
https://thorough-victory-production.up.railway.app
```

## 📋 Set These in Vercel Dashboard

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these 3 environment variables for **Production, Preview, and Development**:

### 1. NEXT_PUBLIC_BACKEND_URL
```
https://thorough-victory-production.up.railway.app
```

### 2. NEXT_PUBLIC_SOCKET_URL
```
https://thorough-victory-production.up.railway.app
```

### 3. NEXT_PUBLIC_API_URL
```
https://thorough-victory-production.up.railway.app
```

**Important:** 
- ✅ Use HTTPS (not HTTP)
- ✅ No trailing slash
- ✅ No spaces
- ✅ Apply to all environments (Production, Preview, Development)

---

## 🔄 After Setting Variables

### 1. Redeploy Frontend
In Vercel:
- Go to Deployments
- Click **Redeploy** on latest deployment
- Wait for deployment to complete

### 2. Test the Connection
Open your Vercel app:
```
https://c2c-kappa.vercel.app
```

Check browser console - should see:
```
✅ Socket connected
✅ No CORS errors
✅ Backend URL: https://thorough-victory-production.up.railway.app
```

---

## 📝 Frontend Code Already Updated

The following files now use environment variables:

### `client/lib/socket.ts`
```typescript
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
```

### `client/components/RoomClient.tsx`
```typescript
fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/search?query=...`)
```

All hardcoded URLs have been replaced with environment variables! ✅

---

## 🧪 Testing Checklist

After redeployment:

- [ ] Open Vercel app
- [ ] Create a room
- [ ] Search for a video (e.g., "nature")
- [ ] Verify search results appear
- [ ] Click a video to play
- [ ] Open second browser/tab
- [ ] Join same room
- [ ] Test video sync between users
- [ ] Test chat messages
- [ ] Verify Recently Played sidebar

If all work → Deployment successful! 🎉
