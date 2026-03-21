import bcrypt from 'bcrypt';
import { and, eq } from 'drizzle-orm';
import { tenants, users } from '@telegraph/db/schema';
const SALT_ROUNDS = 12;
export async function register(db, input) {
    // Check tenant slug uniqueness
    const existing = await db.select().from(tenants).where(eq(tenants.slug, input.tenantSlug)).limit(1);
    if (existing.length > 0) {
        throw Object.assign(new Error('Tenant slug already taken'), { statusCode: 409 });
    }
    const result = await db.transaction(async (tx) => {
        const [tenant] = await tx
            .insert(tenants)
            .values({
            name: input.tenantName,
            slug: input.tenantSlug,
        })
            .returning();
        if (!tenant) {
            throw new Error('Failed to create tenant');
        }
        const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
        const [user] = await tx
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
    });
    return result;
}
export async function login(db, input) {
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
export function signToken(fastify, user) {
    return fastify.jwt.sign({
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
    }, { expiresIn: '24h' });
}
//# sourceMappingURL=auth.service.js.map