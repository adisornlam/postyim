import { eq } from "drizzle-orm";

import { db } from "@/db";
import { adminUsers } from "@/db/schema/admin-users";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export interface AdminUserRecord {
  id: string;
  email: string;
  name: string;
  role: "superadmin" | "admin";
}

export async function authenticateAdmin(input: {
  email: string;
  password: string;
}): Promise<AdminUserRecord | null> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, normalizedEmail))
    .limit(1);

  if (!user || !user.isActive) {
    return null;
  }

  if (!verifyPassword(input.password, user.passwordHash)) {
    return null;
  }

  await db
    .update(adminUsers)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(adminUsers.id, user.id));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function getAdminUserById(userId: string) {
  const [user] = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      isActive: adminUsers.isActive,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, userId))
    .limit(1);

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

export async function changeAdminPassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, input.userId))
    .limit(1);

  if (!user || !user.isActive) {
    throw new Error("Account not found");
  }

  if (!verifyPassword(input.currentPassword, user.passwordHash)) {
    throw new Error("Current password is incorrect");
  }

  if (input.newPassword.length < 10) {
    throw new Error("New password must be at least 10 characters");
  }

  if (input.currentPassword === input.newPassword) {
    throw new Error("New password must be different from the current password");
  }

  await db
    .update(adminUsers)
    .set({
      passwordHash: hashPassword(input.newPassword),
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, input.userId));
}

export async function ensureSuperAdminUser(input: {
  email: string;
  password: string;
  name?: string;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();

  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, normalizedEmail))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(adminUsers)
    .values({
      email: normalizedEmail,
      passwordHash: hashPassword(input.password),
      name: input.name ?? "Super Admin",
      role: "superadmin",
      isActive: true,
    })
    .returning({ id: adminUsers.id });

  return created;
}
