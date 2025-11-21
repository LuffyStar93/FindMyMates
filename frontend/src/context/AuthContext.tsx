import { api } from '@/lib/api'
import { setAccessToken } from '@/lib/authToken'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type User = {
  id: number
  email: string
  pseudo?: string
  name?: string
  role?: 'User' | 'Moderator' | 'Admin'
}

type AuthCtx = {
  user: User | null
  loading: boolean
  login: (emailOrPseudo: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        try {
          const { data } = await api.post('/auth/refresh')
          const token = (data as any)?.accessToken
          if (token) setAccessToken(token)
        } catch {
        }
        await refreshMeInternal()
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const refreshMeInternal = async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser((data as any).user ?? data)
    } catch {
      setUser(null)
    }
  }

  const refreshMe = async () => {
    await refreshMeInternal()
  }

  const login = async (emailOrPseudo: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', { emailOrPseudo, password })
      const access = (data as any)?.accessToken
      if (access) setAccessToken(access)
      const maybeUser = (data as any)?.user
      if (maybeUser) {
        setUser(maybeUser)
      } else {
        await refreshMeInternal()
      }
    } catch (e: any) {
      const data = e?.response?.data
      const msg: string =
        (typeof data?.message === 'string' && data.message) ||
        (typeof data?.error === 'string' && data.error) ||
        (typeof e?.message === 'string' && e.message) ||
        'Erreur de connexion'
      throw new Error(msg)
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshMe }),
    [user, loading]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
