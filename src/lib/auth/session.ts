import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "postyim_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export interface AdminSession {
  userId: string;
  email: string;
  name: string;
  role: "superadmin" | "admin";
}

interface SessionPayload extends AdminSession {
  authenticated: true;
  exp: number;
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "development") {
    return "postyim-dev-secret";
  }

  throw new Error("AUTH_SECRET is required in production");
}

function signPayload(payload: string): string {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

export function createSessionToken(user: AdminSession): string {
  const payload = Buffer.from(
    JSON.stringify({
      authenticated: true,
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      exp: Date.now() + SESSION_MAX_AGE * 1000,
    } satisfies SessionPayload),
  ).toString("base64url");

  return `${payload}.${signPayload(payload)}`;
}

export function verifySessionToken(token: string | undefined): AdminSession | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = signPayload(payload);

  try {
    const validSignature = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );

    if (!validSignature) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<SessionPayload>;

    if (
      !data.authenticated ||
      !data.userId ||
      !data.email ||
      !data.name ||
      !data.role ||
      !data.exp ||
      data.exp <= Date.now()
    ) {
      return null;
    }

    return {
      userId: data.userId,
      email: data.email,
      name: data.name,
      role: data.role,
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export function getSessionCookieConfig(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function getSessionClearCookieConfig() {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}
