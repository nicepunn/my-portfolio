import { NextResponse } from "next/server";
import {
  EDIT_AUTH_COOKIE,
  createEditSessionToken,
  editAuthCookieOptions,
  isEditAuthenticated,
  verifyEditPassword,
} from "@/lib/edit-auth";

export async function GET() {
  return NextResponse.json({
    authenticated: await isEditAuthenticated(),
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const password =
    typeof body === "object" &&
    body !== null &&
    "password" in body &&
    typeof (body as { password: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!verifyEditPassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    EDIT_AUTH_COOKIE,
    createEditSessionToken(),
    editAuthCookieOptions(),
  );
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(EDIT_AUTH_COOKIE, "", {
    ...editAuthCookieOptions(),
    maxAge: 0,
  });
  return response;
}
