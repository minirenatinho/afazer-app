# CORS Fix Guide

## Problem
Your frontend is experiencing CORS errors when trying to authenticate with the backend:
```
Requisição cross-origin bloqueada: A diretiva Same Origin (mesma origem) não permite a leitura do recurso remoto em 'http://192.168.1.10:8000/api/v1/auth/me' (motivo: credencial não suportada se o cabeçalho 'Access-Control-Allow-Origin' do CORS for '*').
```

## Root Cause
- Frontend sends requests with `credentials: 'include'`
- Backend responds with `Access-Control-Allow-Origin: *`
- CORS policy: `*` is incompatible with credentials

## Solution: Fix Backend CORS Configuration

### Step 1: Add CORS Middleware to Backend

1. **Copy the `cors_config.py` file to your backend project**
2. **Import and configure CORS in your main.py:**

```python
from fastapi import FastAPI
from cors_config import configure_cors

app = FastAPI(title="Afazer Backend")

# Configure CORS - ADD THIS LINE
configure_cors(app)

# Your existing routes...
```

### Step 2: Install Required Package

Make sure you have the CORS middleware package installed in your backend:

```bash
pip install fastapi[all]
# or specifically:
pip install fastapi-cors
```

### Step 3: Restart Backend

After making these changes, restart your FastAPI backend:

```bash
# If using uvicorn:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4: Verify the Fix

The CORS configuration in `cors_config.py` allows:
- **Specific origins** instead of `*`
- **Credentials** (cookies, authorization headers)
- **All HTTP methods** (GET, POST, PUT, DELETE, etc.)
- **All headers**
- **Preflight request caching** (10 minutes)

## Alternative Solutions

### Option 2: Remove Credentials from Frontend (Not Recommended)

If you cannot modify the backend, you could remove `credentials: 'include'` from `api.ts`, but this will break cookie-based authentication.

### Option 3: Development Proxy

For development only, you can set up a proxy in Expo:

```javascript
// In app.json or app.config.js
{
  "expo": {
    "proxy": "http://192.168.1.10:8000"
  }
}
```

## Testing

After implementing the fix, test your login functionality:

1. Clear browser cache and cookies
2. Restart your Expo app
3. Attempt to login
4. Check browser dev tools for CORS errors

## Troubleshooting

If you still get CORS errors:

1. **Check backend logs** for CORS middleware initialization
2. **Verify allowed origins** match your frontend URL
3. **Check for multiple CORS middleware** instances
4. **Ensure no other middleware** is interfering with CORS headers

## Security Notes

The current configuration is suitable for development. For production:

1. **Restrict allowed origins** to only your production frontend URLs
2. **Consider using HTTPS** in production
3. **Review allowed methods and headers** to minimize exposure

## File Locations

- **Frontend API calls**: `api.ts` (already configured correctly)
- **Backend CORS config**: `cors_config.py` (new file to add to backend)
- **Environment variables**: `.env` (already configured)
