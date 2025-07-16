import React, { useEffect, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  CalendarIcon,
  Plus,
  User,
  Scissors,
  DollarSign,
  Clock,
} from "lucide-react"
import { format, isToday, setHours, setMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import {
  findAllUsers,
  User as BarberUser,
} from "@/(features)/barber/services/users-service"
import { getAllByBarberId } from "@/(features)/appointment/services/appointment-service"
import { getStoredUser } from "@/(features)/auth/services/auth-service"

export interface Appointment {
  id: string;
  clientName: string;
  barberId: string;
  barberName: string;
  date: string;
  totalPrice: number;
  services: {
    name: string;
    price: number;
    commissionPercent?: number;
  }[];
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

export function NewAppointmentModal({
  children,
  onAppointmentCreated,
}: NewAppointmentModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState<Date>()
  const [barbers, setBarbers] = useState<BarberUser[]>([])
  const [formData, setFormData] = useState({
    clientName: "",
    service: "",
    price: "",
    barberId: "",
    time: "",
    commission: "",
  })
  const [takenTimes, setTakenTimes] = useState<string[]>([])
  const [services, setServices] = useState<ServiceForm[]>([
  { name: '', price: '', commission: '' }
]);

const addService = () => {
  setServices([...services, { name: '', price: '', commission: '' }]);
};

const removeService = (index: number) => {
  setServices(services.filter((_, i) => i !== index));
};

const updateService = (index: number, field: keyof ServiceForm, value: string) => {
  const newServices = [...services];
  newServices[index][field] = value;
  setServices(newServices);
};

  const loggedUser = typeof window !== "undefined" ? getStoredUser() : null
const shouldShowCommissionInput = Boolean(
  loggedUser?.role === "ADMIN" &&
  formData.barberId &&
  loggedUser?.id &&
  formData.barberId !== loggedUser.id
)

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30",
    "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00",
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
        const occupied = all
          .filter(a => a.date.startsWith(dayISO))
          .map(a => a.date.slice(11, 16))
        setTakenTimes(occupied)
      } catch {
        toast.error("Não foi possível checar horários")
      }
    })()
  }, [formData.barberId, date])

  useEffect(() => {
    if (!open) return
    findAllUsers()
      .then(users => setBarbers(
  users.filter(
    u => u.role === "BARBER" || u.id === loggedUser?.id
  )
))
      .catch(() => toast.error("Erro ao carregar barbeiros"))
  }, [open])

  const resetForm = () => {
    setFormData({
      clientName: "",
      service: "",
      price: "",
      barberId: "",
      time: "",
      commission: "",
    })
    setServices([{ name: '', price: '', commission: '' }])
    setDate(undefined)
  }

  const now = new Date()

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  const { clientName, barberId, time } = formData

  if (!clientName || !barberId || !date || !time || services.some(s => !s.name || !s.price)) {
    toast.error("Preencha todos os campos obrigatórios")
    return
  }

  const [hours, minutes] = time.split(":").map(Number)
  const localDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes
  )

  const dateString = format(localDate, "yyyy-MM-dd'T'HH:mm:ss")

const parsedServices = services.map(s => ({
  name: s.name,
  price: parseFloat(s.price),
  commissionPercent: s.commission ? parseFloat(s.commission) / 100 : 0, 
}));

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-[#131212] border-[#222121] text-white w-[95vw] max-w-[400px] max-h-[85vh] overflow-y-auto rounded-lg left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg text-[#e9e6e6]">
            <Plus className="w-4 h-4 text-emerald-500" /> Novo Agendamento
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            Cadastre um novo atendimento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          <div>
            <Label htmlFor="clientName" className="text-sm text-gray-300 flex items-center gap-1">
              <User className="w-3 h-3 text-emerald-500" /> Nome do Cliente *
            </Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={e => setFormData(f => ({ ...f, clientName: e.target.value }))}
              placeholder="Digite o nome"
              className="bg-[#1e1e1e] border-[#333] text-white"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm text-gray-300 flex items-center gap-1">
              <Scissors className="w-3 h-3 text-emerald-500" /> Serviços *
            </Label>
            {services.map((service, index) => (
              <div key={index} className="flex flex-col gap-2 border p-3 rounded-md bg-[#1e1e1e]">
                <div className="flex gap-2">
                  <Input
                    placeholder="Serviço"
                    value={service.name}
                    onChange={e => updateService(index, "name", e.target.value)}
                    className="flex-1 bg-[#1e1e1e] border-[#333] text-white"
                  />
                  <Input
                    type="number"
                    placeholder="Preço"
                    value={service.price}
                    onChange={e => updateService(index, "price", e.target.value)}
                    className="w-24 bg-[#1e1e1e] border-[#333] text-white"
                  />
                  {shouldShowCommissionInput && (
                    <Input
                      type="number"
                      placeholder="%"
                      value={service.commission}
                      onChange={e => updateService(index, "commission", e.target.value)}
                      className="w-20 bg-[#1e1e1e] border-[#333] text-white"
                    />
                  )}
                </div>
                {services.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeService(index)}
                    variant="ghost"
                    className="text-sm text-red-500 self-end"
                  >
                    Remover
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" onClick={addService} variant="outline" className="w-full">
              Adicionar serviço
            </Button>
          </div>

          {/* Barbeiro */}
          <div>
            <Label className="flex items-center gap-1 text-sm text-gray-300">
              <User className="w-3 h-3 text-emerald-500" />
              Barbeiro *
            </Label>
            <Select
              value={formData.barberId}
              onValueChange={val => setFormData(f => ({ ...f, barberId: val }))}
            >
              <SelectTrigger className="bg-[#1e1e1e] border-[#333] text-white">
                <SelectValue placeholder="Selecione o barbeiro" />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1e1e] border-[#333] text-white">
                {barbers.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

           <div>
            <Label className="flex items-center gap-1">
              <CalendarIcon /> Data *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full text-left">
                  {date ? format(date, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={d => d < new Date(new Date().setHours(0,0,0,0))}
                  className="text-white"
                />
              </PopoverContent>
            </Popover>
          </div>

           <div>
            <Label className="flex items-center gap-1">
              <Clock /> Horário *
            </Label>
            <Select
              value={formData.time}
              onValueChange={val => {
                if (takenTimes.includes(val)) {
                  toast.error("Horário ocupado")
                  return
                }
                setFormData(f => ({ ...f, time: val }))
              }}
            >
              <SelectTrigger className="w-full text-left">
                <SelectValue placeholder="Selecione o horário" />
              </SelectTrigger>
              <SelectContent>
                
                {timeSlots.map(slot => {
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

                  {shouldShowCommissionInput && (
            <div>
              <Label className="flex items-center gap-1 text-sm text-gray-300">
                Comissão do barbeiro (%)
              </Label>
              <Input
                type="number"
                step="1"
                max="100"
                placeholder="Ex: 50"
                value={formData.commission}
                onChange={e =>
                  setFormData(f => ({ ...f, commission: e.target.value }))
                }
                className="bg-[#1e1e1e] border-[#333] placeholder-gray-400 text-white"
              />
            </div>
          )}

          <div className="flex gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-[#333] text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white"
            >
              {loading ? "Salvando..." : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
