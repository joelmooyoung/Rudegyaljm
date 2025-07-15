# Debug Login Issues - Step by Step

## Step 1: Test API Endpoint

First, let's verify if the API functions are deployed correctly.

**After you push the latest changes**, test this URL in your browser:

```
https://your-app-name.vercel.app/api/test
```

**Expected result**: You should see a JSON response like:

```json
{
  "message": "Vercel API functions are working!",
  "timestamp": "2024-...",
  "method": "GET",
  "url": "/api/test"
}
```

**If you get 404**: The API functions aren't deployed correctly.

## Step 2: Test Login Endpoint

Test the login endpoint directly. Open browser developer tools (F12) and run:

```javascript
fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@nocturne.com",
    password: "test",
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

**Expected result**: Login success with user data and token.

## Step 3: Check Browser Console

1. Open your Vercel app
2. Press F12 to open developer tools
3. Go to "Console" tab
4. Try to login with `admin@nocturne.com` / `test`
5. Look for any error messages

**Common errors to look for**:

- Network errors (API not found)
- CORS errors
- 500 internal server errors

## Step 4: Check Network Tab

1. In developer tools, go to "Network" tab
2. Try logging in
3. Look for the `/api/auth/login` request
4. Check the status code and response

**If you see**:

- **404**: API functions not deployed
- **500**: Server error in the function
- **CORS error**: CORS headers issue

## Quick Fixes

### Fix 1: If API functions return 404

The `vercel.json` might need adjustment. Update it to:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist/spa",
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Fix 2: If you get CORS errors

The frontend might need absolute URLs. Check if this helps by temporarily changing the fetch call in Auth.tsx:

```javascript
const response = await fetch(`${window.location.origin}/api/auth/login`, {
```

### Fix 3: If nothing works

Try creating a simple `netlify.toml` or `_redirects` file:

```
/api/* /api/:splat 200
/* /index.html 200
```

## What to Report Back

After testing, please tell me:

1. **Test endpoint result**: What happens when you visit `/api/test`?
2. **Console errors**: Any red errors in browser console?
3. **Network status**: What status code does `/api/auth/login` return?
4. **Exact error message**: What error message shows in the login form?

This will help me pinpoint the exact issue!
