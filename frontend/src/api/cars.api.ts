import { apiClient } from "./client";
import type {
  Car,
  CarWithDistance,
  CreateCarDto,
  UpdateCarDto,
} from "@/types/car.types";

export const carsApi = {
  getCars(): Promise<Car[]> {
    console.debug("[API:cars] getCars");
    return apiClient
      .get<Car[]>("/cars")
      .then((r) => r.data)
      .catch((err: unknown) => {
        console.error("[API:cars] getCars failed:", (err as Error).message);
        throw err;
      });
  },

  getAvailableCars(): Promise<Car[]> {
    console.debug("[API:cars] getAvailableCars");
    return apiClient
      .get<Car[]>("/cars/available")
      .then((r) => r.data)
      .catch((err: unknown) => {
        console.error(
          "[API:cars] getAvailableCars failed:",
          (err as Error).message,
        );
        throw err;
      });
  },

  getNearbyCars(
    latitude: number,
    longitude: number,
    radius: 5 | 10 | 15,
  ): Promise<CarWithDistance[]> {
    console.debug("[API:cars] getNearbyCars", { latitude, longitude, radius });
    return apiClient
      .get<CarWithDistance[]>("/cars/nearby", {
        params: { latitude, longitude, radius },
      })
      .then((r) => r.data)
      .catch((err: unknown) => {
        console.error(
          "[API:cars] getNearbyCars failed:",
          (err as Error).message,
        );
        throw err;
      });
  },

  getCar(id: string): Promise<Car> {
    console.debug("[API:cars] getCar", id);
    return apiClient
      .get<Car>(`/cars/${id}`)
      .then((r) => r.data)
      .catch((err: unknown) => {
        console.error("[API:cars] getCar failed:", (err as Error).message);
        throw err;
      });
  },

  createCar(data: CreateCarDto): Promise<Car> {
    console.debug("[API:cars] createCar", {
      brand: data.brand,
      model: data.model,
    });
    return apiClient
      .post<Car>("/cars", data)
      .then((r) => r.data)
      .catch((err: unknown) => {
        console.error("[API:cars] createCar failed:", (err as Error).message);
        throw err;
      });
  },

  updateCar(id: string, data: UpdateCarDto): Promise<Car> {
    console.debug("[API:cars] updateCar", id);
    return apiClient
      .patch<Car>(`/cars/${id}`, data)
      .then((r) => r.data)
      .catch((err: unknown) => {
        console.error("[API:cars] updateCar failed:", (err as Error).message);
        throw err;
      });
  },

  deleteCar(id: string): Promise<void> {
    console.debug("[API:cars] deleteCar", id);
    return apiClient
      .delete(`/cars/${id}`)
      .then(() => undefined)
      .catch((err: unknown) => {
        console.error("[API:cars] deleteCar failed:", (err as Error).message);
        throw err;
      });
  },
};
