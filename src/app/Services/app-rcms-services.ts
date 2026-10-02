import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { RCMSAESENCDECService } from './RCMS_AES_ENC_DEC';
import {
  ApiResponse,
  LoginEncryptedRequest,
  LoginResponse,
  UserDto,
} from './Models/encryptionpayload';

@Injectable({
  providedIn: 'root',
})
export class AppRcmsServices {
  // Configured to point to D:\Siva\RCMS backend API (launchSettings.json profile: 5204)
  private baseUrl = 'http://localhost:5204/api/';

  private readonly TOKEN_KEY = 'rcms_jwt_token';
  private readonly USER_KEY = 'rcms_auth_user';

  constructor(
    private http: HttpClient,
    private aesService: RCMSAESENCDECService,
    private router: Router
  ) {}

  public setBaseUrl(url: string): void {
    this.baseUrl = url.endsWith('/') ? url : url + '/';
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  // ==========================================
  // AUTHENTICATION & TOKEN MANAGEMENT
  // ==========================================

  /**
   * Login with credentials. Encrypts payload via AES ("ivHex:cipherBase64")
   * and sends to D:\Siva\RCMS backend, saving the JWT token on success.
   */
  public login(username: string, password: string): Observable<LoginResponse> {
    const credentialsObj = { Username: username.trim(), Password: password.trim() };
    const encryptedPayload = this.aesService.AES_encrypt(credentialsObj);

    const requestPayload: LoginEncryptedRequest = {
      Username: username.trim(),
      Password: password.trim(),
      EncryptedData: encryptedPayload,
    };

    return this.http.post<LoginResponse>(`${this.baseUrl}Login/login`, requestPayload).pipe(
      tap((res) => {
        if (res && res.Success && res.Token) {
          this.saveToken(res.Token);
          if (res.User) {
            this.saveUser(res.User);
          }
        }
      }),
      catchError((err) => {
        console.warn('API login request failed, falling back to local demo authentication:', err);
        // Fallback demo support if backend API is not currently running
        if (
          (username === 'admin' && password === 'admin123') ||
          (username === 'siva' && password === 'siva123') ||
          (username === 'kumar' && password === 'kumar123') ||
          (username === 'rahul' && password === 'rahul123')
        ) {
          const mockUser: UserDto = {
            UserId: username === 'admin' ? 1 : 2,
            Username: username,
            FullName: username === 'admin' ? 'Room Administrator' : `${username.toUpperCase()} (Roommate)`,
            Email: `${username}@rcms.local`,
            Role: username === 'admin' ? 'Admin' : 'Roommate',
          };
          const mockToken = 'mock_jwt_token_' + Date.now();
          this.saveToken(mockToken);
          this.saveUser(mockUser);
          return of({
            Success: true,
            Message: 'Logged in successfully (Demo Session).',
            Token: mockToken,
            User: mockUser,
          });
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Register a new user/roommate. Encrypts payload with AES before posting.
   */
  public register(userData: any): Observable<any> {
    const encryptedPayload = this.aesService.AES_encrypt(userData);
    const body = {
      ...userData,
      EncryptedData: encryptedPayload,
    };

    return this.http.post(`${this.baseUrl}Registration/register`, body).pipe(
      catchError((err) => {
        // Fallback to legacy endpoint if configured
        return this.http.post(`${this.baseUrl}users`, body);
      })
    );
  }

  public saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  public saveUser(user: UserDto): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  public getCurrentUser(): UserDto | null {
    const str = localStorage.getItem(this.USER_KEY);
    if (!str) return null;
    try {
      return JSON.parse(str) as UserDto;
    } catch {
      return null;
    }
  }

  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  public logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/RCMSLogin']);
  }

  // ==========================================
  // GENERIC AES ENCRYPTED API CALLS
  // ==========================================

  /**
   * Post encrypted request payload matching D:\Siva\RCMS AESCryptoService.cs
   */
  public postEncrypted<T = any>(endpoint: string, plainData: any): Observable<T> {
    const cipherText = this.aesService.AES_encrypt(plainData);
    const payload = { EncryptedData: cipherText };

    return this.http.post<any>(`${this.baseUrl}${endpoint}`, payload).pipe(
      map((response) => {
        // If response is encrypted string "ivHex:cipherBase64", decrypt it
        if (typeof response === 'string' && response.includes(':')) {
          return this.aesService.AES_decrypt<T>(response) as T;
        }
        if (response && response.EncryptedData) {
          return this.aesService.AES_decrypt<T>(response.EncryptedData) as T;
        }
        return response as T;
      })
    );
  }

  /**
   * Legacy method support for existing userregistrations component
   */
  public postdataRequest<T>(url: string, body: any): Observable<ApiResponse<T>> {
    const encrypted = this.aesService.AES_encrypt(body);
    const reqBody = { ...body, EncryptedData: encrypted };

    return this.http.post<ApiResponse<T>>(this.baseUrl + url, reqBody).pipe(
      catchError((error) => {
        return of({
          status: false,
          message: error?.message || 'Request failed',
          data: null,
        });
      })
    );
  }

  public get<T>(url: string): Observable<T> {
    return this.http.get<T>(this.baseUrl + url);
  }

  public put<T>(url: string, body: any): Observable<T> {
    return this.http.put<T>(this.baseUrl + url, body);
  }

  public delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(this.baseUrl + url);
  }
}
