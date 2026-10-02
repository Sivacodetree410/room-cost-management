import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { JSEncrypt } from 'jsencrypt';
import { Encryptionpayload, ServiceResult } from './Models/encryptionpayload';

@Injectable({
  providedIn: 'root',
})

export class AesCrypto {

  constructor() { }

  encryptRequest(data: any, publicKey: string): ServiceResult<Encryptionpayload> {
    try {

      // Validate input
      if (!data) {
        return this.encryptionFailed('Request data cannot be null or empty.');
      }
      if (!publicKey || publicKey.trim() === '') {
        return this.encryptionFailed('RSA public key is missing.');
      }

      // Generate AES Key (32 bytes = 256 bits)
      const aesKey = CryptoJS.lib.WordArray.random(32);

      // Generate IV (16 bytes)
      const iv = CryptoJS.lib.WordArray.random(16);

      // Convert object to JSON
      const json = JSON.stringify(data);

      // AES Encryption
      const encrypted = CryptoJS.AES.encrypt(
        json,
        aesKey,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      )

      // Check encryption result
      if (!encrypted || !encrypted.ciphertext) {
        return this.encryptionFailed('Encryption failed.');
      }
      // Base64 Cipher Text
      const cipherText = encrypted.ciphertext.toString(CryptoJS.enc.Base64);

      // Base64 IV
      const ivBase64 = CryptoJS.enc.Base64.stringify(iv);

      // Base64 AES Key
      const aesKeyBase64 = CryptoJS.enc.Base64.stringify(aesKey);

      // HMAC SHA256
      const hmac = CryptoJS.HmacSHA256(
        ivBase64 + cipherText,
        aesKey
      );

      // Base64 hmacBase64
      const hmacBase64 = CryptoJS.enc.Base64.stringify(hmac);

      // RSA Encrypt AES Key
      const rsa = new JSEncrypt();

      rsa.setPublicKey(publicKey);

      const encryptedKey = rsa.encrypt(aesKeyBase64);

      if (!encryptedKey) {
        return this.encryptionFailed('Encryption failed. Check the public key.');
      }

      return {
        success: true,
        message: 'Success',
        data: {
          encryptedKey,

          iv: ivBase64,

          cipherText,

          hmac: hmacBase64
        }

      };
    }
    catch (error: any) {
      //console.error('Encryption Error:', error);
      return this.encryptionFailed(error?.message || 'Encryption failed.');
    }
  }


  private encryptionFailed(message: string): ServiceResult<Encryptionpayload> {
    return {
      success: false,
      message,
      data: {
        encryptedKey: '',
        iv: '',
        cipherText: '',
        hmac: ''
      }
    };

  }

}
