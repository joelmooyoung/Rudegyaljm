# Debug Login - API Working But Login Fails

Great! Since `/api/test` works, the API functions are deployed correctly. Now let's debug the specific login issue.

## Step 1: Test Login Endpoint Directly

Open browser console (F12) on your Vercel app and run:

```javascript
fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@nocturne.com",
    password: "test",
  }),
})
  .then((response) => {
    console.log("Status:", response.status);
    return response.json();
  })
  .then((data) => console.log("Response:", data))
  .catch((error) => console.error("Error:", error));
```

**Expected result**: Should return user data with token.

## Step 2: Test in Login Form

1. Open browser console (F12)
2. Try logging in with the form using:
   - Email: `admin@nocturne.com`
   - Password: `test`
3. Watch the console for any errors
4. Check the Network tab for the request

## Step 3: Common Issues to Check

### Issue 1: Form Data Not Being Sent

If the direct fetch works but the form doesn't, the issue is in the React form state.

**Check**: Are you typing in the email/password fields correctly?

### Issue 2: CORS or Network Error

Look for errors like:

- "CORS policy"
- "Failed to fetch"
- "Network error"

### Issue 3: Wrong Credentials Format

The login expects exactly:

- Email: `admin@nocturne.com` (case sensitive)
- Password: Any non-empty string

## Step 4: Quick Test Results

Please tell me:

1. **Direct API test result**: What happens when you run the fetch command in console?
2. **Form login result**: What happens when you use the login form?
3. **Console errors**: Any red errors in browser console?
4. **Network tab**: What status code and response do you see for `/api/auth/login`?

## Expected Working Flow

When working correctly:

1. You type `admin@nocturne.com` and `test`
2. Form sends POST to `/api/auth/login`
3. API returns status 200 with user data
4. You get logged in and see the main app

**Run the direct API test first and let me know the result!**
