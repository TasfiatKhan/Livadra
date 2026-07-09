// EXPO_PUBLIC_API_URL must be set in EAS secrets (eas.json / environment variables) for production builds.
// Without it, the app defaults to localhost:8000 which is unreachable on a real device.
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
