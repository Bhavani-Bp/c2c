# Synchronized Video Playback - Setup & Testing Guide

## ✅ Implementation Complete

All code changes have been implemented successfully:
- ✅ Backend: Server timestamp synchronization
- ✅ Frontend: SyncedPlayer component with NTP-lite time sync
- ✅ Integration: Host detection and room management
- ✅ Server: Running on 0.0.0.0:3001

## 🚀 Next Steps: Environment Setup & Testing

### Step 1: Set Up Ngrok Tunnel

**Option A: If ngrok is already installed**
```powershell
ngrok http --host-header=rewrite 3001
```

**Option B: If ngrok is NOT installed**
1. Download from: https://ngrok.com/download
2. Extract to a folder (e.g., `C:\ngrok`)
3. Add to PATH or run from that folder:
   ```powershell
   cd C:\ngrok
   .\ngrok http --host-header=rewrite 3001
   ```

**Expected Output:**
```
Session Status                online
Forwarding                    https://abcd1234.ngrok.app -> http://localhost:3001
```

**⚠️ IMPORTANT**: Copy the `https://abcd1234.ngrok.app` URL (your URL will be different)

---

### Step 2: Configure Environment Variables

#### Local Development (.env.local)

Create or update `client/.env.local`:
```env
NEXT_PUBLIC_SOCKET_URL=https://YOUR_NGROK_URL_HERE.ngrok.app
```

**Example:**
```env
NEXT_PUBLIC_SOCKET_URL=https://abcd1234.ngrok.app
```

#### Vercel Deployment

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add/Update:
   - **Key**: `NEXT_PUBLIC_SOCKET_URL`
   - **Value**: `https://YOUR_NGROK_URL.ngrok.app`
   - **Environments**: Production, Preview, Development
5. Redeploy your app

---

### Step 3: Start Frontend

```powershell
cd client
npm run dev
```

Frontend will run on: http://localhost:3000

---

## 🧪 Testing Scenarios

### Test A: Local Multi-Window Sync

**Goal**: Verify ±100ms synchronization between two browser windows

**Steps**:
1. Open Chrome: http://localhost:3000
2. Create a room (you'll be the host 👑)
3. Copy the room ID
4. Open Firefox (or Chrome Incognito): http://localhost:3000
5. Join the same room with a different name

**Host Actions** (Window 1):
1. Enter this test video URL:
   ```
   https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
   ```
2. Click "Load & Sync"
3. Wait 3 seconds (lead time)
4. Both windows should start playing simultaneously

**Verify**:
- ✅ Both videos start within ±100ms
- ✅ Click "Pause" → both pause instantly
- ✅ Click "Play" → both resume in sync
- ✅ Click "Seek" → enter "30" → both jump to 30s
- ✅ Audio plays locally on both windows
- ✅ No stuttering or buffering issues

**Check Console Logs**:
- Look for: `⏱️ Server time sync: offset=XXms, RTT=XXms`
- Look for: `📹 Received load_video`
- Look for: `⏰ Scheduling start in XXms`

---

### Test B: Vercel + Mobile

**Prerequisites**:
- Frontend deployed to Vercel
- `NEXT_PUBLIC_SOCKET_URL` set in Vercel
- Backend + ngrok running locally

**Steps**:
1. Open deployed site on laptop: `https://your-app.vercel.app`
2. Create room (laptop = host)
3. Open same URL on phone
4. Join same room

**Verify**:
- ✅ Same sync tolerances as Test A
- ✅ Video plays at full resolution on both devices
- ✅ No network errors in console
- ✅ Audio clear on both devices

---

### Test C: Late Joiner Sync

**Goal**: Verify late joiners sync to current playback position

**Steps**:
1. Host loads video and plays for 30 seconds
2. New user joins room mid-playback
3. New user's video should:
   - Load correct URL
   - Seek to ~30s position
   - Start playing immediately
   - Sync within ±200ms

---

## 📊 Expected Performance Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Start Time Sync | ±100ms | Compare `performance.now()` logs |
| Play/Pause Sync | ±100ms | Visual observation |
| Seek Sync | ±150ms | Visual observation |
| Drift over 5 min | ≤200ms | Compare timestamps every 30s |
| Server Time RTT | <100ms | Check console logs |

---

## 🐛 Troubleshooting

### Issue: "Connection failed"
- **Check**: Is backend running? (`npm start` in server folder)
- **Check**: Is ngrok running?
- **Check**: Is `.env.local` pointing to correct ngrok URL?

### Issue: "Videos don't sync"
- **Check**: Console logs for server time offset
- **Check**: Both users in same room ID
- **Check**: Host controls are visible for first user

### Issue: "Video won't load"
- **Check**: URL is a direct MP4/WebM file
- **Check**: URL supports HTTP range requests
- **Check**: CORS is enabled on video host

### Issue: "CORS error"
- **Solution**: Use test URLs like Big Buck Bunny (provided above)
- **Solution**: Ensure video host allows cross-origin requests

---

## 🎯 What to Test

### ✅ Functional Tests
- [ ] Host can load video
- [ ] Host can play/pause/seek
- [ ] Non-host users follow host commands
- [ ] Late joiners sync to current position
- [ ] Host re-election when host leaves
- [ ] Multiple users (3+) stay in sync

### ✅ Performance Tests
- [ ] Measure start time difference (log timestamps)
- [ ] Monitor drift over 5 minutes
- [ ] Test with slow network (Chrome DevTools throttling)
- [ ] Test reconnection after disconnect

### ✅ Edge Cases
- [ ] What happens if host leaves?
- [ ] What happens if video URL is invalid?
- [ ] What happens with network lag?
- [ ] What happens if user joins before video loads?

---

## 📝 Test Results Template

```markdown
## Test Results - [Date/Time]

### Test A: Local Multi-Window
- Start time difference: XX ms
- Play/Pause sync: ✅/❌
- Seek sync: ✅/❌
- Console errors: None / [List errors]

### Test B: Vercel + Mobile
- Devices tested: [Laptop + iPhone/Android]
- Sync quality: ✅/❌
- Video quality: ✅/❌
- Network errors: None / [List errors]

### Test C: Late Joiner
- Join delay: XX seconds into playback
- Sync accuracy: ±XX ms
- Playback smooth: ✅/❌

### Performance Metrics
- Average RTT: XX ms
- Server offset: XX ms
- Drift after 5 min: XX ms
```

---

## 🔄 Rollback Instructions

If you need to revert changes:

```powershell
# Backend
cd server
git checkout HEAD -- index.js
npm start

# Frontend
cd client
git checkout HEAD -- components/SyncedPlayer.tsx
git checkout HEAD -- components/RoomClient.tsx
npm run dev
```

---

## 📚 Additional Resources

### Test Video URLs
```
# Big Buck Bunny (MP4)
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4

# Sintel (MP4)
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4

# Elephants Dream (MP4)
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4
```

### Ngrok Documentation
- Dashboard: https://dashboard.ngrok.com
- Docs: https://ngrok.com/docs

---

## ✨ Success Criteria

You'll know the implementation is successful when:
1. ✅ Two users can watch a video in perfect sync (±100ms)
2. ✅ Host controls work for all users
3. ✅ Late joiners automatically sync to current position
4. ✅ No console errors or network issues
5. ✅ Audio plays locally on each device
6. ✅ Video quality is high (no stuttering)

---

**Ready to test?** Start with Step 1 above! 🚀
