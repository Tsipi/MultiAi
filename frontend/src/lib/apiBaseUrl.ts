const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, "");

export function getApiBaseUrl(): string {
  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl;
  }

  if (import.meta.env.DEV) {
    return "http://localhost:8000";
  }

  throw new Error(
    "Production API URL is not configured. Set VITE_API_BASE_URL on the Railway frontend service and redeploy."
  );
}
