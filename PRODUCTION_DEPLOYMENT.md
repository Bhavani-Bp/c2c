# Production Deployment Guide

## Backend Changes Made

### Server CORS Configuration
Updated `server/index.js` to allow production URLs:

1. **Express CORS** (line 10-18):
   - Allows `http://localhost:3000` (development)
   - Allows `https://c2c-kappa.vercel.app` (production)
   - Credentials enabled

2. **Socket.IO CORS** (line 422-430):
   - Same allowed origins
   - Credentials enabled

## Required Environment Variables

### Vercel Frontend (.env.local and Vercel Dashboard)
```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.ngrok-free.dev
NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.ngrok-free.dev
NEXT_PUBLIC_API_URL=https://your-backend-url.ngrok-free.dev
```

### Backend (.env)
```env
PORT=3001
YOUTUBE_API_KEY=your_youtube_api_key
```

## Deployment Steps

### 1. Deploy Backend
If using ngrok:
```bash
cd server
npm start
# In another terminal:
ngrok http 3001
# Copy the https URL (e.g., https://abc123.ngrok-free.dev)
```

**Recommended: Use a permanent backend instead of ngrok:**
- Render.com (free tier)
- Railway.app (free tier)
- Fly.io (free tier)

### 2. Update Vercel Environment Variables
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `NEXT_PUBLIC_BACKEND_URL`
   - `NEXT_PUBLIC_SOCKET_URL`
   - `NEXT_PUBLIC_API_URL`
   
All three should have the same value: your backend URL

### 3. Redeploy Frontend
- Push changes to GitHub
- Vercel will auto-deploy
- Or manually trigger deployment in Vercel Dashboard

## Testing Checklist

- [ ] Search API works in production
- [ ] Room creation works
- [ ] Socket.IO connects successfully
- [ ] No CORS errors in browser console
- [ ] Video sync works between users
- [ ] Recently played feature works

## Troubleshooting

### "Unexpected token <" error
- This means the API returned HTML instead of JSON
- Check that backend URL is correct
- Verify backend is running
- Check browser Network tab for actual response

### CORS errors
- Verify Vercel URL matches exactly in server CORS config
- Check that credentials: true is set
- Ensure no trailing slashes in URLs

### Socket.IO not connecting
- Check that NEXT_PUBLIC_SOCKET_URL is set
- Verify Socket.IO CORS allows your Vercel domain
- ngrok free tier may have WebSocket limitations
