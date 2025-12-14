import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, AuthContextType, RegisterRequest } from '../types'
import { authService } from '../services/authService'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Auth Provider Component
 * 
 * Manages authentication state using Firebase.
 * Listens to Firebase auth state changes and syncs with local state.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get Firebase ID token (force refresh to detect password changes)
          const token = await firebaseUser.getIdToken(true)
          
          // Store token for API calls
          localStorage.setItem('firebase_token', token)
          
          // Fetch user profile from backend
          const userData = await authService.getCurrentUser()
          setUser(userData)
        } catch (error) {
          console.error('Failed to load user data:', error)
          localStorage.removeItem('firebase_token')
          setUser(null)
        }
      } else {
        // User logged out or token invalidated (e.g., password changed)
        localStorage.removeItem('firebase_token')
        setUser(null)
      }
      setLoading(false)
    })

    // Periodic token validation to detect password changes
    // Check every 30 seconds if token is still valid
    const tokenCheckInterval = setInterval(async () => {
      const currentUser = authService.getCurrentFirebaseUser()
      if (currentUser) {
        try {
          // Force refresh token - this will fail if password was changed
          await currentUser.getIdToken(true)
        } catch (error) {
          console.error('Token validation failed - password may have been changed:', error)
          // Token is invalid (password was changed), log user out
          await logout()
          window.location.href = '/login?message=session_expired'
        }
      }
    }, 30000) // Check every 30 seconds

    // Cleanup subscription on unmount
    return () => {
      unsubscribe()
      clearInterval(tokenCheckInterval)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password })
      
      // Store Firebase token
      localStorage.setItem('firebase_token', response.token)
      
      // Set user data
      setUser(response.user)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (userData: RegisterRequest) => {
    try {
      const response = await authService.register(userData)
      
      // Store Firebase token
      localStorage.setItem('firebase_token', response.token)
      
      // Set user data
      setUser(response.user)
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear user state even if logout fails
      setUser(null)
    }
  }

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 