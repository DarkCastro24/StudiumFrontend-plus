# Studium 360 - Frontend

## Índice
- [Repositorio](#repositorio)
- [Manuales de usuario](#manuales-de-usuario)
- [Aspectos generales](#aspectos-generales)
  - [Objetivos del documento](#objetivos-del-documento)
  - [Descripción general](#descripción-general)
  - [Requerimientos del sistema](#requerimientos-del-sistema)
  - [Software utilizado](#software-utilizado)
- [Arquitectura del sistema](#arquitectura-del-sistema)
  - [Patrones de diseño](#patrones-de-diseño)
  - [Modelo de información consumido](#modelo-de-información-consumido)
- [Guía de configuración](#guía-de-configuración)
  - [Configuración para el frontend del sistema](#configuración-para-el-frontend-del-sistema)
- [Compatibilidad de licencias](#compatibilidad-de-licencias)
- [Tipos de error](#tipos-de-error)
- [Tablero](#tablero)
- [Créditos](#créditos)

---

## Repositorio

**Frontend:** [https://github.com/DarkCastro24/StudiumFrontend.git]

---

## Manuales de usuario

- **Manual de usuario:** [https://ucaedusv-my.sharepoint.com/:b:/g/personal/00117322_uca_edu_sv/IQBlsoPHtmA3SYl0OOM3MH80AcJ8wJSPjxYA6oPamoYvAvc?e=RX6KGr]
- **Prototipo en Figma:** [https://www.figma.com/proto/V4H6ZfMVBVq1UooTogtjQW/WEB?node-id=42-2&starting-point-node-id=42%3A2]

---

## Aspectos generales

### Objetivos del documento

Este documento tiene como objetivo describir la estructura general, propósito, tecnologías, configuración y funcionamiento del frontend de **Studium**, con el fin de facilitar su instalación, comprensión y mantenimiento por parte del equipo de desarrollo y futuros colaboradores.

### Descripción general

**Studium** es una plataforma web orientada a apoyar los círculos de estudio de la Universidad Centroamericana José Simeón Cañas (UCA). Desde el frontend, el sistema permite que los usuarios interactúen con cursos, recursos académicos y perfiles según su rol dentro de la plataforma.

La aplicación contempla vistas y funcionalidades diferenciadas para los siguientes roles:

- **Tutor**
- **Tutorado**
- **Administrador**

Entre las funcionalidades principales del frontend se encuentran:

- Inicio de sesión con cuenta institucional
- Visualización de cursos disponibles
- Unión a cursos
- Creación y gestión de cursos
- Edición de perfil
- Registro y consulta de materias cursadas
- Gestión de recursos dentro de un curso
- Uso de calendario
- Control de asistencia
- Envío de correos
- Búsqueda por cursos, materias o perfiles

### Requerimientos del sistema

#### Para uso de la aplicación

- Navegador web actualizado
- Cuenta institucional UCA

#### Para desarrollo local

- **Node.js**
- **Yarn**
- **Sistema operativo Linux** (según la guía original del proyecto)
- Backend del sistema ejecutándose localmente

### Software utilizado

El frontend de Studium utiliza herramientas orientadas al desarrollo de una aplicación web moderna de una sola página.

Tecnologías y dependencias documentadas:

- **Axios**  
  Utilizado para realizar solicitudes HTTP hacia los servicios del backend.

- **jwt-decode**  
  Utilizado para decodificar tokens JWT del lado del cliente y obtener información del usuario autenticado.

- **keycloak-js**  
  Adaptador oficial de Keycloak para JavaScript. Implementa el flujo
  Authorization Code + PKCE de OpenID Connect y gestiona la renovación
  automática del access token. Reemplazó la integración previa con
  Microsoft Authentication Library (MSAL).

- **SweetAlert2**  
  Utilizado para mostrar de manera consistente los mensajes de éxito, error,
  advertencia, información y confirmaciones al usuario.

- **React Router**  
  Utilizado para la navegación entre vistas dentro de la aplicación.

- **React Icons**  
  Utilizado para incorporar iconografía en la interfaz del sistema.

- **Yarn**  
  Utilizado como gestor de paquetes del frontend.

> Nota: por las dependencias documentadas y la naturaleza del prototipo, este frontend está planteado como una SPA basada en componentes.

---

## Arquitectura del sistema

El frontend de Studium está organizado como una interfaz web que consume los servicios expuestos por el backend del sistema. Su responsabilidad principal es presentar la información, administrar la interacción del usuario y facilitar el acceso a las funcionalidades según el rol autenticado.

### Patrones de diseño

A nivel frontend, el sistema puede describirse bajo los siguientes enfoques:

- **Arquitectura basada en componentes**  
  La interfaz se divide en vistas y secciones reutilizables.

- **Navegación por rutas**  
  Las diferentes pantallas del sistema se estructuran por rutas, permitiendo separar módulos como perfil, calendario, búsqueda, correo y cursos.

- **Separación por roles**  
  La interfaz adapta sus vistas y opciones para Tutor, Tutorado, Administrador y Catedrático.

### Modelo de información consumido

Aunque el modelo persistente pertenece al backend, el frontend consume principalmente las siguientes entidades:

- **Usuarios**
- **Cursos**
- **Recursos**
- **Tutorados**
- **Materias de interés**
- **Perfiles**
- **Mensajes de correo**

Principales rutas de API consumidas por el sistema:

- `/api/register`
- `/api/login`
- `/api/cursos`
- `/api/cursos/:cursoId/tutorados`
- `/api/usuarios`
- `/api/correo`

---

## Guía de configuración

### Configuración para el frontend del sistema

#### 1. Clonar el repositorio

```bash
git clone https://github.com/DarkCastro24/StudiumFrontend.git
```

#### 2. Variables de entorno

Copia el archivo `.env.example` a `.env` y completa los valores:

```env
VITE_API_URL="https://studiumserver.onrender.com/api"
VITE_DEFAULT_PASSWORD="StudiumPassword"
VITE_KEYCLOAK_URL="https://keycloak.midominio.com"
VITE_KEYCLOAK_REALM="studium"
VITE_KEYCLOAK_CLIENT_ID="studium-frontend"
VITE_KEYCLOAK_MIN_VALIDITY="60" # opcional, segundos antes de renovar el token
```

#### 3. Configuración de autenticación con Keycloak (OpenID Connect)

A partir de esta versión Studium delega la autenticación federada a un
servidor **Keycloak** (>=17). El frontend habla con Keycloak vía el flujo
estándar **Authorization Code + PKCE**, por lo que basta con registrar un
cliente público en el realm correspondiente:

1. Ingresa a la consola de administración de Keycloak y selecciona (o crea)
   el realm que usará la aplicación (por ejemplo `studium`). El nombre del
   realm se expone como `VITE_KEYCLOAK_REALM`.
2. En **Clients → Create client** registra un nuevo cliente:
   - **Client ID:** `studium-frontend` (o el que prefieras). Se expone como
     `VITE_KEYCLOAK_CLIENT_ID`.
   - **Client type:** `OpenID Connect`.
   - **Client authentication:** **OFF** (cliente público con PKCE).
   - **Authorization:** OFF.
   - **Authentication flow:** habilita `Standard flow`.
3. En la pestaña **Settings** del cliente configura:
   - **Valid redirect URIs:** `http://localhost:5173/*` y
     `https://<tu-dominio>/*` (uno por cada entorno).
   - **Valid post logout redirect URIs:** mismas URLs que arriba.
   - **Web origins:** `+` (o las mismas URLs explícitamente).
4. En **Advanced → Proof Key for Code Exchange Code Challenge Method**
   selecciona **S256** (PKCE recomendado).
5. (Opcional) Crea usuarios directamente en Keycloak o configura un
   **Identity provider** (Microsoft Entra ID, Google, LDAP, etc.) desde
   **Identity providers**. Para Studium da igual qué proveedor use Keycloak
   por debajo: el frontend solo habla con Keycloak.
6. Copia la URL pública del servidor Keycloak (`VITE_KEYCLOAK_URL`,
   sin el sufijo `/auth` que solo existía en versiones <=16).

> ⚠️ Mientras los valores `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM` y
> `VITE_KEYCLOAK_CLIENT_ID` estén vacíos, el botón **Iniciar sesión con
> Keycloak** seguirá visible y mostrará un aviso indicando que la
> configuración está pendiente. El inicio de sesión clásico con correo y
> contraseña sigue funcionando con normalidad, por lo que el sistema
> permanece operativo aunque la integración con Keycloak aún no esté
> completada.

> 📌 **Pendiente — foto de perfil:** Microsoft Graph exponía la foto del
> usuario en `/me/photo/$value`. Keycloak no tiene un equivalente por
> defecto. La función `obtenerFotoPerfilKeycloak` ya lee el claim
> `picture` del id_token; para habilitarla basta con (a) añadir el
> atributo `picture` al perfil del usuario en Keycloak y (b) crear un
> *protocol mapper* tipo `User Attribute` en el cliente que copie ese
> atributo al id_token. Mientras tanto, el componente de perfil usa el
> placeholder genérico de Gravatar (`?d=mp`).

#### 4. Instalación de dependencias y ejecución

```bash
yarn install      # o npm install
yarn dev          # arranca el servidor de desarrollo Vite