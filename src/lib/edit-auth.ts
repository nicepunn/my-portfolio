import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const EDIT_AUTH_COOKIE = "resume_edit_auth";

/** Default password for the /edit gate. Override with RESUME_EDIT_PASSWORD. */
export function getEditPassword() {
  const fromEnv = process.env.RESUME_EDIT_PASSWORD?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : "punpun";
}

export function verifyEditPassword(password: string) {
  const expected = getEditPassword();
  const provided = password.trim();
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createEditSessionToken() {
  return createHmac("sha256", getEditPassword())
    .update("resume-edit-session")
    .digest("hex");
}

export function verifyEditSessionToken(token: string | undefined | null) {
  if (!token) return false;
  const expected = createEditSessionToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function isEditAuthenticated() {
  const store = await cookies();
  return verifyEditSessionToken(store.get(EDIT_AUTH_COOKIE)?.value);
}

export function editAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
