import { inject, Service, signal } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpHeaders } from '@angular/common/http';
import { User } from '../models/types/user.types';
import { ActivatedRoute, Router } from '@angular/router';
import { decodeAzureToken } from '../utils/decodeAzureToken';

@Service()
export class UserService {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected readonly apiUrl = environment.apiBaseUrl;
  protected readonly azureUrl: string = 'https://xpert.ggroup.cloud/api/sso-callback.php?from=';

  // Token
  private token = signal<string | undefined>(undefined);

  // States
  private _isLoading = signal<boolean>(false);
  readonly isLoading = this._isLoading.asReadonly();
  private _error = signal<string | null>(null);
  readonly error = this._error.asReadonly();

  // User
  private _user = signal<User | null>(JSON.parse(localStorage.getItem('pico_user') || 'null'));
  readonly user = this._user.asReadonly();

  // External methods
  private decodeAzureToken = decodeAzureToken;

  getToken() {
    this.token.set(JSON.parse(localStorage.getItem('pico_user') || 'null')?.token || undefined);
    this._user.set(JSON.parse(localStorage.getItem('pico_user') || 'null'));
    return this.token();
  }

  getHeaders() {
    const token = this.getToken();

    // If there's no token, return an empty HttpHeaders object
    if (!token) {
      return new HttpHeaders();
    }

    // Manually create the HttpHeaders object with the Authorization header
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return headers;
  }

  signInWithAzure() {
    this._isLoading.set(true);
    this._error.set(null);

    if (this.route.snapshot.queryParams['error']) {
      this._error.set(
        this.route.snapshot.queryParams['error_description'] ||
          'An error occurred during authentication.',
      );
      this._isLoading.set(false);
      return;
    }

    if (this.route.snapshot.queryParams['token']) {
      const accessToken = this.route.snapshot.queryParams['token'];

      const userData = this.decodeAzureToken(accessToken);
      console.info('Decoded user data:', userData);

      if (!userData) {
        this._error.set('Failed to decode token.');
        this._isLoading.set(false);
        return;
      }

      const user = { ...userData.metadata, token: accessToken } as User;
      console.info('Constructed user object:', user);

      localStorage.setItem('pico_user', JSON.stringify(user));
      this._user.set(user);
      this._isLoading.set(false);
      this.router.navigate(['/']);
    }
  }

  loginAzure() {
    window.location.href = this.azureUrl + encodeURIComponent(window.location.href);
  }

  logout() {
    localStorage.removeItem('pico_user');
    this._user.set(null);
  }
}
