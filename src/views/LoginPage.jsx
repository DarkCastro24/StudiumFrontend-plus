import { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FaMicrosoft } from 'react-icons/fa';
import LogoUCA from '../assets/img/LogoUCA-blanco.png';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { GLOBAL } from '../services/apiConfig';
import { isMicrosoftAuthConfigured, loginRequest } from '../services/msalConfig';
import { showError, showWarning } from '../utils/alerts';

export const LoginPage = () => {
    //CREDENCIALES
    const API_URL = GLOBAL[0].BASE_URL;
    const DEFAULT_PASSWORD = import.meta.env.VITE_DEFAULT_PASSWORD || 'StudiumPassword';
    //MSAL (Microsoft Authentication Library)
    const { instance: msalInstance } = useMsal();
    //PARA NAVEGAR AL HOME
    const navigate = useNavigate();
    const redirectHome = () => {
        navigate('/home');
    };
    //DOMINIOS VALIDOS
    const dominiosValidos = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com', 'uca.edu.sv'];

    const validarDominioCorreo = (email) => {
        const dominio = email.split('@')[1]?.toLowerCase();
        return dominio && dominiosValidos.includes(dominio);
    };

    //EXPRESIONES REGULARES
    const validarEstudiante = (email) => {
        const regex = /^[0-9]{8}/;
        return regex.test(email);
    }

    const realizarPeticionPost = async (data) => {
        try {
            const payload = {
                password: DEFAULT_PASSWORD,
                ...data,
            };

            const response = await axios.post(`${API_URL}/auth/register`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            //console.log("ID MONGO USER:", response.data); //ID DE MONGO
            localStorage.setItem("ID", response.data); //GUARDA EN Local Storage EL ID
            return response.data;
        } catch (error) {
            console.error('Error en la petición:', error);
            throw error;
        }
    }

    const postUsernameLogin = async (credentials) => {
        const normalizedBaseUrl = API_URL.replace(/\/+$/, '');
        const apiRootUrl = normalizedBaseUrl.endsWith('/api')
            ? normalizedBaseUrl.slice(0, -4)
            : normalizedBaseUrl;

        const endpoints = [
            `${apiRootUrl}/api/auth/login`,
            `${apiRootUrl}/api/auth/login/username`,
            `${normalizedBaseUrl}/auth/login`,
            `${normalizedBaseUrl}/auth/login/username`,
        ];

        let lastError;
        for (const endpoint of [...new Set(endpoints)]) {
            try {
                console.log('Ruta de login enviada:', endpoint);
                console.log('Credenciales enviadas:', credentials);
                return await axios.post(endpoint, credentials, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            } catch (error) {
                const status = error?.response?.status;
                if (status !== 404 && status !== 401) {
                    throw error;
                }
                lastError = error;
            }
        }

        throw lastError;
    };

    const persistSessionFromToken = async (token, fallbackData = {}) => {
        let decodedToken = {};

        try {
            decodedToken = jwtDecode(token);
        } catch (error) {
            decodedToken = {};
        }

        const email = String(
            decodedToken.email ||
            decodedToken.username ||
            fallbackData.email ||
            fallbackData.username ||
            ''
        ).trim();
        const name = String(
            decodedToken.name ||
            decodedToken.nombre ||
            fallbackData.name ||
            fallbackData.nombre ||
            email
        );
        const image = String(
            decodedToken.picture ||
            decodedToken.imagen ||
            fallbackData.picture ||
            fallbackData.imagen ||
            ''
        );

        if (!email) {
            throw new Error('Token inválido: no contiene correo');
        }

        localStorage.setItem("TOKEN", token);
        localStorage.setItem("EMAIL", email);
        localStorage.setItem("NAME", name);

        const formUser = {
            username: email,
            nombre: name,
            tipo: validarEstudiante(email) ? 2 : 3,
            imagen: image
        };

        await realizarPeticionPost(formUser);
    };

    const iniciarSesionConCredenciales = async (event) => {
        event.preventDefault();

        if (!username.trim() || !password.trim()) {
            showWarning({
                title: 'Campos incompletos',
                text: 'Por favor completa tu correo y contraseña antes de continuar.',
            });
            return;
        }

        setCargandoCredenciales(true);

        try {
            const response = await postUsernameLogin({
                username: username.trim(),
                email: username.trim(),
                password
            });

            const token = typeof response.data === 'string'
                ? response.data
                : response.data?.token || response.data?.access_token || response.data?.accessToken || response.data?.jwt;

            if (!token) {
                throw new Error('No se recibió token de autenticación');
            }

            const responseData = typeof response.data === 'object' && response.data !== null ? response.data : {};

            await persistSessionFromToken(token, {
                email: username.trim(),
                username: responseData.username,
                name: responseData.name,
                nombre: responseData.nombre,
                picture: responseData.picture,
                imagen: responseData.imagen,
            });
            redirectHome();
        } catch (error) {
            console.error('Error al iniciar sesión con correo y contraseña:', error);
            const mensajeError =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.response?.data?.msg ||
                'Correo o contraseña inválidos';
            showError({
                title: 'No se pudo iniciar sesión',
                text: mensajeError,
            });
        } finally {
            setCargandoCredenciales(false);
        }
    };

    /**
     * Intenta descargar la fotografía de perfil del usuario desde Microsoft
     * Graph. Devuelve una `data URL` lista para usarse como `src` de <img>,
     * o cadena vacía si la cuenta no tiene foto o no hay permisos.
     *
     * NOTA: el scope `User.Read` ya solicita acceso a /me, pero algunos
     * tenants restringen `/me/photo/$value`. Si se requiere garantizar la
     * foto puede añadirse el permiso `User.ReadBasic.All` en el portal de
     * Azure.
     */
    const obtenerFotoPerfilMicrosoft = async (accessToken) => {
        if (!accessToken) return '';
        try {
            const response = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) return '';
            const blob = await response.blob();
            return await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
                reader.onerror = () => resolve('');
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.warn('No se pudo obtener la foto de perfil de Microsoft:', error);
            return '';
        }
    };

    const procesarCuentaMicrosoft = async ({ account, idToken, accessToken }) => {
        if (!account?.username) {
            throw new Error('La cuenta de Microsoft no tiene un correo asociado.');
        }

        const email = String(account.username).trim();

        if (!validarDominioCorreo(email)) {
            showWarning({
                title: 'Correo no permitido',
                text: 'Inicia sesión con un correo válido (Gmail, Hotmail, Outlook, Yahoo, iCloud o UCA).',
            });
            return;
        }

        const name = String(account.name || email);
        const imagen = await obtenerFotoPerfilMicrosoft(accessToken);

        localStorage.setItem('EMAIL', email);
        localStorage.setItem('NAME', name);
        if (idToken) localStorage.setItem('TOKEN', idToken);

        const formUser = {
            username: email,
            nombre: name,
            tipo: validarEstudiante(email) ? 2 : 3, // 2 → estudiante, 3 → catedrático
            imagen,
        };

        try {
            await realizarPeticionPost(formUser);
        } catch (error) {
            console.error('Error al enviar los datos del usuario:', error);
            showError({
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor. Intenta más tarde.',
            });
            return;
        }

        redirectHome();
    };

    const iniciarSesionConMicrosoft = async () => {
        if (!isMicrosoftAuthConfigured) {
            showWarning({
                title: 'Microsoft no configurado',
                text:
                    'El inicio de sesión con Microsoft está pendiente de configuración. ' +
                    'Solicita al administrador registrar la aplicación en Microsoft Entra ID ' +
                    'y completar las variables VITE_MICROSOFT_CLIENT_ID y VITE_MICROSOFT_TENANT_ID.',
            });
            return;
        }

        setCargandoMicrosoft(true);
        try {
            const result = await msalInstance.loginPopup(loginRequest);
            const account = result?.account || msalInstance.getAllAccounts()[0];
            await procesarCuentaMicrosoft({
                account,
                idToken: result?.idToken,
                accessToken: result?.accessToken,
            });
        } catch (error) {
            // El usuario cerró el popup o canceló: no mostramos error agresivo.
            if (
                error?.errorCode === 'user_cancelled' ||
                error?.name === 'BrowserAuthError' && /cancelled/i.test(error?.message || '')
            ) {
                return;
            }
            console.error('Error al iniciar sesión con Microsoft:', error);
            showError({
                title: 'No se pudo iniciar sesión con Microsoft',
                text:
                    error?.errorMessage ||
                    error?.message ||
                    'Intenta nuevamente o usa correo y contraseña.',
            });
        } finally {
            setCargandoMicrosoft(false);
        }
    };

    //MENSAJES DE ERROR
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [cargandoCredenciales, setCargandoCredenciales] = useState(false);
    const [cargandoMicrosoft, setCargandoMicrosoft] = useState(false);
    //RENDER
    return (
        <div className='login'>
            <h1><b><span className='h1-rosa'>Bienvenidos a </span><span className='h1-azul'>Studium</span></b></h1>
            <article>
                <img src={LogoUCA} alt="Logo-UCA"></img>
                <p className='login-subtitle'>Inicia sesión con correo y contraseña</p>
                <form id='login' onSubmit={iniciarSesionConCredenciales}>
                    <input
                        type='email'
                        placeholder='Correo'
                        autoComplete='username'
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                    />
                    <div className='password-input-wrapper'>
                        <input
                            type={mostrarPassword ? 'text' : 'password'}
                            placeholder='Contraseña'
                            autoComplete='current-password'
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                        <button
                            type='button'
                            className='toggle-password-btn'
                            onClick={() => setMostrarPassword((prev) => !prev)}
                            aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                    <button className='btn-login-admin' type='submit' disabled={cargandoCredenciales}>
                        {cargandoCredenciales ? 'Ingresando...' : 'Iniciar sesión'}
                    </button>
                </form>
                <p className='login-subtitle'>O continúa con tu cuenta de Microsoft</p>
                <div className='microsoftbtn'>
                    <button
                        type='button'
                        className='btn-login-microsoft'
                        onClick={iniciarSesionConMicrosoft}
                        disabled={cargandoMicrosoft}
                        aria-label='Iniciar sesión con Microsoft'
                    >
                        <FaMicrosoft aria-hidden='true' />
                        <span>
                            {cargandoMicrosoft ? 'Conectando...' : 'Iniciar sesión con Microsoft'}
                        </span>
                    </button>
                </div>
            </article>
        </div>
    )
}

export default LoginPage;
