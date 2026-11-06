import { getProductionApiUrlError } from './apiUrlPolicy';

// The API base URL is inlined at bundle time from EXPO_PUBLIC_API_URL.
//  - Development (__DEV__): falls back to localhost, and LAN IPs from frontend/.env are fine.
//  - Release builds: must be an https URL on a public host. EAS production builds are
//    already rejected by app.config.js if it isn't; this is the runtime backstop for
//    any other release build path (e.g. a local `expo run:android --variant release`).
function resolveBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (__DEV__) {
    return configured || 'http://localhost:8000';
  }

  const error = getProductionApiUrlError(configured);
  if (error) {
    // Fail loudly at startup instead of silently sending users' requests nowhere.
    throw new Error(`[Livadra] Invalid release API configuration: ${error}`);
  }
  return configured!.replace(/\/+$/, '');
}

export const BASE_URL = resolveBaseUrl();
