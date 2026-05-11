import { LogLevel, PublicClientApplication } from '@azure/msal-browser';

/**
 * Configuración de Microsoft Authentication Library (MSAL) para autenticación
 * con cuentas Microsoft (Microsoft Entra ID, antes Azure AD).
 *
 * --------------------------------------------------------------------------
 * REQUISITOS DE CONFIGURACIÓN EXTERNA (Azure / Microsoft Entra ID)
 * --------------------------------------------------------------------------
 * Para que esta autenticación funcione es necesario registrar la aplicación
 * en el portal de Microsoft Entra ID (Azure Portal). Estos pasos requieren
 * permisos administrativos sobre un tenant de Microsoft Entra:
 *
 *   1. Ingresa al portal de Azure → Microsoft Entra ID → App registrations
 *   2. "New registration":
 *        - Nombre: Studium (o el que prefieras)
 *        - Tipos de cuenta admitidas:
 *            • Solo cuentas institucionales (UCA) → "Single tenant"
 *            • Cuentas personales y de trabajo  → "Accounts in any
 *              organizational directory and personal Microsoft accounts"
 *        - Redirect URI (plataforma "Single-page application"):
 *            • http://localhost:5173   (desarrollo con Vite)
 *            • https://<tu-dominio>    (producción)
 *   3. Copia los valores generados:
 *        - Application (client) ID  → VITE_MICROSOFT_CLIENT_ID
 *        - Directory (tenant) ID    → VITE_MICROSOFT_TENANT_ID
 *          (puedes usar "common", "organizations" o "consumers" si decides
 *          no restringir a un tenant específico)
 *   4. En "API permissions" añade los permisos delegados de Microsoft Graph:
 *        - openid
 *        - profile
 *        - email
 *        - User.Read       (datos básicos del usuario)
 *      Opcional, para fotografía de perfil:
 *        - User.ReadBasic.All
 *   5. (Opcional) En "Authentication" habilita "ID tokens" en el bloque de
 *      implicit grant / hybrid flow si tu tenant lo requiere.
 *
 * Mientras no se complete este registro, los valores de las variables de
 * entorno pueden quedar vacíos: el botón de Microsoft seguirá visible pero
 * mostrará una alerta indicando que la configuración está pendiente, sin
 * romper el resto del flujo del sistema.
 * --------------------------------------------------------------------------
 */

const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID || '';
const tenantId = import.meta.env.VITE_MICROSOFT_TENANT_ID || 'common';
const redirectUri =
    import.meta.env.VITE_MICROSOFT_REDIRECT_URI ||
    (typeof window !== 'undefined' ? window.location.origin : '/');

/**
 * Indica si la integración con Microsoft está completamente configurada.
 * Si es `false`, el componente de login debe mostrar un mensaje aclarando
 * que la autenticación con Microsoft está pendiente de configuración.
 */
export const isMicrosoftAuthConfigured = Boolean(clientId);

export const msalConfig = {
    auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri,
        postLogoutRedirectUri: redirectUri,
        navigateToLoginRequestUrl: false,
    },
    cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) return;
                if (level === LogLevel.Error) {
                    console.error(`[MSAL] ${message}`);
                }
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Warning,
        },
    },
};

/**
 * Scopes solicitados durante el inicio de sesión.
 * - `openid`, `profile`, `email` se exponen automáticamente por Microsoft.
 * - `User.Read` permite consultar Microsoft Graph para obtener datos del
 *   usuario y, opcionalmente, su fotografía de perfil.
 */
export const loginRequest = {
    scopes: ['openid', 'profile', 'email', 'User.Read'],
};

/**
 * Instancia compartida del cliente público de MSAL.
 * Se exporta para que `<MsalProvider>` la use en `main.jsx`.
 */
export const msalInstance = new PublicClientApplication(msalConfig);
