import { IUser } from './user.type';

export type AuthResponse = {
  message: string;
  user: IUser;
};
