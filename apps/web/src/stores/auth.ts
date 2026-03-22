import { defineStore } from "pinia";

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  hydrated: boolean;
  user: AuthUser | null;
}

const AUTH_STORAGE_KEY = "telegraph-auth-v1";

function createUserId(): string {
  return `usr-${Math.random().toString(36).slice(2, 10)}`;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    hydrated: false,
    user: null,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.user),
  },

  actions: {
    hydrate() {
      if (this.hydrated) return;
      this.hydrated = true;

      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw) as AuthUser;
        if (parsed?.id && parsed?.email && parsed?.name) {
          this.user = parsed;
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    },

    persist() {
      if (!this.user) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return;
      }

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.user));
    },

    signIn(email: string, password: string) {
      const cleanEmail = email.trim();
      if (!cleanEmail || !password.trim()) {
        throw new Error("Email and password are required.");
      }

      const existingName = cleanEmail.split("@")[0] ?? "User";
      this.user = {
        id: createUserId(),
        name: existingName.replace(/[._-]+/g, " "),
        email: cleanEmail,
      };
      this.persist();
    },

    signUp(name: string, email: string, password: string) {
      const cleanName = name.trim();
      const cleanEmail = email.trim();

      if (!cleanName || !cleanEmail || !password.trim()) {
        throw new Error("Name, email, and password are required.");
      }

      this.user = {
        id: createUserId(),
        name: cleanName,
        email: cleanEmail,
      };
      this.persist();
    },

    signOut() {
      this.user = null;
      this.persist();
    },
  },
});
