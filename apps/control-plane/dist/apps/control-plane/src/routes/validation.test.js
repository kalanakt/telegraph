import { describe, it, expect } from 'vitest';
import { RegisterBody, LoginBody, parseBody } from './validation.js';
describe('parseBody + Zod schemas', () => {
    // 1. RegisterBody — valid
    it('RegisterBody accepts valid input and returns parsed data', () => {
        const input = {
            email: 'user@example.com',
            password: 'securepass',
            tenantName: 'My Tenant',
            tenantSlug: 'my-tenant-1',
        };
        const result = parseBody(RegisterBody, input);
        expect(result).toEqual(input);
    });
    // 2. RegisterBody — missing email
    it('RegisterBody throws statusCode 400 when email is missing', () => {
        try {
            parseBody(RegisterBody, {
                password: 'securepass',
                tenantName: 'My Tenant',
                tenantSlug: 'my-tenant',
            });
            expect.fail('should have thrown');
        }
        catch (err) {
            expect(err.statusCode).toBe(400);
            expect(err.message).toBe('Validation failed');
        }
    });
    // 3. RegisterBody — invalid email
    it('RegisterBody throws statusCode 400 for invalid email', () => {
        try {
            parseBody(RegisterBody, {
                email: 'not-an-email',
                password: 'securepass',
                tenantName: 'My Tenant',
                tenantSlug: 'my-tenant',
            });
            expect.fail('should have thrown');
        }
        catch (err) {
            expect(err.statusCode).toBe(400);
        }
    });
    // 4. RegisterBody — short password (< 8 chars)
    it('RegisterBody throws statusCode 400 for short password', () => {
        try {
            parseBody(RegisterBody, {
                email: 'user@example.com',
                password: 'short',
                tenantName: 'My Tenant',
                tenantSlug: 'my-tenant',
            });
            expect.fail('should have thrown');
        }
        catch (err) {
            expect(err.statusCode).toBe(400);
        }
    });
    // 5. RegisterBody — invalid tenant slug (uppercase/spaces)
    it('RegisterBody throws statusCode 400 for invalid tenant slug', () => {
        try {
            parseBody(RegisterBody, {
                email: 'user@example.com',
                password: 'securepass',
                tenantName: 'My Tenant',
                tenantSlug: 'Bad Slug!',
            });
            expect.fail('should have thrown');
        }
        catch (err) {
            expect(err.statusCode).toBe(400);
        }
    });
    // 6. LoginBody — valid
    it('LoginBody accepts valid input and returns parsed data', () => {
        const input = {
            email: 'user@example.com',
            password: 'mypassword',
            tenantSlug: 'acme',
        };
        const result = parseBody(LoginBody, input);
        expect(result).toEqual(input);
    });
    // 7. LoginBody — missing fields
    it('LoginBody throws statusCode 400 when fields are missing', () => {
        try {
            parseBody(LoginBody, {});
            expect.fail('should have thrown');
        }
        catch (err) {
            expect(err.statusCode).toBe(400);
            expect(err.validation).toBeDefined();
        }
    });
});
//# sourceMappingURL=validation.test.js.map