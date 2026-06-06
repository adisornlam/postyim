import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth/session";

export async function requireAdminSessionUser() {
  const session = await getAdminSession();

  if (!session) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }

  return { response: null, session };
}

export async function requireSuperAdminSession() {
  const result = await requireAdminSessionUser();

  if (result.response) {
    return result;
  }

  if (result.session?.role !== "superadmin") {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }

  return result;
}

export async function requireAdminSession() {
  const result = await requireAdminSessionUser();
  return result.response;
}
