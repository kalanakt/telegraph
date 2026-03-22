import { describe, it, expect } from "vitest";
import {
  CreateBotBody,
  LoginBody,
  RegisterBody,
  SendTestMessageBody,
  parseBody,
} from "./validation.js";

describe("parseBody + Zod schemas", () => {
  it("RegisterBody accepts valid input and returns parsed data", () => {
    const input = {
      email: "user@example.com",
      password: "securepass",
      tenantName: "My Tenant",
    };
    const result = parseBody(RegisterBody, input);
    expect(result).toEqual(input);
  });

  it("RegisterBody throws statusCode 400 when email is missing", () => {
    try {
      parseBody(RegisterBody, {
        password: "securepass",
        tenantName: "My Tenant",
      });
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe("Validation failed");
    }
  });

  it("RegisterBody throws statusCode 400 for invalid email", () => {
    try {
      parseBody(RegisterBody, {
        email: "not-an-email",
        password: "securepass",
        tenantName: "My Tenant",
      });
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
    }
  });

  it("RegisterBody throws statusCode 400 for short password", () => {
    try {
      parseBody(RegisterBody, {
        email: "user@example.com",
        password: "short",
        tenantName: "My Tenant",
      });
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
    }
  });

  it("RegisterBody throws statusCode 400 when tenantName is missing", () => {
    try {
      parseBody(RegisterBody, {
        email: "user@example.com",
        password: "securepass",
      });
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
    }
  });

  it("LoginBody accepts valid input and returns parsed data", () => {
    const input = {
      email: "user@example.com",
      password: "mypassword",
    };
    const result = parseBody(LoginBody, input);
    expect(result).toEqual(input);
  });

  it("LoginBody throws statusCode 400 when fields are missing", () => {
    try {
      parseBody(LoginBody, {});
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
      expect(err.validation).toBeDefined();
    }
  });

  it("CreateBotBody accepts optional https webhookBaseUrl", () => {
    const input = {
      name: "Support Bot",
      token: "123:ABC",
      webhookBaseUrl: "https://demo.ngrok-free.app",
    };

    const result = parseBody(CreateBotBody, input);
    expect(result).toEqual(input);
  });

  it("CreateBotBody rejects non-https webhookBaseUrl", () => {
    expect(() =>
      parseBody(CreateBotBody, {
        name: "Support Bot",
        token: "123:ABC",
        webhookBaseUrl: "http://localhost:3002",
      }),
    ).toThrowError("Validation failed");
  });

  it("SendTestMessageBody accepts numeric-string chat IDs", () => {
    const result = parseBody(SendTestMessageBody, {
      chatId: "123456789",
      text: "hello",
    });

    expect(result).toEqual({
      chatId: "123456789",
      text: "hello",
    });
  });
});
