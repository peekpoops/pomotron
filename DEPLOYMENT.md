# Vercel Deployment Configuration

## Overview
This project is configured for Vercel deployment as a full-stack application with serverless API functions and a React frontend.

## File Structure
```
├── api/              # Vercel serverless API functions
├── client/           # Frontend React app
├── server/           # Backend Express app (dev only)
├── shared/           # Shared types and schemas
├── index.html        # Root HTML file for Vercel build
├── vite.vercel.config.ts  # Vercel-specific Vite config
├── vercel.json       # Vercel deployment config
└── package.json      # Dependencies and scripts
```

## Build Process
- **Build Command**: `npx vite build --config vite.vercel.config.ts`
- **Output Directory**: `dist/` (frontend static files)
- **API Functions**: `api/` directory (serverless functions)
- **Entry Point**: `index.html` (root level)

## Key Configuration Files

### vercel.json
```json
{
  "buildCommand": "npm install && npx vite build --config vite.vercel.config.ts",
  "outputDirectory": "dist",
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs20.x"
    }
  },
  "rewrites": [
    {
      "source": "/((?!api).*)",
      "destination": "/index.html"
    }
  ]
}
```

## API Routes
- `/api/feedback` - POST/GET for feedback collection and retrieval
- `/api/health` - GET for health check

### vite.vercel.config.ts
- Uses root directory as build base
- Outputs to `dist/` directory
- Includes proper path aliases for `@`, `@shared`, and `@assets`
- Automatically copies public assets (manifest.json, sw.js)

## Local Testing
Run the build locally to test:
```bash
npx vite build --config vite.vercel.config.ts
```

## Notes
- The original `vite.config.ts` is used for development only
- The `vite.vercel.config.ts` is specifically for Vercel deployment
- All dependencies are properly installed in the root `package.json`
- Static assets are automatically copied from `client/public/` to `dist/`