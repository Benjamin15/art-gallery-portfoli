import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'

export interface AdminSession {
  isAuthenticated: boolean
  loginTime: string
  expiresAt: string
}

export function useAdminAuth() {
  const [session, setSession] = useKV<AdminSession | null>('admin-session', null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if session is still valid on mount
    const checkSession = () => {
      if (session) {
        const now = new Date().getTime()
        const expiresAt = new Date(session.expiresAt).getTime()
        
        if (now > expiresAt) {
          // Session expired, clear it
          setSession(null)
        }
      }
      setIsLoading(false)
    }

    checkSession()
  }, [session, setSession])

  const login = (username: string, password: string): boolean => {
    // Simple authentication check
    if (username === 'admin' && password === 'admin') {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
      
      const newSession: AdminSession = {
        isAuthenticated: true,
        loginTime: now.toISOString(),
        expiresAt: expiresAt.toISOString()
      }
      
      setSession(newSession)
      return true
    }
    return false
  }

  const logout = () => {
    setSession(null)
  }

  const isAuthenticated = session?.isAuthenticated || false

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    session
  }
}