"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, DollarSign, Scissors, TrendingUp, Users, Plus, BarChart3, ChevronRight, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { NewAppointmentModal } from "@/components/new-appointment-modal"
import type { Appointment, CreateAppointmentInput } from "@/(features)/appointment/types"
import {
  create,
  getNextAppointments,
  getSummaryByBarber,
  getSummaryByDate,
  getSummaryByRange,
} from "@/(features)/appointment/services/appointment-service"
import { toast } from "sonner"
import { subDays } from "date-fns"
import { getStoredUser } from "@/(features)/auth/services/auth-service"

const mockData = {
  ownerEarnings: 7500.0,
  employeeEarnings: 5000.0,
  recentAppointments: [
    { id: 1, clientName: "João Silva", service: "Corte + Barba", price: 45.0, barber: "Otavio", time: "14:30" },
    { id: 2, clientName: "Pedro Santos", service: "Corte Simples", price: 25.0, barber: "Funcionário", time: "15:00" },
    { id: 3, clientName: "Carlos Lima", service: "Barba", price: 20.0, barber: "Otavio", time: "15:30" },
  ],
}

export default function BarberHome() {
  const router = useRouter()
  const [todayEarnings, setTodayEarnings] = useState(0)
  const [yesterdayEarnings, setYesterdayEarnings] = useState(0)
  const [todayAppointments, setTodayAppointments] = useState(0)
  const [monthlyEarnings, setMonthlyEarnings] = useState(0)
  const [monthlyAppointments, setMonthlyAppointments] = useState(0)
  const [barberSummaries, setBarberSummaries] = useState<{ barberId: string; barberName: string; total: number }[]>([])
  const [nextAppointments, setNextAppointments] = useState<Appointment[]>([])

  const loadSummaries = async () => {
    const today = new Date()
    const yesterday = subDays(today, 1)
    const year = today.getFullYear()
    const month = today.getMonth() + 1
    const start = `${year}-${String(month).padStart(2, "0")}-01`
    const end = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`

    const format = (d: Date) => d.toISOString().split("T")[0]

    try {
      const [todaySummary, yesterdaySummary, monthSummary, barberSummary, upcoming] = await Promise.all([
        getSummaryByDate(format(today)),
        getSummaryByDate(format(yesterday)),
        getSummaryByRange(start, end),
        getSummaryByBarber(start, end),
        getNextAppointments(),
      ])

      setTodayEarnings(todaySummary.totalEarnings)
      setTodayAppointments(todaySummary.totalAppointments)
      setYesterdayEarnings(yesterdaySummary.totalEarnings)
      setMonthlyEarnings(monthSummary.totalEarnings)
      setMonthlyAppointments(monthSummary.totalAppointments)
      setBarberSummaries(barberSummary)
      setNextAppointments(upcoming)
    } catch (err) {
      console.error("Erro ao buscar resumo:", err)
      toast.error("Erro ao buscar resumo financeiro")
    }
  }

  useEffect(() => {
    loadSummaries()
  }, [])

  const variation = yesterdayEarnings > 0 ? ((todayEarnings - yesterdayEarnings) / yesterdayEarnings) * 100 : 0

  const handleCreateAppointment = async (data: CreateAppointmentInput) => {
    try {
      const newApt = await create(data)
      toast.success(`Agendamento de ${newApt.clientName} criado!`)
      await loadSummaries()
    } catch (err) {
      console.error(err)
      toast.error("Falha ao criar agendamento")
    }
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user")
      sessionStorage.removeItem("user")
    }

    toast.success("Logout realizado com sucesso!")

    router.push("/auth/login")
  }

  const loggedUser = typeof window !== "undefined" ? getStoredUser() : null

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-[#222121] z-10">
        <div className="px-4 lg:px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#e9e6e6]">Dashboard</h1>
              <p className="text-sm text-gray-400">Otavio's Barbearia - Controle Financeiro</p>
            </div>

            <div className="flex items-center gap-3">
              <NewAppointmentModal onAppointmentCreated={handleCreateAppointment}>
                <Button className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-3 py-2 text-sm lg:px-4 lg:py-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Agendamento
                </Button>
              </NewAppointmentModal>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 px-3 py-2 text-sm lg:px-4 lg:py-2 bg-transparent"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#131212] border-[#222121]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-[#e9e6e6]">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                Faturamento Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#e9e6e6]">R$ {(todayEarnings ?? 0).toFixed(2)}</div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className={`w-4 h-4 ${variation >= 0 ? "text-emerald-500" : "text-red-500"}`} />
                {variation >= 0 ? "+" : ""}
                {variation.toFixed(1)}% em relação a ontem
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#131212] border-[#222121]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm font-medium text-gray-400">Cortes Hoje</span>
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-[#e9e6e6] mb-1">{todayAppointments}</div>
              <p className="text-sm text-gray-400">Hoje</p>
            </CardContent>
          </Card>

          <Card className="bg-[#131212] border-[#222121]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm font-medium text-gray-400">Faturamento Mensal</span>
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-[#e9e6e6] mb-1">
                R$ {(monthlyEarnings ?? 0).toFixed(2)}
              </div>
              <p className="text-sm text-emerald-500">Meta: R$ 15.000</p>
            </CardContent>
          </Card>

          <Card className="bg-[#131212] border-[#222121]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm font-medium text-gray-400">Total de Cortes</span>
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-[#e9e6e6] mb-1">{monthlyAppointments}</div>
              <p className="text-sm text-gray-400">Este mês</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-[#131212] border-[#222121] lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-[#e9e6e6] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                Faturamento por Barbeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {barberSummaries.map((barber) => {
                  const isAdmin = barber.barberId === loggedUser?.id
                  return (
                    <div
                      key={barber.barberId}
                      className="flex items-center justify-between p-4 bg-[#1e1e1e] rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-[#e9e6e6]">
                          {barber.barberName} {isAdmin && "(Você)"}
                        </p>
                        <p className="text-sm text-gray-400">{isAdmin ? "Administrador" : "Colaborador"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-500 text-lg">R$ {barber.total.toFixed(2)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#131212] border-[#222121]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-[#e9e6e6]">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                <NewAppointmentModal onAppointmentCreated={handleCreateAppointment}>
                  <Button className="bg-[#1e1e1e] border border-[#333] text-gray-300 hover:bg-[#2a2a2a] h-12 lg:h-16 flex items-center justify-start lg:justify-center lg:flex-col gap-2 text-sm w-full">
                    <Plus className="w-5 h-5" />
                    <span className="lg:text-center">Novo Agendamento</span>
                  </Button>
                </NewAppointmentModal>
                <Button className="bg-[#1e1e1e] border border-[#333] text-gray-300 hover:bg-[#2a2a2a] h-12 lg:h-16 flex items-center justify-start lg:justify-center lg:flex-col gap-2 text-sm">
                  <BarChart3 className="w-5 h-5" />
                  <span className="lg:text-center">Relatórios</span>
                </Button>
                <Link href="/appointment/calendar">
                  <Button className="bg-[#1e1e1e] border border-[#333] text-gray-300 hover:bg-[#2a2a2a] h-12 lg:h-16 flex items-center justify-start lg:justify-center lg:flex-col gap-2 text-sm w-full">
                    <Calendar className="w-5 h-5" />
                    <span className="lg:text-center">Agenda</span>
                  </Button>
                </Link>
                <Button className="bg-[#1e1e1e] border border-[#333] text-gray-300 hover:bg-[#2a2a2a] h-12 lg:h-16 flex items-center justify-start lg:justify-center lg:flex-col gap-2 text-sm">
                  <Users className="w-5 h-5" />
                  <span className="lg:text-center">Clientes</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#131212] border-[#222121] mt-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-[#e9e6e6] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" />
                Próximos Agendamentos
              </CardTitle>
              <Link href="/agenda">
                <Button variant="ghost" size="sm" className="text-emerald-500 p-1">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nextAppointments.map((appointment) => (
                <div key={appointment.id} className="p-4 bg-[#1e1e1e] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-[#e9e6e6]">{appointment.clientName}</p>
                    <p className="font-bold text-emerald-500">
                      R$ {appointment.services.reduce((sum, s) => sum + s.price, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">{appointment.services.map((s) => s.name).join(" + ")}</p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          appointment.barberName === "Otavio"
                            ? "border-emerald-500 text-emerald-500 text-xs"
                            : "border-blue-500 text-blue-500 text-xs"
                        }
                      >
                        {appointment.barberName}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(appointment.date).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="h-4"></div>
      </div>
    </div>
  )
}