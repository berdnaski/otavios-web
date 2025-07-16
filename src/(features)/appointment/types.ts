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

export type CreateAppointmentInput = Omit<Appointment, "id" | "barberName">;