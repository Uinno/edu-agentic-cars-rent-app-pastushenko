import { apiClient } from "./client";
import type { User } from "@/types/user.types";

export const usersApi = {
  getUsers(): Promise<User[]> {
    console.debug("[API:users] getUsers");
    return apiClient
      .get<User[]>("/users")
      .then((r) => r.data)
      .catch((err: unknown) => {
        console.error("[API:users] getUsers failed:", (err as Error).message);
        throw err;
      });
  },

  deleteUser(id: string): Promise<void> {
    console.debug("[API:users] deleteUser", id);
    return apiClient
      .delete(`/users/${id}`)
      .then(() => undefined)
      .catch((err: unknown) => {
        console.error("[API:users] deleteUser failed:", (err as Error).message);
        throw err;
      });
  },
};
