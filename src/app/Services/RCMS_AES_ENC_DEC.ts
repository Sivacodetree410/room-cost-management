import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
    providedIn: 'root'
})

export class RCMSAESENCDECService {

    private key: any = CryptoJS.lib.WordArray.random(32);

    private readonly AES_key = '12345678901234567890123456789012'; //CryptoJS.enc.Utf8.parse('12345678901234567890123456789012');

    constructor() {

    }

    public AES_encrypt(value: string): string {
        try {
            if (!value?.trim()) {
                return '';
            }
            const key = CryptoJS.enc.Utf8.parse(this.AES_key);

            const iv = CryptoJS.lib.WordArray.random(16);

            const encrypted =
                CryptoJS.AES.encrypt(value, key, {
                    iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                });

            const result = iv.toString() + ':' + encrypted.toString();
            return result || '';
        }
        catch {
            return '';
        }
    }

    public AES_decrypt(cipherText: string): string {
        try {
            if (!cipherText?.trim()) {
                return '';
            }

            const parts = cipherText.split(':');

            const iv = CryptoJS.enc.Hex.parse(parts[0]);

            const encrypted = parts[1];

            const bytes =
                CryptoJS.AES.decrypt(
                    encrypted,
                    CryptoJS.enc.Utf8.parse(this.AES_key),
                    {
                        iv,
                        mode: CryptoJS.mode.CBC,
                        padding: CryptoJS.pad.Pkcs7
                    }
                );

            const result = bytes.toString(
                CryptoJS.enc.Utf8
            );

            return result || '';
        }
        catch {
            return '';
        }
    }

}