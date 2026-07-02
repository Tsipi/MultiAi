export const AUTH_TOKEN_KEY = "teamstoa_auth_token";

function readStorage(storage: Storage | undefined, key: string): string | null {
  return typeof storage?.getItem === "function" ? storage.getItem(key) : null;
}

function writeStorage(storage: Storage | undefined, key: string, value: string): void {
  if (typeof storage?.setItem === "function") storage.setItem(key, value);
}

function removeStorage(storage: Storage | undefined, key: string): void {
  if (typeof storage?.removeItem === "function") storage.removeItem(key);
}

export function getAuthToken(): string | null {
  return readStorage(globalThis.sessionStorage, AUTH_TOKEN_KEY)
    ?? readStorage(globalThis.localStorage, AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  writeStorage(globalThis.sessionStorage, AUTH_TOKEN_KEY, token);
  removeStorage(globalThis.localStorage, AUTH_TOKEN_KEY);
}

export function clearAuthToken(): void {
  removeStorage(globalThis.sessionStorage, AUTH_TOKEN_KEY);
  removeStorage(globalThis.localStorage, AUTH_TOKEN_KEY);
}
