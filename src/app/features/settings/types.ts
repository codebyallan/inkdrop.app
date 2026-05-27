export interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type ChangePasswordPayload = Omit<ChangePasswordForm, 'confirmPassword'>;
