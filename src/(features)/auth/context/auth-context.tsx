"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getStoredUser, login, logout, register } from "../services/auth-service";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();

    if (storedUser) {
      setUser(storedUser);
    } else {
      setUser(null);
    }

    setLoading(false);
  }, []);

  async function signIn(email: string, password: string) {
    const user = await login(email, password);
    setUser(user);
  }

  async function signUp(name: string, email: string, password: string) {
    const user = await register(name, email, password);
    setUser(user);
  }

  function signOut() {
    logout();
    setUser(null);
    router.push("/auth/login");
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
