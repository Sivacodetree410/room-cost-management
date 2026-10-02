import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AesCrypto } from './aes-crypto';
import { ApiResponse } from './Models/encryptionpayload';

@Injectable({
  providedIn: 'root',
})

export class AppRcmsServices {

  private baseUrl = 'https://localhost:5001/api/';

  constructor(private httpclient: HttpClient, private aesCrypto: AesCrypto) {

  }

  postdataRequest<T>(url: string, body: any): Observable<ApiResponse<T>> {

    const encryptedRequest = this.aesCrypto.encryptRequest(body, '');

    if (encryptedRequest.success) {
      return this.httpclient.post<ApiResponse<T>>(this.baseUrl + url, encryptedRequest.data);
    }
    else {
      return of({
        status: false,
        message: encryptedRequest.message,
        data: null
      });
    }
  }

  getRSApublickey<T>(url: string): Observable<T> {
    return this.httpclient.get<T>(this.baseUrl + url);
  }

  put<T>(url: string, body: any): Observable<T> {
    return this.httpclient.put<T>(this.baseUrl + url, body);
  }

  delete<T>(url: string): Observable<T> {
    return this.httpclient.delete<T>(this.baseUrl + url);
  }

}
