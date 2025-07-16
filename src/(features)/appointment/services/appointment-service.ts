import { api } from "@/lib/api";
import { Appointment, CreateAppointmentInput } from "../types";

export interface BarberSummary {
  barberId: string;
  barberName: string;
  total: number;
}

export async function getAll(): Promise<Appointment[]> {
  const response = await api.get("/appointments");
  console.log('response', response.data);
  return response.data;
}

export async function create(data: CreateAppointmentInput): Promise<Appointment> {
  const response = await api.post<Appointment>("/appointments", data);
  return response.data;
}

export async function getAllByBarberId(barberId: string) {
  const resp = await api.get<Appointment[]>("/appointments/" + barberId);
  return resp.data;
}

export async function getSummaryByDate(date: string): Promise<{
  totalEarnings: number;
  totalAppointments: number;
  adminReceives: number;
  barberReceives: number;
}> {
  const response = await api.get(`/appointments/summary?date=${date}`);
  return response.data;
}


export async function getSummaryByRange(start: string, end: string): Promise<{ totalEarnings: number, totalAppointments: number }> {
  const response = await api.get(`/appointments/summary-range?start=${start}&end=${end}`);
  return response.data;
}

export async function getSummaryByBarber(start: string, end: string): Promise<BarberSummary[]> {
  const response = await api.get(`/appointments/summary-by-barber?start=${start}&end=${end}`);
  return response.data;
}

export async function getNextAppointments(limit: number = 3): Promise<Appointment[]> {
  const response = await api.get(`/appointments/next?limit=${limit}`);
  return response.data;
}