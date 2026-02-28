export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  pricePerDay: number;
  isAvailable: boolean;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface CarWithDistance extends Car {
  /** Raw distance in metres from the searched location */
  distance_meters: number;
}

export interface CreateCarDto {
  brand: string;
  model: string;
  year: number;
  pricePerDay: number;
  isAvailable?: boolean;
  latitude?: number;
  longitude?: number;
}

export type UpdateCarDto = Partial<CreateCarDto>;
