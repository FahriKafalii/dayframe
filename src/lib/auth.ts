import { createHmac, timingSafeEqual } from "crypto";
import { type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

const COOKIE_NAME = "session";
const TTL_SECONDS = 14 * 24 * 60 * 60; // 14 days

function base64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function base64urlEncode(str: string): string {
  return Buffer.from(str, "utf8").toString("base64url");
}

function base64urlDecode(str: string): string {
  return Buffer.from(str, "base64url").toString("utf8");
}

function sign(payload: string): string {
  const hmac = createHmac("sha256", env.SESSION_SECRET);
  hmac.update(payload);
  return base64url(hmac.digest());
}

interface SessionPayload {
  uid: string;
  iat: number;
  exp: number;
}

export function createSessionCookie(uid: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { uid, iat: now, exp: now + TTL_SECONDS };
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionCookie(cookieValue: string): SessionPayload {
  const dot = cookieValue.indexOf(".");
  if (dot === -1) {
    throw new AppError("UNAUTHORIZED", "Invalid session");
  }

  const encodedPayload = cookieValue.slice(0, dot);
  const providedSig = cookieValue.slice(dot + 1);
  const expectedSig = sign(encodedPayload);

  const sigBuf = Buffer.from(providedSig, "base64url");
  const expectedBuf = Buffer.from(expectedSig, "base64url");

  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    throw new AppError("UNAUTHORIZED", "Invalid session");
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(base64urlDecode(encodedPayload));
  } catch {
    throw new AppError("UNAUTHORIZED", "Invalid session");
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) {
    throw new AppError("UNAUTHORIZED", "Session expired");
  }

  return payload;
}

export function requireUserId(request: NextRequest): string {
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) {
    throw new AppError("UNAUTHORIZED", "Authentication required");
  }
  const payload = verifySessionCookie(cookie);
  return payload.uid;
}

export function setCookieHeaders(cookieValue: string): string {
  const parts = [
    `${COOKIE_NAME}=${cookieValue}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${TTL_SECONDS}`,
  ];
  if (env.isProduction) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function clearCookieHeaders(): string {
  const parts = [
    `${COOKIE_NAME}=`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=0",
  ];
  if (env.isProduction) {
    parts.push("Secure");
  }
  return parts.join("; ");
}
