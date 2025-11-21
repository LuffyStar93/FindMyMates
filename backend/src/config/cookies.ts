import type { CookieOptions } from 'express'

export const REFRESH_COOKIE = 'refresh_token'
export const REFRESH_COOKIE_PATH = '/'

// .env :
// NODE_ENV=development | production
// REFRESH_TTL_DAYS=30
// COOKIE_DOMAIN=example.com        
// COOKIE_SECURE_OVERRIDE=false

const isProd = process.env.NODE_ENV === 'production'

function days(n: number) {
  return n * 24 * 60 * 60 * 1000
}

export function buildRefreshCookieOptions(): CookieOptions {
  const ttlDays = Number(process.env.REFRESH_TTL_DAYS ?? 30)
  const ttl = days(Number.isFinite(ttlDays) ? ttlDays : 30)

  // En prod (HTTPS + cross-site), SameSite=None + secure obligatoire
  // En dev (http://localhost), SameSite=Lax + secure=false
  const secureFlag =
    process.env.COOKIE_SECURE_OVERRIDE !== undefined
      ? String(process.env.COOKIE_SECURE_OVERRIDE).toLowerCase() === 'true'
      : isProd

  const sameSite: CookieOptions['sameSite'] = isProd ? 'none' : 'lax'

  // Ne pas définir domain en local, sinon le cookie ne s’écrit pas.
  const domain =
    isProd && process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN.trim().length > 0
      ? process.env.COOKIE_DOMAIN.trim()
      : undefined

  const options: CookieOptions = {
    httpOnly: true,
    secure: secureFlag,
    sameSite,
    path: REFRESH_COOKIE_PATH, // DOIT matcher clearCookie()
    maxAge: ttl,
    domain,
  }

  return options
}

/** Utilitaire pratique pour poser le cookie */
export function setRefreshCookie(res: import('express').Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, buildRefreshCookieOptions())
}

/** Utilitaire pour le supprimer (path/domain/samesite/secure doivent matcher) */
export function clearRefreshCookie(res: import('express').Response) {
  const opts = buildRefreshCookieOptions()
  // Pour clear, Express exige les mêmes attributs critiques (path, domain, sameSite, secure)
  res.clearCookie(REFRESH_COOKIE, {
    path: opts.path,
    domain: opts.domain,
    secure: opts.secure,
    sameSite: opts.sameSite,
  })
}
