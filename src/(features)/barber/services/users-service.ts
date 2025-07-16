import { api } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function findAllUsers(): Promise<User[]> {
  const response = await api.get("/users/");
  return response.data;
}
