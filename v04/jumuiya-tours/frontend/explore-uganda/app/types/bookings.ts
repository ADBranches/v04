export interface BookingResponse {
  bookings: Booking[];
  pagination?: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}