import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { changeAdminPassword } from "@/lib/auth/admin-users";
import { getAdminSession } from "@/lib/auth/session";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10),
  confirmPassword: z.string().min(10),
});

export async function POST(request: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) {
    return unauthorized;
  }

  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = changePasswordSchema.parse(await request.json());

    if (body.newPassword !== body.confirmPassword) {
      return NextResponse.json(
        { error: "New password and confirmation do not match" },
        { status: 400 },
      );
    }

    await changeAdminPassword({
      userId: session.userId,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to change password";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
