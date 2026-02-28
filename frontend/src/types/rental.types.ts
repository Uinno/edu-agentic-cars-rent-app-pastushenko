import type { Car } from "./car.types";
import type { User } from "./user.types";

export type RentalStatus = "pending" | "active" | "completed" | "cancelled";

export interface Rental {
  id: string;
  car: Car;
  user?: User;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;
  status: RentalStatus;
  createdAt: string;
}

export interface CreateRentalDto {
  carId: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;
}
