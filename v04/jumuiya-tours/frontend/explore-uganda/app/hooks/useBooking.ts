import { create } from "zustand";
import type { Booking } from "../types/bookings";

interface BookingState {
  booking: Booking | null;
  isOpen: boolean;
  openBooking: (data?: Partial<Booking>) => void;
  closeBooking: () => void;
  updateBooking: (data: Partial<Booking>) => void;
  resetBooking: () => void;
}

export const useBooking = create<BookingState>((set) => ({
  booking: null,
  isOpen: false,

  openBooking: (data) =>
    set((state) => ({
      booking: { ...(state.booking ?? {}), ...data } as Booking,
      isOpen: true,
    })),

  closeBooking: () => set({ isOpen: false }),

  updateBooking: (data) =>
    set((state) => ({
      booking: { ...(state.booking ?? {}), ...data } as Booking,
    })),

  resetBooking: () => set({ booking: null }),
}));