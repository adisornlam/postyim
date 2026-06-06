import { NextResponse } from "next/server";

import { authenticateAdmin } from "@/lib/auth/admin-users";
import {
  createSessionToken,
  getSessionClearCookieConfig,
  getSessionCookieConfig,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  const user = await authenticateAdmin({ email, password });

  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const response = NextResponse.json({
    status: "ok",
    user: {
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
  response.cookies.set(getSessionCookieConfig(token));

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(getSessionClearCookieConfig());

  return response;
}
