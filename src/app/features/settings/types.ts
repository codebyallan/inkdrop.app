export interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
}

export type ChangePasswordPayload = ChangePasswordForm;
