"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { register } from "@/(features)/auth/services/auth-service"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function Register() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    if (!name || !email || !password) {
      toast.error("Preencha todos os campos")
      return
    }

    try {
      setLoading(true)
      await register(name, email, password)
      toast.success("Cadastro realizado com sucesso!")
      router.push("/auth/login")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao cadastrar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex items-center justify-center min-h-[100dvh] p-4 bg-black">
      <Card className="w-full max-w-sm bg-[#131212] border-[#222121]">
        <CardHeader>
          <CardTitle className="text-center text-[#e9e6e6] text-3xl font-bold">
            Cadastre-se
          </CardTitle>
          <CardDescription className="text-gray-400">
            Otavio's barbearia, entra feio e sai bonito.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <Input
              placeholder="Insira seu nome"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#1e1e1e] text-white"
            />
            <Input
              placeholder="Insira seu email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#1e1e1e] text-white"
            />
            <Input
              placeholder="Insira sua senha"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#1e1e1e] text-white"
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
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </CardFooter>
        </form>
        <div className="text-center mt-4 text-gray-400">
          Já possui conta?{" "}
          <Link href="/auth/login" className="text-emerald-400 hover:underline">
            Logar
          </Link>
        </div>
      </Card>
    </main>
  )
}
