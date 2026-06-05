import { NextResponse } from "next/server";

import {
  createSessionToken,
  getSessionClearCookieConfig,
  getSessionCookieConfig,
  verifyAdminPassword,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string };
  const password = body.password ?? "";

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = createSessionToken();
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(getSessionCookieConfig(token));

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(getSessionClearCookieConfig());

  return response;
}
