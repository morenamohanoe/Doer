export interface AppConfig {
  firebase: {
    apiKey: string | undefined;
    authDomain: string | undefined;
    projectId: string | undefined;
    storageBucket: string | undefined;
    messagingSenderId: string | undefined;
    appId: string | undefined;
  };
  googleMaps: {
    apiKey: string | undefined;
  };
  env: {
    isDev: boolean;
    isProd: boolean;
  };
}

export const config: AppConfig = {
  firebase: {
    apiKey: typeof process !== 'undefined' && process.env ? process.env.VITE_FIREBASE_API_KEY : import.meta.env?.VITE_FIREBASE_API_KEY,
    authDomain: typeof process !== 'undefined' && process.env ? process.env.VITE_FIREBASE_AUTH_DOMAIN : import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: typeof process !== 'undefined' && process.env ? process.env.VITE_FIREBASE_PROJECT_ID : import.meta.env?.VITE_FIREBASE_PROJECT_ID,
    storageBucket: typeof process !== 'undefined' && process.env ? process.env.VITE_FIREBASE_STORAGE_BUCKET : import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: typeof process !== 'undefined' && process.env ? process.env.VITE_FIREBASE_MESSAGING_SENDER_ID : import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: typeof process !== 'undefined' && process.env ? process.env.VITE_FIREBASE_APP_ID : import.meta.env?.VITE_FIREBASE_APP_ID,
  },
  googleMaps: {
    apiKey: typeof process !== 'undefined' && process.env ? process.env.GOOGLE_MAPS_PLATFORM_KEY : (import.meta.env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || (window as any)?.process?.env?.GOOGLE_MAPS_PLATFORM_KEY),
  },
  env: {
    isDev: typeof process !== 'undefined' && process.env ? process.env.NODE_ENV !== 'production' : import.meta.env?.DEV || false,
    isProd: typeof process !== 'undefined' && process.env ? process.env.NODE_ENV === 'production' : import.meta.env?.PROD || false,
  }
};
