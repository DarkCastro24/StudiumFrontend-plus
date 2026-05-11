/**
 * Configuración global consumida por el resto de la aplicación.
 *
 * Anteriormente se exponía el `Client ID` de Google Identity Services
 * (`VITE_GOOGLE_ID`). El proveedor de autenticación migró a Microsoft Entra
 * ID, por lo que ahora se exponen las variables necesarias para MSAL.
 *
 * Variables de entorno esperadas (ver `.env.example`):
 *   - VITE_API_URL                   → URL base del backend
 *   - VITE_MICROSOFT_CLIENT_ID       → Application (client) ID de Azure
 *   - VITE_MICROSOFT_TENANT_ID       → Directory (tenant) ID o `common`
 *   - VITE_MICROSOFT_REDIRECT_URI    → URI de redirección registrado en Azure
 */
export const GLOBAL = [
    {
        BASE_URL: import.meta.env.VITE_API_URL,
        MICROSOFT_CLIENT_ID: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
        MICROSOFT_TENANT_ID: import.meta.env.VITE_MICROSOFT_TENANT_ID || 'common',
        MICROSOFT_REDIRECT_URI: import.meta.env.VITE_MICROSOFT_REDIRECT_URI || '',
    },
];
