export interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type ChangePasswordPayload = Omit<ChangePasswordForm, 'confirmPassword'>;

export interface ApiKeyRequest {
  name: string;
}

export interface ApiKeyUpdateRequest {
  name: string;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}
