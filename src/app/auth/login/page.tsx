"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { login } from "@/(features)/auth/services/auth-service"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); 

  if (!email || !password) {
    toast.error("Preencha todos os campos")
    return
  }

  try {
    setLoading(true)
    await login(email, password)
    toast.success("Login realizado com sucesso!")
    
    router.refresh()
    router.replace("/barber/home")
    
  } catch (err: any) {
    toast.error(err?.response?.data?.message || "Erro ao logar")
  } finally {
    setLoading(false)
  }
}
  return (
    <main className="flex items-center justify-center min-h-[100dvh] p-4 bg-black">
      <Card className="w-full max-w-sm bg-[#131212] border-[#222121]">
        <CardHeader>
          <CardTitle className="text-center text-[#e9e6e6] text-3xl font-bold">Logar-se</CardTitle>
          <CardDescription className="text-gray-400">Otavio's barbearia, entra feio e sai bonito.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <Input
              placeholder="Insira seu email"
              type="email"
              name="email"
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#1e1e1e] text-white border border-[#333] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition duration-150"
            />
            <Input
              placeholder="Insira sua senha"
              type="password"
              name="password"
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#1e1e1e] text-white border border-[#333] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition duration-150"
            />
          </CardContent>
          <CardFooter className="mt-8">
            <Button
              type="submit"
              disabled={loading}
              className="w-full text-white"
              style={{
                backgroundImage: `linear-gradient(to right, var(--gradient-green-from), var(--gradient-green-via), var(--gradient-green-to))`
              }}
            >
              {loading ? "Logando..." : "Logar"}
            </Button>
          </CardFooter>
        </form>

        <div className="text-center mt-4 text-gray-400">
          Não tem conta?{" "}
          <Link href="/" className="text-emerald-400 hover:underline">
            Cadastrar
          </Link>
        </div>
      </Card>
    </main>
  )
}
