# Railway Deployment Notes

## Current Configuration
- Builder: NIXPACKS
- Root Directory: /
- Server Directory: /server

## Important: Database Migrations
Migrations run at **runtime** (when container starts), NOT during build:
```
[start]
cmd = "cd server && npx prisma migrate deploy && node index.js"
```

## If Build Fails with "Can't reach database"
This means Railway is trying to run migrations during build. To fix:
1. Go to Railway Dashboard → Your Service
2. Click "Settings" → "Build"
3. Scroll down and click "Clear Build Cache"
4. Redeploy

The database is only accessible at runtime, not during Docker build!
