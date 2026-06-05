import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth/session";

export async function requireAdminSession() {
  const authenticated = await getAdminSession();

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
