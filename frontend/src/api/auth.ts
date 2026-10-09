const API_BASE_URL = 'http://127.0.0.1:8000';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
}

export async function login(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Login failed');
  }

  return data;
}

export async function getCurrentUser(
  token: string,
): Promise<CurrentUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Authentication failed');
  }

  return data;
}