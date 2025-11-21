import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from 'axios'
import { getAccessToken, setAccessToken } from './authToken'

// Base URL:
// - En préprod/prod : VITE_API_URL = https://preprod-fmm.chagnonmaxime.fr/api
// - En dev : fallback sur /api (proxy Vite ou même origine)
const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  '/api'

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

/** Helper type-safe pour poser un header, même si headers est AxiosHeaders */
function setAuth(config: InternalAxiosRequestConfig, token: string) {
  const headers = new AxiosHeaders(config.headers)
  headers.set('Authorization', `Bearer ${token}`)
  config.headers = headers
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const t = getAccessToken()
  if (t) setAuth(config, t)
  return config
})

let isRefreshing = false
let queue: { resolve: (t: string) => void; reject: (e: any) => void }[] = []

function flushQueue(error: any, token: string | null) {
  queue.forEach((p) => (token ? p.resolve(token) : p.reject(error)))
  queue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean })
    const url = original?.url ?? ''

    // On évite la boucle de refresh sur les endpoints auth
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh')

    if (status !== 401 || original?._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }

    original._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (token) => {
            setAuth(original, token)
            resolve(api(original))
          },
          reject,
        })
      })
    }

    isRefreshing = true
    try {
      // refresh est relatif à baseURL => /auth/refresh
      const { data } = await api.post('/auth/refresh')
      const token = (data as any)?.accessToken
      if (!token) throw new Error('No accessToken in refresh response')

      setAccessToken(token)
      flushQueue(null, token)

      setAuth(original, token)
      return api(original)
    } catch (e) {
      setAccessToken(null)
      flushQueue(e, null)
      return Promise.reject(e)
    } finally {
      isRefreshing = false
    }
  }
)