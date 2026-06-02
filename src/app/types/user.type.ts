export const ROLE_MAP = {
  0: 'Admin',
  1: 'Technician',
} as const;

export const INVERSE_ROLE_MAP = {
  'Admin': 0,
  'Technician': 1,
} as const;

export type UserRole = keyof typeof ROLE_MAP | UserRoleLabel; // 0 | 1 | 'Admin' | 'Technician'
export type UserRoleLabel = keyof typeof INVERSE_ROLE_MAP; // 'Admin' | 'Technician'

export interface IUser {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly role: UserRole;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface IUserCreateRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface IUserUpdateRequest {
  username: string;
  email: string;
  role: UserRole;
}
