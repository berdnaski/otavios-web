"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Clock,
  User,
  DollarSign,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  Grid3X3,
  List,
  GripVertical,
  Loader2,
} from "lucide-react"
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"
import { NewAppointmentModal } from "@/components/new-appointment-modal"
import { create, getAll } from "@/(features)/appointment/services/appointment-service"
import { Appointment, CreateAppointmentInput } from "@/(features)/appointment/types"
import { findAllUsers } from "@/(features)/barber/services/users-service"

interface User {
  id: string
  name: string
  email: string
  role: string
}

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

function DraggableAppointment({ appointment, isDragging = false }: { appointment: Appointment; isDragging?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: dragging,
  } = useDraggable({
    id: appointment.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: dragging ? 0.3 : 1,
    zIndex: dragging ? 1000 : 1,
  }

  const getBarberColor = (barberId: string) => {
    const colors = [
      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "bg-purple-500/20 text-purple-400 border-purple-500/30",
      "bg-orange-500/20 text-orange-400 border-orange-500/30",
    ]
    
    const index = barberId.length % colors.length
    return colors[index]
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative bg-[#1a1a1a] border border-[#333] rounded-lg p-3 mb-2 
        cursor-grab active:cursor-grabbing 
        hover:bg-[#222] hover:border-[#444] 
        transition-all duration-200 ease-out
        group select-none
        ${dragging ? "shadow-2xl ring-2 ring-emerald-500/50 scale-105" : ""}
        ${isDragging ? "rotate-2" : ""}
      `}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripVertical className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          <span className="text-sm font-semibold text-[#e9e6e6] truncate">{appointment.clientName}</span>
        </div>
        <span className="text-sm font-bold text-emerald-400 flex-shrink-0 ml-2">
  R$ {appointment.services?.reduce((sum, s) => sum + s.price, 0).toFixed(2)}
</span>
      </div>

      <div className="mb-3">
       <p className="text-gray-400 text-sm">
  {appointment.services?.map(s => s.name).join(", ")}
</p>
      </div>

      <div className="flex items-center justify-start gap-2 mb-2">
        <Badge variant="outline" className={getBarberColor(appointment.barberId)}>
          {appointment.barberName}
        </Badge>
      </div>

      {!isDragging && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1a1a1a]/90 rounded p-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/20"
          >
            <Eye className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/20"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

function DroppableTimeSlot({
  dayIndex,
  time,
  appointments,
  children,
}: {
  dayIndex: number
  time: string
  appointments: Appointment[]
  children: React.ReactNode
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `${dayIndex}-${time}`,
  })

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[80px] border border-[#222121] p-1 
        transition-all duration-200 ease-out
        ${isOver ? "bg-emerald-500/10 border-emerald-500/50 shadow-lg" : "hover:bg-[#1a1a1a]/50"}
        ${appointments.length > 0 ? "bg-[#1a1a1a]/70" : ""}
        relative overflow-y-auto
      `}
    >
      <div className="flex flex-col gap-1">
        {children}
      </div>
      
      {appointments.length === 0 && isOver && (
        <div className="flex items-center justify-center h-full min-h-[60px] border-2 border-dashed border-emerald-500/50 rounded-lg">
          <span className="text-xs text-emerald-400 font-medium">Soltar aqui</span>
        </div>
      )}
    </div>
  )
}

export default function AgendaPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedBarber, setSelectedBarber] = useState("todos")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    loadAppointments()
    loadUsers()
  }, [])

  const isValidAppointment = (apt: Appointment) => {
    return apt.date && !isNaN(new Date(apt.date).getTime())
  }

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const data = await getAll()
      const validAppointments = data.filter(isValidAppointment)
      console.log("Valid appointments loaded:", validAppointments)
      setAppointments(validAppointments)
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error)
      toast.error("Erro ao carregar agendamentos")
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const data = await findAllUsers()
      setUsers(data.filter(user => user.role === "BARBER"))
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      toast.error("Erro ao carregar barbeiros")
    }
  }

  const handleCreateAppointment = async (appointmentData: CreateAppointmentInput) => {
    try {
      const newAppointment = await create(appointmentData)
      setAppointments(prev => [...prev, newAppointment])
      toast.success("Agendamento criado com sucesso!")
    } catch (error) {
      console.error("Erro ao criar agendamento:", error)
      toast.error("Erro ao criar agendamento")
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesBarber = selectedBarber === "todos" || appointment.barberId === selectedBarber
    const matchesSearch =
      appointment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.services?.some(s =>
  s.name.toLowerCase().includes(searchTerm.toLowerCase())
)
    
    return matchesBarber && matchesSearch
  })

  const getAppointmentsForDay = (date: Date) => {
    return filteredAppointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date)
      return isSameDay(appointmentDate, date)
    })
  }

  const getBarberColor = (barberId: string) => {
    const colors = [
      "border-emerald-500 text-emerald-500",
      "border-blue-500 text-blue-500",
      "border-purple-500 text-purple-500",
      "border-orange-500 text-orange-500",
    ]
    
    const index = barberId.length % colors.length
    return colors[index]
  }

  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1))
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1))
  const goToToday = () => setCurrentWeek(new Date())

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return setActiveId(null)

    const [dayIndex, time] = String(over.id).split("-")
    const targetDay = weekDays[Number(dayIndex)]
    const newDate = `${format(targetDay, "yyyy-MM-dd")}T${time}:00`

    setAppointments(prev =>
      prev.map(apt =>
        apt.id === active.id
          ? { ...apt, date: newDate }
          : apt
      )
    )

    const moved = appointments.find(apt => apt.id === active.id)
    if (moved) {
      toast.success(
        `${moved.clientName} reagendado para ${format(targetDay, "EEEE", { locale: ptBR })} às ${time}`
      )
    }

    setActiveId(null)
  }

  const MobileListView = () => (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {weekDays.map((day, index) => {
          const dayAppointments = getAppointmentsForDay(day)
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
          const isToday = isSameDay(day, new Date())

          return (
            <Button
              key={index}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`flex-shrink-0 flex flex-col items-center p-3 h-auto ${
                isSelected
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-[#1e1e1e] border-[#333] text-gray-300 hover:bg-[#2a2a2a]"
              }`}
            >
              <span className="text-xs font-medium">{format(day, "EEE", { locale: ptBR })}</span>
              <span className={`text-lg font-bold mt-1 ${isToday && !isSelected ? "text-emerald-500" : ""}`}>
                {format(day, "dd")}
              </span>
              {dayAppointments.length > 0 && (
                <span className="text-xs bg-emerald-500 text-white rounded-full px-1.5 py-0.5 mt-1">
                  {dayAppointments.length}
                </span>
              )}
            </Button>
          )
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="ml-2 text-gray-400">Carregando agendamentos...</span>
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {(selectedDay ? getAppointmentsForDay(selectedDay) : filteredAppointments)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((appointment) => (
              <Card key={appointment.id} className="bg-[#131212] border-[#222121]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#e9e6e6] text-lg">{appointment.clientName}</h3>
                      <p className="text-gray-400 text-sm">
  {appointment.services?.map(s => s.name).join(", ")}
</p>
                    </div>
                    <div className="text-right">
<p className="font-bold text-emerald-500 text-lg">
  R$ {appointment.services?.reduce((sum, s) => sum + s.price, 0).toFixed(2)}
</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">
                        {format(parseISO(appointment.date), "EEEE, dd/MM", { locale: ptBR })} às{" "}
                        {format(parseISO(appointment.date), "HH:mm")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getBarberColor(appointment.barberId)}>
                        {appointment.barberName}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-emerald-500">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

          {(selectedDay ? getAppointmentsForDay(selectedDay) : filteredAppointments).length === 0 && !loading && (
            <Card className="bg-[#131212] border-[#222121]">
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">
                  {selectedDay
                    ? `Nenhum agendamento para ${format(selectedDay, "dd/MM", { locale: ptBR })}`
                    : "Nenhum agendamento encontrado"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )

  const DesktopGridView = () => (
    <div className="grid grid-cols-8 gap-2">
      <div className="text-center text-sm font-medium text-gray-400 p-2">Horário</div>
      {weekDays.map((day, index) => (
        <div key={index} className="text-center p-2">
          <div className="text-sm font-medium text-gray-400">{format(day, "EEE", { locale: ptBR })}</div>
          <div
            className={`text-lg font-bold mt-1 ${isSameDay(day, new Date()) ? "text-emerald-500" : "text-[#e9e6e6]"}`}
          >
            {format(day, "dd")}
          </div>
        </div>
      ))}
      {timeSlots.map((time) => (
        <div key={time} className="contents">
          <div className="text-right text-sm text-gray-400 p-2 border-r border-[#222121]">{time}</div>
          {weekDays.map((day, dayIndex) => {
            const dayAppointments = getAppointmentsForDay(day)
            const timeAppointments = dayAppointments.filter((apt) => {
              const aptTime = format(new Date(apt.date), "HH:mm")
              return aptTime === time
            })

            return (
              <DroppableTimeSlot
                key={`${dayIndex}-${time}`}
                dayIndex={dayIndex}
                time={time}
                appointments={timeAppointments}
              >
                {timeAppointments.map((appointment) => (
                  <DraggableAppointment key={appointment.id} appointment={appointment} />
                ))}
              </DroppableTimeSlot>
            )
          })}
        </div>
      ))}
    </div>
  )

  const activeAppointment = activeId ? appointments.find((apt) => apt.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-black text-white">
        <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-[#222121] z-10">
          <div className="px-4 lg:px-8 py-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Link href="/barber/home">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl lg:text-3xl font-bold text-[#e9e6e6] flex items-center gap-2">
                    <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-500" />
                    Agenda
                  </h1>
                  <p className="text-xs lg:text-sm text-gray-400">
                    Gerencie todos os agendamentos • Arraste para reagendar
                  </p>
                </div>
              </div>
              <NewAppointmentModal onAppointmentCreated={handleCreateAppointment}>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-xs lg:text-sm px-2 lg:px-4"
                >
                  <Plus className="w-4 h-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">Novo Agendamento</span>
                  <span className="sm:hidden">Novo</span>
                </Button>
              </NewAppointmentModal>
            </div>
            <div className="space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevWeek}
                  className="bg-[#1e1e1e] border-[#333] text-gray-300 hover:bg-[#2a2a2a] p-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="bg-[#1e1e1e] border-[#333] text-gray-300 hover:bg-[#2a2a2a] px-3 text-xs"
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextWeek}
                  className="bg-[#1e1e1e] border-[#333] text-gray-300 hover:bg-[#2a2a2a] p-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-center lg:text-left">
                <span className="text-sm lg:text-lg font-semibold text-[#e9e6e6]">
                  {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} -{" "}
                  {format(addDays(weekStart, 6), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-1 bg-[#1e1e1e] border border-[#333] rounded p-1">
                  <Button
                    size="sm"
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    onClick={() => setViewMode("grid")}
                    className="h-7 px-2"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "list" ? "default" : "ghost"}
                    onClick={() => setViewMode("list")}
                    className="h-7 px-2"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-[#1e1e1e] text-white border border-[#333] pl-10 w-32 lg:w-48 text-sm"
                  />
                </div>

                <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                  <SelectTrigger className="bg-[#1e1e1e] text-white border border-[#333] w-32 lg:w-40 text-sm">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e1e] border-[#333]">
                    <SelectItem value="todos" className="text-white hover:bg-[#2a2a2a]">
                      Todos
                    </SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id} className="text-white hover:bg-[#2a2a2a]">
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
          <div className="lg:hidden">
            <MobileListView />
          </div>

          <div className="hidden lg:block">{viewMode === "grid" ? <DesktopGridView /> : <MobileListView />}</div>
          <Card className="bg-[#131212] border-[#222121] mt-6">
            <CardHeader>
              <CardTitle className="text-[#e9e6e6] flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-emerald-500" />
                Resumo da Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-[#1e1e1e] rounded-lg">
                  <Clock className="w-8 h-8 text-emerald-500" />
                  <div>
                    <p className="text-sm text-gray-400">Total de Agendamentos</p>
                    <p className="text-xl font-bold text-[#e9e6e6]">{filteredAppointments.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#1e1e1e] rounded-lg">
                  <DollarSign className="w-8 h-8 text-emerald-500" />
                  <div>
                    <p className="text-sm text-gray-400">Faturamento Previsto</p>
R$ {filteredAppointments.reduce((sum, apt) => {
  return sum + (apt.services?.reduce((s, srv) => s + srv.price, 0) || 0)
}, 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <DragOverlay>
          {activeAppointment ? <DraggableAppointment appointment={activeAppointment} isDragging /> : null}
        </DragOverlay>
      </div>
    </DndContext>
  )
}