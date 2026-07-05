'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import {
  clearStoredClinic,
  loadCurrentAuthSession,
  type AuthSessionData,
} from '@/lib/supabase/session'

type AuthSessionContextValue = {
  authSession: AuthSessionData | null
  loading: boolean
  refresh: () => Promise<AuthSessionData | null>
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null)

export default function AuthSessionProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [authSession, setAuthSession] = useState<AuthSessionData | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const currentSession = await loadCurrentAuthSession()
      setAuthSession(currentSession)
      return currentSession
    } catch (error) {
      clearStoredClinic()
      setAuthSession(null)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const supabase = createBrowserClient()

    const restoreTimer = window.setTimeout(() => {
      void refresh().catch(() => undefined)
    }, 0)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearStoredClinic()
        setAuthSession(null)
        setLoading(false)
        return
      }

      void refresh().catch(() => undefined)
    })

    return () => {
      window.clearTimeout(restoreTimer)
      subscription.unsubscribe()
    }
  }, [refresh])

  return (
    <AuthSessionContext.Provider value={{ authSession, loading, refresh }}>
      {children}
    </AuthSessionContext.Provider>
  )
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext)

  if (!context) {
    throw new Error('useAuthSession debe utilizarse dentro de AuthSessionProvider')
  }

  return context
}
