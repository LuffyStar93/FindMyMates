import jwt, { type JwtPayload, type Secret, type SignOptions, type VerifyOptions } from "jsonwebtoken";

export type Role = "User" | "Moderator" | "Admin";
type JwtPayloadBase = { sub: string; role: Role };

const ACCESS_SECRET: Secret = process.env.JWT_ACCESS_SECRET ?? "";
const REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET ?? "";
if (!ACCESS_SECRET) throw new Error("Missing JWT_ACCESS_SECRET");
if (!REFRESH_SECRET) throw new Error("Missing JWT_REFRESH_SECRET");

// Optionnels mais vivement recommandés en prod
const ISSUER = process.env.JWT_ISSUER || undefined;       
const AUDIENCE = process.env.JWT_AUDIENCE || undefined;    
const CLOCK_TOLERANCE = Number(process.env.JWT_CLOCK_TOLERANCE ?? 5);

function toExpires(v: string | undefined, fallback: SignOptions["expiresIn"]): SignOptions["expiresIn"] {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : (v as unknown as SignOptions["expiresIn"]);
}

const ACCESS_EXPIRES = toExpires(process.env.JWT_ACCESS_EXPIRES, "15m");
const REFRESH_EXPIRES = toExpires(process.env.JWT_REFRESH_EXPIRES, "7d");

// Options communes
const commonSignOpts: SignOptions = {
  issuer: ISSUER,
  audience: AUDIENCE,
  algorithm: "HS256",
};

// Options de vérification (plus strictes)
const commonVerifyOpts: VerifyOptions = {
  issuer: ISSUER,
  audience: AUDIENCE,
  algorithms: ["HS256"],
  clockTolerance: Number.isFinite(CLOCK_TOLERANCE) ? CLOCK_TOLERANCE : 5,
};

export function signAccessToken(payload: JwtPayloadBase) {
  const opts: SignOptions = { ...commonSignOpts, expiresIn: ACCESS_EXPIRES };
  return jwt.sign(payload, ACCESS_SECRET, opts);
}

export function signRefreshToken(payload: JwtPayloadBase) {
  const opts: SignOptions = { ...commonSignOpts, expiresIn: REFRESH_EXPIRES };
  return jwt.sign(payload, REFRESH_SECRET, opts);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET, commonVerifyOpts) as JwtPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET, commonVerifyOpts) as JwtPayload;
}

/** Helper pratique côté middleware/auth */
export function getAuthUserFromAccess(token: string): { id: string; role: Role } {
  const payload = verifyAccessToken(token);
  return { id: String(payload.sub), role: (payload.role as Role) || "User" };
}

/** Utilitaire optionnel (diagnostic/UX) */
export function isTokenExpired(token: string, isRefresh = false): boolean {
  try {
    const secret = isRefresh ? REFRESH_SECRET : ACCESS_SECRET;
    const decoded = jwt.verify(token, secret, { ...commonVerifyOpts, ignoreExpiration: true }) as JwtPayload;
    if (!decoded?.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return now > decoded.exp;
  } catch {
    return true;
  }
}