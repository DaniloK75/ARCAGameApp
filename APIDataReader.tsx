export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface OAuthClientCredentialsConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
  audience?: string;
}

export interface ApiClientConfig {
  baseUrl: string;
  oauth: OAuthClientCredentialsConfig;
  defaultHeaders?: Record<string, string>;
}

interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

interface TokenCache {
  accessToken: string;
  expiresAtMs: number;
}

const TOKEN_EXPIRY_SAFETY_WINDOW_MS = 30_000;

export class APIDataReader {
  private readonly baseUrl: string;
  private readonly oauth: OAuthClientCredentialsConfig;
  private readonly defaultHeaders: Record<string, string>;

  private tokenCache: TokenCache | null = null;
  private tokenPromise: Promise<string> | null = null;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.oauth = config.oauth;
    this.defaultHeaders = config.defaultHeaders ?? {};
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, headers);
  }

  async post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('POST', endpoint, body, headers);
  }

  async put<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PUT', endpoint, body, headers);
  }

  async patch<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PATCH', endpoint, body, headers);
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, headers);
  }

  async request<T>(
    method: HttpMethod,
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    const token = await this.getValidAccessToken();

    const requestHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...this.defaultHeaders,
      ...headers,
      Authorization: `Bearer ${token}`,
    };

    const hasBody = body !== undefined && body !== null;

    if (hasBody && !requestHeaders['Content-Type']) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: hasBody ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await safeReadText(response);
      throw new Error(
        `API request failed (${response.status} ${response.statusText}) at ${endpoint}. ${errorText}`
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async getValidAccessToken(): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAtMs - TOKEN_EXPIRY_SAFETY_WINDOW_MS) {
      return this.tokenCache.accessToken;
    }

    if (!this.tokenPromise) {
      this.tokenPromise = this.fetchAccessToken().finally(() => {
        this.tokenPromise = null;
      });
    }

    return this.tokenPromise;
  }

  private async fetchAccessToken(): Promise<string> {
    const form = new URLSearchParams();
    form.append('grant_type', 'client_credentials');
    form.append('client_id', this.oauth.clientId);
    form.append('client_secret', this.oauth.clientSecret);

    if (this.oauth.scope) {
      form.append('scope', this.oauth.scope);
    }

    if (this.oauth.audience) {
      form.append('audience', this.oauth.audience);
    }

    const response = await fetch(this.oauth.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    if (!response.ok) {
      const errorText = await safeReadText(response);
      throw new Error(
        `OAuth token request failed (${response.status} ${response.statusText}). ${errorText}`
      );
    }

    const tokenJson = (await response.json()) as TokenResponse;

    if (!tokenJson.access_token) {
      throw new Error('OAuth token response does not include access_token.');
    }

    const expiresInSeconds = tokenJson.expires_in ?? 3600;
    this.tokenCache = {
      accessToken: tokenJson.access_token,
      expiresAtMs: Date.now() + expiresInSeconds * 1000,
    };

    return tokenJson.access_token;
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.trim();
  } catch {
    return '';
  }
}

/*
Usage example:

const api = new APIDataReader({
  baseUrl: 'https://api.example.com',
  oauth: {
    tokenUrl: 'https://auth.example.com/oauth2/token',
    clientId: '<client-id>',
    clientSecret: '<client-secret>',
    scope: 'api.read api.write',
  },
});

const profile = await api.get<{ id: string; name: string }>('/v1/profile');
*/
