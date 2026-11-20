const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("team_bsy_token");
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("team_bsy_token", token);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("team_bsy_token");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (options.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("Accept", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(
    `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
    {
      ...options,
      headers,
    },
  );

  if (!response.ok) {
    let message = "Something went wrong. Please try again.";

    try {
      const errorData = await response.json();
      message = errorData.message || errorData.error || message;
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
export async function apiFetchBlob(path: string): Promise<Blob> {
  const token = getAuthToken();
  const headers = new Headers();

  headers.set("Accept", "*/*");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(
    `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
    { method: "GET", headers },
  );

  if (!response.ok) {
    let message = "Could not load the receipt.";

    try {
      const errorData = await response.json();
      message = errorData.message || errorData.error || message;
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.blob();
}