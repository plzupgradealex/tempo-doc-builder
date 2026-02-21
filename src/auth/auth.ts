/**
 * Auth module — OIDC-ready authentication scaffolding.
 *
 * Currently: simple local auth state (no real OIDC flow yet).
 * Prepared for: Oracle OCI OIDC / any OIDC provider.
 *
 * When OIDC is wired up, replace the login/logout stubs with:
 *   1. Redirect to OIDC provider authorization endpoint
 *   2. Handle callback with authorization code
 *   3. Exchange code for tokens
 *   4. Store tokens and extract user info
 */

import { emit } from '../bus';

export interface AuthUser {
  username: string;
  displayName: string;
  email?: string;
}

export interface OIDCConfig {
  authority: string;       // e.g. https://identity.oraclecloud.com
  clientId: string;
  redirectUri: string;
  scope: string;           // e.g. 'openid profile email'
  responseType: string;    // 'code' for auth code flow
}

const STORAGE_KEY = 'tempo-auth';

let currentUser: AuthUser | null = loadUser();

function loadUser(): AuthUser | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

function persistUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch { /* ignore */ }
}

export function getUser(): AuthUser | null {
  return currentUser;
}

export function isAuthenticated(): boolean {
  return currentUser !== null;
}

/**
 * Simple login — sets user locally.
 * Replace with OIDC redirect when ready.
 */
export function login(username: string): void {
  currentUser = {
    username,
    displayName: username,
  };
  persistUser(currentUser);
  emit('auth-changed', { user: currentUser });
}

/**
 * Logout — clears user state.
 * When OIDC: also revoke tokens and redirect to end_session_endpoint.
 */
export function logout(): void {
  currentUser = null;
  persistUser(null);
  emit('auth-changed', { user: null });
}

/**
 * OIDC placeholder — start authorization code flow.
 * Uncomment and configure when OIDC provider is ready.
 */
export function startOIDCFlow(_config: OIDCConfig): void {
  // const params = new URLSearchParams({
  //   response_type: config.responseType,
  //   client_id: config.clientId,
  //   redirect_uri: config.redirectUri,
  //   scope: config.scope,
  //   state: crypto.randomUUID(),
  //   nonce: crypto.randomUUID(),
  // });
  // window.location.href = `${config.authority}/authorize?${params}`;
  console.log('[Auth] OIDC flow not yet configured. Using local auth.');
}

/**
 * Handle OIDC callback — extract code from URL, exchange for tokens.
 * Call this from main.ts on page load if URL has ?code= parameter.
 */
export function handleOIDCCallback(): boolean {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code) return false;

  // TODO: Exchange code for tokens at token endpoint
  // For now, just log it
  console.log('[Auth] OIDC callback received code:', code.substring(0, 8) + '...');

  // Clean URL
  window.history.replaceState({}, '', window.location.pathname);
  return true;
}
