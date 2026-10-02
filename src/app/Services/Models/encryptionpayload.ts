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