# Production Search Testing Guide

## ✅ What Was Changed

**File:** `client/components/RoomClient.tsx` line 222

**Before:**
```typescript
fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/search?query=...`)
```

**After:**
```typescript
fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/search?query=...`)
```

**Why:** Socket URLs are for WebSocket connections, not REST APIs. Using separate environment variables ensures correct routing.

---

## 🧪 Step 4: Test Backend Directly

### Test Your Backend is Working

1. **Get your ngrok URL** from the terminal where ngrok is running
   - Should look like: `https://unenunciative-shapeless-peter.ngrok-free.dev`

2. **Open this URL in your browser:**
   ```
   https://YOUR_NGROK_URL/api/search?query=test
   ```

3. **Expected Response (JSON):**
   ```json
   {
     "success": true,
     "videos": [
       {
         "videoId": "...",
         "title": "...",
         "thumbnail": "...",
         "channel": "...",
         "description": "...",
         "publishDate": "..."
       }
     ]
   }
   ```

4. **If you see HTML or "Tunnel not found":**
   - Backend is not running → Run `npm start` in server folder
   - ngrok URL is wrong → Check ngrok terminal for correct URL
   - API key missing → Check `server/.env` has `YOUTUBE_API_KEY`

---

## 📋 Deployment Checklist

- [x] Backend has `YOUTUBE_API_KEY` in `.env`
- [x] Frontend code uses `NEXT_PUBLIC_BACKEND_URL`
- [ ] Backend is running (`npm start`)
- [ ] ngrok is running (`ngrok http 3001`)
- [ ] Vercel has `NEXT_PUBLIC_BACKEND_URL` set
- [ ] Frontend redeployed in Vercel
- [ ] Test backend URL directly (see above)
- [ ] Test search in production app

---

## 🔧 Environment Variables Summary

### Backend (`server/.env`)
```env
YOUTUBE_API_KEY=your_actual_youtube_api_key
PORT=3001
```

### Vercel (Frontend)
```env
NEXT_PUBLIC_BACKEND_URL=https://your-ngrok-url.ngrok-free.dev
NEXT_PUBLIC_SOCKET_URL=https://your-ngrok-url.ngrok-free.dev
NEXT_PUBLIC_API_URL=https://your-ngrok-url.ngrok-free.dev
```

**Note:** All three can point to the same URL. The names help organize different types of connections.

---

## 🐛 Troubleshooting

### "Unexpected token '<'" Error
**Means:** Frontend received HTML instead of JSON

**Causes:**
1. Backend URL wrong in Vercel
2. Backend not running
3. ngrok tunnel closed
4. Calling wrong endpoint

**Fix:** Test backend URL directly (see Step 4 above)

### Backend Test Returns HTML
**Causes:**
1. ngrok URL expired
2. Backend crashed
3. Port mismatch

**Fix:**
```bash
# Restart everything
cd server
npm start

# New terminal
ngrok http 3001

# Update Vercel with new URL
# Redeploy
```

### CORS Errors
**Already Fixed:** Server has proper CORS configuration

If still seeing errors:
- Verify Vercel URL is `https://c2c-kappa.vercel.app`
- Check server CORS config includes your domain
- Redeploy frontend after backend changes

---

## ✅ Success Indicators

When everything works:
1. ✅ Backend test URL returns JSON with videos
2. ✅ No "Unexpected token <" errors
3. ✅ Search results appear in production app
4. ✅ No CORS errors in console
5. ✅ Videos play when clicked
