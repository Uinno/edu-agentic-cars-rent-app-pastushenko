export type UserRole = "superadmin" | "admin" | "user";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Shape of the decoded JWT payload — what req.user looks like on the backend */
export interface CurrentUserPayload {
  id: string;
  email: string;
  role: UserRole;
}
