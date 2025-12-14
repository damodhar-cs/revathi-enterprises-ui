# Frontend Firebase Setup Guide

## 🔥 Firebase Configuration for React Frontend

### Step 1: Get Firebase Web Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the **⚙️ gear icon** → **Project settings**
4. Scroll down to **"Your apps"** section
5. If you haven't added a web app:
   - Click **"Add app"** → Select **Web (</> icon)**
   - Enter app nickname (e.g., "Revathi Enterprises Web")
   - **No need** to set up Firebase Hosting
   - Click **"Register app"**

6. You'll see the Firebase SDK configuration:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

### Step 2: Configure Environment Variables

Create `.env` file in `revathi-enterprises-ui/` directory:

```bash
# Backend API URL
VITE_BACKEND_URL=http://localhost:3000

# Firebase Configuration (from step 1)
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

**Important:**
- Replace all values with your actual Firebase config
- Don't commit `.env` to Git (it's already in `.gitignore`)
- Use `.env.example` as a template

### Step 3: Install Dependencies (Already Done)

Firebase SDK is already installed:
```bash
npm install firebase  # ✅ Already completed
```

### Step 4: Start Frontend

```bash
cd revathi-enterprises-ui
npm run dev
```

The app will run on `http://localhost:8000`

---

## 🧪 Test Authentication

### 1. Create a Test User in Firebase

**Option A: Firebase Console**
1. Go to **Authentication** → **Users**
2. Click **"Add user"**
3. Enter your email and password
4. Click **"Add user"**

**Option B: Register via Frontend**
1. Go to `http://localhost:8000` (will redirect to login)
2. Click **"Register"** or **"Sign Up"**
3. Fill in the form with your details
4. Submit to create account

### 2. Test Login

1. Go to `http://localhost:8000/login`
2. Enter your email and password
3. Click **"Login"**
4. You should be redirected to the dashboard

**Success indicators:**
- ✅ No console errors
- ✅ Redirected to `/dashboard`
- ✅ User profile loads correctly
- ✅ API calls work (products, variants, etc.)

---

## 🔐 How It Works

### Authentication Flow:

```
1. User enters email/password → Login Form

2. Frontend calls authService.login()
   ↓
3. Firebase Client SDK authenticates user
   ↓
4. Firebase returns ID token (JWT)
   ↓
5. Token stored in localStorage as 'firebase_token'
   ↓
6. API interceptor adds token to all requests:
   Authorization: Bearer <firebase-token>
   ↓
7. Backend verifies token with Firebase Admin SDK
   ↓
8. If valid, request proceeds; if invalid, 401 error
```

### Token Management:

- **Token Storage**: `localStorage.getItem('firebase_token')`
- **Token Expiration**: 1 hour (Firebase default)
- **Auto-Refresh**: Handled by Firebase SDK via `onAuthStateChanged`
- **API Calls**: Token automatically added to all requests

---

## 🚨 Common Issues & Fixes

### Issue: "Firebase configuration is incomplete"

**Check console for:**
```
❌ Firebase configuration is incomplete. Please check your .env file.
```

**Solution:**
1. Ensure `.env` file exists in project root
2. All `VITE_FIREBASE_*` variables are set
3. Values are copied exactly from Firebase Console
4. Restart dev server: `npm run dev`

---

### Issue: Login shows "auth/user-not-found"

**Solution:**
- User doesn't exist in Firebase
- Create user in Firebase Console or register via UI

---

### Issue: "auth/wrong-password"

**Solution:**
- Password is incorrect
- Reset password or use correct credentials

---

### Issue: "auth/invalid-email"

**Solution:**
- Email format is invalid
- Check for typos or spaces

---

### Issue: "401 Unauthorized" on API calls

**Possible causes:**
1. Firebase token expired (auto-refreshes after 1 hour)
2. Backend not running
3. Backend Firebase config incorrect

**Solution:**
1. Check backend is running: `http://localhost:3000`
2. Check backend console for Firebase initialization message
3. Try logging out and back in (refreshes token)

---

### Issue: "Cannot POST /auth/login"

**This is expected!** 
- There is NO `/auth/login` endpoint on the backend
- Authentication happens on the frontend via Firebase Client SDK
- Backend only verifies the Firebase token

---

## 📝 Code Structure

### Firebase Configuration
```
src/config/firebase.ts       ← Firebase initialization
```

### Authentication Service
```
src/services/authService.ts  ← Login, register, logout functions
```

### Auth Context
```
src/context/AuthContext.tsx  ← Global auth state management
```

### API Interceptor
```
src/services/api.ts          ← Adds token to all API calls
```

---

## 🔒 Security Notes

### ✅ Safe to Commit:
- `VITE_FIREBASE_API_KEY` - Not a secret, safe in frontend code
- `VITE_FIREBASE_AUTH_DOMAIN` - Public configuration
- Other Firebase config values

### ❌ Never Commit:
- Backend service account credentials
- User passwords
- Private API keys

### 🔐 Token Security:
- Tokens stored in localStorage (acceptable for web apps)
- Tokens expire after 1 hour
- Backend verifies every token with Firebase Admin SDK
- HTTPS required in production

---

## 🎯 Production Deployment

### Update `.env` for Production:

```bash
# Production Backend URL
VITE_BACKEND_URL=https://your-api-domain.com

# Firebase config (same as development)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# ... rest of config
```

### Contentstack Launch Configuration:

In Contentstack Launch dashboard, add environment variables:
- `VITE_BACKEND_URL=https://revathi-enterprises-core.contentstackapps.com`
- `VITE_FIREBASE_API_KEY=your-api-key`
- `VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com`
- (all other Firebase variables)

---

## ✅ Setup Checklist

- [ ] Firebase project created
- [ ] Web app added to Firebase project
- [ ] `.env` file created with Firebase config
- [ ] Backend running with Firebase Admin SDK initialized
- [ ] Test user created in Firebase
- [ ] Frontend dev server running
- [ ] Successfully logged in
- [ ] API calls working (dashboard, products load)
- [ ] Token automatically added to requests
- [ ] Logout works correctly

---

## 🔄 Token Refresh (Automatic)

Firebase SDK automatically refreshes tokens before they expire. The `onAuthStateChanged` listener in `AuthContext` handles this:

```typescript
useEffect(() => {
  const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      // Get fresh token (automatically refreshed if needed)
      const token = await firebaseUser.getIdToken();
      localStorage.setItem('firebase_token', token);
    }
  });
  
  return () => unsubscribe();
}, []);
```

**You don't need to manually refresh tokens!** Firebase handles it automatically.

---

## 📚 Additional Resources

- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
- [Firebase Authentication](https://firebase.google.com/docs/auth/web/start)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

**🎉 Frontend Firebase setup complete!**

You can now authenticate users and make secure API calls to your NestJS backend.

