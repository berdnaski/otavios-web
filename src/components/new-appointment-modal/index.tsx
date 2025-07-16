"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarIcon, Plus, User, Scissors, DollarSign, Clock, Trash2 } from "lucide-react"
import { format, isToday, setHours, setMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { findAllUsers, type User as BarberUser } from "@/(features)/barber/services/users-service"
import { getAllByBarberId } from "@/(features)/appointment/services/appointment-service"
import { getStoredUser } from "@/(features)/auth/services/auth-service"

export interface Appointment {
  id: string
  clientName: string
  barberId: string
  barberName: string
  date: string
  totalPrice: number
  services: {
    name: string
    price: number
    commissionPercent?: number
  }[]
}

interface ServiceForm {
  name: string
  price: string
  commission: string
}

export type CreateAppointmentInput = Omit<Appointment, "id" | "barberName">

interface NewAppointmentModalProps {
  children: React.ReactNode
  onAppointmentCreated: (input: CreateAppointmentInput) => Promise<void>
}

export function NewAppointmentModal({ children, onAppointmentCreated }: NewAppointmentModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState<Date>()
  const [barbers, setBarbers] = useState<BarberUser[]>([])
  const [formData, setFormData] = useState({
    clientName: "",
    barberId: "",
    time: "",
  })
  const [takenTimes, setTakenTimes] = useState<string[]>([])
  const [services, setServices] = useState<ServiceForm[]>([{ name: "", price: "", commission: "" }])

  const addService = () => {
    setServices([...services, { name: "", price: "", commission: "" }])
  }

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index))
    }
  }

  const updateService = (index: number, field: keyof ServiceForm, value: string) => {
    const newServices = [...services]
    newServices[index][field] = value
    setServices(newServices)
  }

  const loggedUser = typeof window !== "undefined" ? getStoredUser() : null

  const shouldShowCommissionInput = Boolean(
    loggedUser?.role === "ADMIN" && formData.barberId && loggedUser?.id && formData.barberId !== loggedUser.id,
  )

  const timeSlots = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
  ]

  useEffect(() => {
    if (!formData.barberId || !date) {
      setTakenTimes([])
      return
    }
    ;(async () => {
      try {
        const all = await getAllByBarberId(formData.barberId)
        const dayISO = date.toISOString().slice(0, 10)
        const occupied = all.filter((a) => a.date.startsWith(dayISO)).map((a) => a.date.slice(11, 16))
        setTakenTimes(occupied)
      } catch {
        toast.error("Não foi possível checar horários")
      }
    })()
  }, [formData.barberId, date])

  useEffect(() => {
    if (!open) return
    findAllUsers()
      .then((users) => setBarbers(users.filter((u) => u.role === "BARBER" || u.id === loggedUser?.id)))
      .catch(() => toast.error("Erro ao carregar barbeiros"))
  }, [open, loggedUser?.id])

  const resetForm = () => {
    setFormData({
      clientName: "",
      barberId: "",
      time: "",
    })
    setServices([{ name: "", price: "", commission: "" }])
    setDate(undefined)
  }

  const now = new Date()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { clientName, barberId, time } = formData

    if (!clientName || !barberId || !date || !time || services.some((s) => !s.name || !s.price)) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    const [hours, minutes] = time.split(":").map(Number)
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes)

    const dateString = format(localDate, "yyyy-MM-dd'T'HH:mm:ss")

    const parsedServices = services.map((s) => ({
      name: s.name,
      price: Number.parseFloat(s.price),
      commissionPercent: s.commission ? Number.parseFloat(s.commission) / 100 : 0,
    }))

    const totalPrice = parsedServices.reduce((sum, s) => sum + s.price, 0)

    try {
      setLoading(true)
      await onAppointmentCreated({
        clientName,
        barberId,
        date: dateString,
        totalPrice,
        services: parsedServices,
      })
      toast.success("Agendamento criado com sucesso!")
      resetForm()
      setOpen(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erro ao criar agendamento")
    } finally {
      setLoading(false)
    }
  }

  const totalPrice = services.reduce((sum, service) => {
    const price = Number.parseFloat(service.price) || 0
    return sum + price
  }, 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-[#131212] border-[#222121] text-white w-[95vw] max-w-[500px] max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-[#222121] flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl text-[#e9e6e6]">
              <Plus className="w-5 h-5 text-emerald-500" />
              Novo Agendamento
            </DialogTitle>
            <DialogDescription className="text-gray-400">Cadastre um novo atendimento para o cliente</DialogDescription>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cliente */}
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-500" />
                  Nome do Cliente *
                </Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData((f) => ({ ...f, clientName: e.target.value }))}
                  placeholder="Digite o nome do cliente"
                  className="bg-[#1e1e1e] border-[#333] text-white placeholder-gray-500 h-11"
                />
              </div>

              {/* Serviços */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-emerald-500" />
                    Serviços *
                  </Label>
                  <Button
                    type="button"
                    onClick={addService}
                    variant="outline"
                    size="sm"
                    className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 h-8 bg-transparent"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-3">
                  {services.map((service, index) => (
                    <Card key={index} className="bg-[#1e1e1e] border-[#333]">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Serviço {index + 1}</span>
                            {services.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => removeService(index)}
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-gray-400">Nome do serviço</Label>
                              <Input
                                placeholder="Ex: Corte + Barba"
                                value={service.name}
                                onChange={(e) => updateService(index, "name", e.target.value)}
                                className="bg-[#131212] border-[#333] text-white placeholder-gray-500 h-10"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-400">Preço (R$)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={service.price}
                                onChange={(e) => updateService(index, "price", e.target.value)}
                                className="bg-[#131212] border-[#333] text-white placeholder-gray-500 h-10"
                              />
                            </div>
                          </div>

                          {shouldShowCommissionInput && (
                            <div>
                              <Label className="text-xs text-gray-400">Comissão (%)</Label>
                              <Input
                                type="number"
                                step="1"
                                max="100"
                                placeholder="Ex: 50"
                                value={service.commission}
                                onChange={(e) => updateService(index, "commission", e.target.value)}
                                className="bg-[#131212] border-[#333] text-white placeholder-gray-500 h-10"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Total */}
                {totalPrice > 0 && (
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <span className="text-sm text-gray-300 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      Total
                    </span>
                    <span className="text-lg font-bold text-emerald-400">R$ {totalPrice.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Barbeiro */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-500" />
                  Barbeiro *
                </Label>
                <Select
                  value={formData.barberId}
                  onValueChange={(val) => setFormData((f) => ({ ...f, barberId: val }))}
                >
                  <SelectTrigger className="bg-[#1e1e1e] border-[#333] text-white h-11">
                    <SelectValue placeholder="Selecione o barbeiro" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e1e] border-[#333] text-white">
                    {barbers.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data e Horário */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-emerald-500" />
                    Data *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left bg-[#1e1e1e] border-[#333] text-white h-11"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#1e1e1e] border-[#333]" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        className="text-white"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    Horário *
                  </Label>
                  <Select
                    value={formData.time}
                    onValueChange={(val) => {
                      if (takenTimes.includes(val)) {
                        toast.error("Horário ocupado")
                        return
                      }
                      setFormData((f) => ({ ...f, time: val }))
                    }}
                  >
                    <SelectTrigger className="bg-[#1e1e1e] border-[#333] text-white h-11">
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1e1e] border-[#333] text-white">
                      {timeSlots.map((slot) => {
                        const [hh, mm] = slot.split(":").map(Number)
                        const slotDate = date
                          ? setMinutes(setHours(date, hh), mm)
                          : setMinutes(setHours(new Date(), hh), mm)
                        const isPast = isToday(slotDate) && slotDate < now
                        const ocupado = takenTimes.includes(slot)
                        return (
                          <SelectItem
                            key={slot}
                            value={slot}
                            disabled={isPast || ocupado}
                            className={ocupado ? "opacity-50" : isPast ? "opacity-30" : ""}
                          >
                            {slot}
                            {ocupado && " (ocupado)"}
                            {isPast && " (já passou)"}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#222121] flex-shrink-0">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1 border-[#333] text-gray-300 hover:bg-[#1e1e1e] h-11"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white h-11"
              >
                {loading ? "Salvando..." : "Criar Agendamento"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
