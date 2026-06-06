import { NextResponse } from "next/server";

import { getCronSecret } from "@/lib/settings/runtime-config";

export async function verifyJobAuth(request: Request): Promise<boolean> {
  const secret = await getCronSecret();

  if (!secret) {
    return process.env.NODE_ENV === "development";
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${secret}`;
}

export function unauthorizedJobResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
