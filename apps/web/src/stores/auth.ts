import { apiRequest } from "@/lib/api";
import { defineStore } from "pinia";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthTenant {
  id: string;
  name: string;
  slug: string;
}

interface AuthSessionResponse {
  token: string;
  user: AuthUser;
  tenant: AuthTenant;
}

interface AuthState {
  hydrated: boolean;
  token: string | null;
  user: AuthUser | null;
  tenant: AuthTenant | null;
}

const AUTH_STORAGE_KEY = "telegraph-auth-v2";

function readPersistedState(): Pick<
  AuthState,
  "token" | "user" | "tenant"
> | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    if (
      typeof parsed.token === "string" &&
      parsed.user &&
      typeof parsed.user === "object" &&
      parsed.tenant &&
      typeof parsed.tenant === "object"
    ) {
      return {
        token: parsed.token,
        user: parsed.user as AuthUser,
        tenant: parsed.tenant as AuthTenant,
      };
    }
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return null;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    hydrated: false,
    token: null,
    user: null,
    tenant: null,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.user),
  },

  actions: {
    hydrate() {
      if (this.hydrated) return;
      this.hydrated = true;

      const persisted = readPersistedState();
      if (!persisted) return;

      this.token = persisted.token;
      this.user = persisted.user;
      this.tenant = persisted.tenant;
    },

    persist() {
      if (!this.token || !this.user || !this.tenant) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return;
      }

      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          token: this.token,
          user: this.user,
          tenant: this.tenant,
        }),
      );
    },

    setSession(payload: AuthSessionResponse) {
      this.token = payload.token;
      this.user = payload.user;
      this.tenant = payload.tenant;
      this.persist();
    },

    clearSession() {
      this.token = null;
      this.user = null;
      this.tenant = null;
      this.persist();
    },

    async signUp(tenantName: string, email: string, password: string) {
      const cleanTenantName = tenantName.trim();
      const cleanEmail = email.trim();

      if (!cleanTenantName || !cleanEmail || !password.trim()) {
        throw new Error("Workspace name, email, and password are required.");
      }

      const response = await apiRequest<AuthSessionResponse>(
        "/api/auth/register",
        {
          method: "POST",
          body: {
            tenantName: cleanTenantName,
            email: cleanEmail,
            password,
          },
        },
      );
      this.setSession(response);
    },

    async signIn(email: string, password: string) {
      const cleanEmail = email.trim();
      if (!cleanEmail || !password.trim()) {
        throw new Error("Email and password are required.");
      }

      const response = await apiRequest<AuthSessionResponse>(
        "/api/auth/login",
        {
          method: "POST",
          body: {
            email: cleanEmail,
            password,
          },
        },
      );
      this.setSession(response);
    },

    signOut() {
      this.clearSession();
    },
  },
});
