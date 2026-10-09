const API_BASE_URL = 'http://127.0.0.1:8000';

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `API request failed (${response.status}): ${errorText}`,
    );
  }

  return response.json();
}

export async function apiGet<T>(
  endpoint: string,
): Promise<T> {
  return apiRequest<T>(endpoint);
}