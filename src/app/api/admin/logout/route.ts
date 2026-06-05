import { NextResponse } from "next/server";

import { getSessionClearCookieConfig } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(getSessionClearCookieConfig());

  return response;
}
