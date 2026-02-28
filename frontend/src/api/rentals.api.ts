import { apiClient } from "./client";
import type { CreateRentalDto, Rental } from "@/types/rental.types";

export const rentalsApi = {
  getMyRentals(): Promise<Rental[]> {
    console.debug("[API:rentals] getMyRentals");
    return apiClient
      .get<Rental[]>("/rentals/my")
      .then((r) => r.data)
      .catch((err: unknown) => {
        console.error(
          "[API:rentals] getMyRentals failed:",
          (err as Error).message,
        );
        throw err;
      });
  },

  createRental(data: CreateRentalDto): Promise<Rental> {
    console.debug("[API:rentals] createRental", {
      carId: data.carId,
      startDate: data.startDate,
      endDate: data.endDate,
    });
    return apiClient
      .post<Rental>("/rentals", data)
      .then((r) => r.data)
      .catch((err: unknown) => {
        console.error(
          "[API:rentals] createRental failed:",
          (err as Error).message,
        );
        throw err;
      });
  },

  getAllRentals(): Promise<Rental[]> {
    console.debug("[API:rentals] getAllRentals");
    return apiClient
      .get<Rental[]>("/rentals")
      .then((r) => r.data)
      .catch((err: unknown) => {
        console.error(
          "[API:rentals] getAllRentals failed:",
          (err as Error).message,
        );
        throw err;
      });
  },

  getActiveRentals(): Promise<Rental[]> {
    console.debug("[API:rentals] getActiveRentals");
    return apiClient
      .get<Rental[]>("/rentals/active")
      .then((r) => r.data)
      .catch((err: unknown) => {
        console.error(
          "[API:rentals] getActiveRentals failed:",
          (err as Error).message,
        );
        throw err;
      });
  },

  completeRental(id: string): Promise<Rental> {
    console.debug("[API:rentals] completeRental", id);
    return apiClient
      .patch<Rental>(`/rentals/${id}/complete`)
      .then((r) => r.data)
      .catch((err: unknown) => {
        console.error(
          "[API:rentals] completeRental failed:",
          (err as Error).message,
        );
        throw err;
      });
  },

  cancelRental(id: string): Promise<Rental> {
    console.debug("[API:rentals] cancelRental", id);
    return apiClient
      .patch<Rental>(`/rentals/${id}/cancel`)
      .then((r) => r.data)
      .catch((err: unknown) => {
        console.error(
          "[API:rentals] cancelRental failed:",
          (err as Error).message,
        );
        throw err;
      });
  },
};
