import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from './api';
import { LoginRequest, RegisterRequest, User } from '../types';

/**
 * Firebase Authentication Service
 * 
 * Handles all authentication operations using Firebase Client SDK.
 * Authentication happens on the frontend, token is stored and used for API calls.
 */
export const authService = {
  /**
   * Login with email and password
   * Uses Firebase Authentication (no backend /auth/login endpoint needed)
   */
  async login(credentials: LoginRequest): Promise<{ user: User; token: string }> {
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // Get Firebase ID token
      const token = await userCredential.user.getIdToken();

      // Map Firebase user to our User type
      const user: User = {
        _id: userCredential.user.uid,
        name: userCredential.user.displayName || 'User',
        email: userCredential.user.email || '',
        role: 'user',
        isActive: true,
        createdBy: userCredential.user.uid,
        updatedBy: userCredential.user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return { user, token };
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Provide user-friendly error messages
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        // Combine user-not-found and wrong-password for security (don't reveal which one)
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled. Please contact support.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again after some time or reset your password.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else {
        throw new Error('Unable to sign in. Please check your credentials and try again.');
      }
    }
  },

  /**
   * Register a new user
   * Creates user in Firebase Authentication
   */
  async register(userData: RegisterRequest): Promise<{ user: User; token: string }> {
    try {
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // Get Firebase ID token
      const token = await userCredential.user.getIdToken();

      // Update Firebase user profile with display name
      await updateProfile(userCredential.user, {
        displayName: userData.name,
      });

      // Map to our User type
      const user: User = {
        _id: userCredential.user.uid,
        name: userData.name,
        email: userCredential.user.email || '',
        role: 'user',
        isActive: true,
        createdBy: userCredential.user.uid,
        updatedBy: userCredential.user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return { user, token };
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use at least 6 characters.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address format.');
      } else {
        throw new Error(error.message || 'Registration failed. Please try again.');
      }
    }
  },

  /**
   * Get current authenticated user profile from backend
   * Uses Firebase token to authenticate with backend
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/auth/profile');
      
      // Map backend response to User type
      const profileData = response.data;
      return {
        _id: profileData.uid,
        name: profileData.name || profileData.email?.split('@')[0] || 'User',
        email: profileData.email || '',
        role: 'user',
        isActive: true,
        createdBy: profileData.uid,
        updatedBy: profileData.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  },

  /**
   * Logout current user
   * Signs out from Firebase and clears local storage
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      localStorage.removeItem('firebase_token');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still remove token even if signOut fails
      localStorage.removeItem('firebase_token');
    }
  },

  /**
   * Listen to authentication state changes
   * Call this to keep auth state in sync
   */
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Get current Firebase user object
   * Used for token validation and auth state checks
   */
  getCurrentFirebaseUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  /**
   * Get current Firebase ID token
   * Use this to make authenticated API calls
   */
  async getCurrentToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  },

  /**
   * Reset password for authenticated user
   * No email needed - backend gets it from JWT token
   */
  async resetPassword(): Promise<{ message: string; email: string; resetLink?: string }> {
    try {
      const response = await api.post('/auth/reset-password');
      return response.data;
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  },

  /**
   * Change password for authenticated user
   * Requires valid Firebase token
   */
  async changePassword(newPassword: string): Promise<void> {
    try {
      await api.post('/auth/change-password', { newPassword });
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  },
};
