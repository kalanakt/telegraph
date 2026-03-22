import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import type { Database } from "@telegraph/db/client";
import { tenants, users } from "@telegraph/db/schema";

const SALT_ROUNDS = 12;

interface RegisterInput {
  email: string;
  password: string;
  tenantName: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function buildTenantSlug(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  const base = normalized || "workspace";
  return base.slice(0, 50);
}

async function reserveUniqueTenantSlug(
  db: Pick<Database, "select">,
  tenantName: string,
): Promise<string> {
  const base = buildTenantSlug(tenantName);
  let index = 1;

  while (index <= 1_000) {
    const suffix = index === 1 ? "" : `-${index}`;
    const maxBaseLength = 50 - suffix.length;
    const candidate = `${base.slice(0, Math.max(1, maxBaseLength))}${suffix}`;

    const existing = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, candidate))
      .limit(1);
    if (existing.length === 0) {
      return candidate;
    }

    index++;
  }

  throw new Error("Unable to reserve tenant slug");
}

export async function register(db: Database, input: RegisterInput) {
  const email = normalizeEmail(input.email);
  const tenantName = input.tenantName.trim();

  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existingUser.length > 0) {
    throw Object.assign(new Error("Email already registered"), {
      statusCode: 409,
    });
  }

  const result = await db.transaction(async (tx) => {
    const tenantSlug = await reserveUniqueTenantSlug(tx, tenantName);

    const [tenant] = await tx
      .insert(tenants)
      .values({
        name: tenantName,
        slug: tenantSlug,
      })
      .returning();

    if (!tenant) {
      throw new Error("Failed to create tenant");
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const [user] = await tx
      .insert(users)
      .values({
        tenantId: tenant.id,
        email,
        passwordHash,
        role: "owner",
      })
      .returning();

    if (!user) {
      throw new Error("Failed to create user");
    }

    return { user, tenant };
  });

  return result;
}

export async function login(db: Database, input: LoginInput) {
  const email = normalizeEmail(input.email);
  const rows = await db
    .select({
      user: users,
      tenant: tenants,
    })
    .from(users)
    .innerJoin(tenants, eq(users.tenantId, tenants.id))
    .where(eq(users.email, email))
    .limit(2);
  if (rows.length === 0) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }
  if (rows.length > 1) {
    throw Object.assign(
      new Error("Ambiguous account for email. Contact support."),
      { statusCode: 409 },
    );
  }

  const row = rows[0]!;
  const user = row.user;
  const tenant = row.tenant;

  // Verify password
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  return { user, tenant };
}

export function signToken(
  fastify: FastifyInstance,
  user: { id: string; tenantId: string; role: string },
): string {
  return fastify.jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    },
    { expiresIn: "24h" },
  );
}
