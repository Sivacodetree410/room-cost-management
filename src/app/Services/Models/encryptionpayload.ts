export interface Encryptionpayload {
  encryptedKey: string;
  iv: string;
  cipherText: string;
  hmac: string;
}

export interface ServiceResult<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T | null;
}

export interface UserDto {
  UserId?: number;
  Username: string;
  FullName: string;
  Email?: string;
  Role?: string;
}

export interface LoginEncryptedRequest {
  Username?: string;
  Password?: string;
  EncryptedData?: string; // Formatted as "ivHex:cipherBase64"
}

export interface LoginResponse {
  Success: boolean;
  Message: string;
  Token?: string;
  Expiration?: string;
  User?: UserDto;
}