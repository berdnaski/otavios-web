import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post("/auth/login", { email, password });

  localStorage.setItem("token", data.token); 
  localStorage.setItem("user", JSON.stringify(data.user));

  return data.user;
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const { data } = await api.post("/auth/register", { name, email, password });
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data.user;
}

export function logout() {
  localStorage.removeItem("token"); 
  localStorage.removeItem("user");
}


export function getStoredUser(): User | null {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}
