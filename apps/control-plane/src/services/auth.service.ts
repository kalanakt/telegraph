import bcrypt from 'bcrypt';
import { and, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

import type { Database } from '@telegraph/db/client';
import { tenants, users } from '@telegraph/db/schema';

const SALT_ROUNDS = 12;

interface RegisterInput {
  email: string;
  password: string;
  tenantName: string;
  tenantSlug: string;
}

interface LoginInput {
  email: string;
  password: string;
  tenantSlug: string;
}

export async function register(db: Database, input: RegisterInput) {
  // Check tenant slug uniqueness
  const existing = await db.select().from(tenants).where(eq(tenants.slug, input.tenantSlug)).limit(1);
  if (existing.length > 0) {
    throw Object.assign(new Error('Tenant slug already taken'), { statusCode: 409 });
  }

  // Insert tenant
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: input.tenantName,
      slug: input.tenantSlug,
    })
    .returning();

  if (!tenant) {
    throw new Error('Failed to create tenant');
  }

  // Hash password and insert user
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const [user] = await db
    .insert(users)
    .values({
      tenantId: tenant.id,
      email: input.email,
      passwordHash,
      role: 'owner',
    })
    .returning();

  if (!user) {
    throw new Error('Failed to create user');
  }

  return { user, tenant };
}

export async function login(db: Database, input: LoginInput) {
  // Find tenant by slug
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, input.tenantSlug)).limit(1);
  if (!tenant) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  // Find user by tenantId + email
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.tenantId, tenant.id), eq(users.email, input.email)))
    .limit(1);
  if (!user) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  // Verify password
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  return { user, tenant };
}

export function signToken(
  fastify: FastifyInstance,
  user: { id: string; tenantId: string; role: string },
): string {
  return fastify.jwt.sign({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
  }, { expiresIn: '24h' });
}
