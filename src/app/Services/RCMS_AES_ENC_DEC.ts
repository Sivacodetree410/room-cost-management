import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class RCMSAESENCDECService {
  // 32-character AES Key matching D:\Siva\RCMS appsettings.json "AES:Key"
  private readonly AES_key = '12345678901234567890123456789012';

  constructor() {}

  /**
   * Encrypts plain text or object into "ivHex:cipherBase64"
   * Compatible with D:\Siva\RCMS AESCryptoService.cs
   */
  public AES_encrypt(value: string | object): string {
    try {
      if (!value) return '';
      const textToEncrypt = typeof value === 'object' ? JSON.stringify(value) : value.toString();
      if (!textToEncrypt.trim()) return '';

      const key = CryptoJS.enc.Utf8.parse(this.AES_key);
      const iv = CryptoJS.lib.WordArray.random(16);

      const encrypted = CryptoJS.AES.encrypt(textToEncrypt, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // iv.toString() outputs 32 hex chars, encrypted.toString() outputs Base64
      const result = iv.toString() + ':' + encrypted.toString();
      return result || '';
    } catch (err) {
      console.error('AES encryption error:', err);
      return '';
    }
  }

  /**
   * Decrypts "ivHex:cipherBase64" back into string or typed object
   */
  public AES_decrypt<T = string>(cipherText: string): T | null {
    try {
      if (!cipherText?.trim()) return null;

      const parts = cipherText.split(':');
      if (parts.length !== 2) {
        // Fallback for raw JSON string
        if (cipherText.trim().startsWith('{') || cipherText.trim().startsWith('[')) {
          return JSON.parse(cipherText) as T;
        }
        return cipherText as unknown as T;
      }

      const iv = CryptoJS.enc.Hex.parse(parts[0]);
      const encrypted = parts[1];
      const key = CryptoJS.enc.Utf8.parse(this.AES_key);

      const bytes = CryptoJS.AES.decrypt(encrypted, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedStr) return null;

      try {
        return JSON.parse(decryptedStr) as T;
      } catch {
        return decryptedStr as unknown as T;
      }
    } catch (err) {
      console.error('AES decryption error:', err);
      return null;
    }
  }
}