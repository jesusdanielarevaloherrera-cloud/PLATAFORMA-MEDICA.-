# EcoReport Pro

**Plataforma web para la gestión de informes clínicos, ecografías y consultas médicas.**

> **Estado del proyecto:** en desarrollo. Versión de referencia: `V5.8.8.11`.
>
> EcoReport Pro es una herramienta de apoyo al flujo de trabajo clínico. Antes de utilizarla en un entorno asistencial real, deben probarse los procesos completos, revisar las políticas de seguridad y validar los requisitos legales y clínicos aplicables.

## Descripción

EcoReport Pro busca agilizar la elaboración, organización y consulta de documentos clínicos mediante una interfaz web conectada a Supabase. El proyecto incluye módulos para informes ecográficos, consultas, plantillas, agenda y administración de clínicas.

## Funcionalidades incluidas en el código

- **Informes ecográficos:** captura de datos del paciente, motivo del estudio, hallazgos y contenido del informe.
- **Plantillas:** creación y mantenimiento de plantillas de informes para reutilizar estructuras de contenido.
- **Documentos PDF:** generación de informes en PDF con configuración de clínica, membrete y firma.
- **Descarga mediante QR:** acceso a la descarga del PDF asociado a un token, mediante una Edge Function.
- **Consultas médicas:** especialidades, plantillas de consulta y generación de documentos de consulta.
- **Receta médica:** editor de receta y formatos de impresión configurables.
- **Agenda:** programación y gestión de citas; incluye flujos relacionados con ecografía, consulta, MAPA y Holter.
- **Historial y panel:** vistas para consultar información registrada y mostrar indicadores.
- **Administración de clínicas:** gestión de clínicas y usuarios desde el panel del propietario.
- **Copias de seguridad:** exportación y restauración de datos de una clínica desde el panel del propietario.

> La disponibilidad real de cada módulo depende de que la base de datos, las migraciones SQL, las políticas RLS y las Edge Functions de Supabase estén configuradas de forma compatible con esta versión.

## Tecnologías

- **Frontend:** HTML5, CSS3 y JavaScript.
- **Backend y datos:** Supabase Auth, PostgreSQL, Row Level Security (RLS), Storage y Edge Functions.
- **PDF:** jsPDF.
- **Gráficos del panel:** Chart.js.
- **QR:** generación de códigos con enlaces de descarga para abrir el PDF desde un teléfono.

## Estructura del proyecto

```text
EcoReport-Pro/
├── index.html
├── styles.css
├── app.js
├── config.js                     # configuración local; no publicar secretos
├── supabase/
│   ├── v5_setup.sql
│   ├── download-report.ts
│   └── functions/
│       └── owner-admin/
│           ├── index.ts
│           └── README.md
├── supabase_v5_5_agenda.sql
├── supabase_v5_7_consultas.sql
├── supabase_v5_8_especialidades.sql
├── supabase_v5_8_8_11_admin_backup.sql
└── README.md
```

El repositorio también contiene scripts SQL y notas de versiones anteriores. Estos archivos representan migraciones acumulativas; no todos se deben ejecutar indiscriminadamente sobre una misma base de datos.

## Requisitos

- Navegador moderno actualizado.
- Un proyecto de Supabase configurado para EcoReport Pro.
- Un servidor web local para desarrollo, por ejemplo la extensión **Live Server** de Visual Studio Code o Python.
- Supabase CLI si se van a desplegar las Edge Functions desde la terminal.

## Ejecutar el frontend localmente

1. Descarga o clona el repositorio.
2. Configura la conexión a Supabase en un archivo local `config.js` siguiendo la estructura indicada abajo.
3. Desde la carpeta del proyecto, inicia un servidor local. Por ejemplo, con Python:

   ```bash
   python -m http.server 5500
   ```

4. Abre `http://localhost:5500` en el navegador.
5. Inicia sesión con una cuenta que esté correctamente asociada a una clínica y tenga los permisos necesarios.

### Configuración local de Supabase

El frontend lee `window.ECOREPORT_CONFIG` desde `config.js`. Usa los datos de **tu propio proyecto**:

```javascript
window.ECOREPORT_CONFIG = {
  SUPABASE_URL: 'https://<PROJECT_REF>.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_<YOUR_KEY>',
  CLINIC_ID: '',
  STORAGE_BUCKET: 'reports',
  DOWNLOAD_FUNCTION_URL: 'https://<PROJECT_REF>.supabase.co/functions/v1/download-report'
};
```

Reemplaza los marcadores por los valores correspondientes. `CLINIC_ID` puede dejarse vacío cuando el flujo de creación o selección de clínica de la instalación esté preparado para ello.

**Seguridad:** utiliza únicamente la clave pública *Publishable* (o la clave `anon` heredada cuando corresponda) en el frontend. Nunca agregues una clave `service_role`, `sb_secret_...`, contraseñas, tokens administrativos ni credenciales de producción al código del navegador o al repositorio.

## Configuración de Supabase

La aplicación depende de un esquema de base de datos y de funciones del servidor compatibles con la versión utilizada.

1. Crea o prepara el proyecto de Supabase y verifica que las tablas base de EcoReport estén instaladas.
2. Configura el bucket de Storage **`reports` como privado**.
3. Revisa y aplica las migraciones SQL que correspondan a la versión de la base de datos. Haz una copia de seguridad antes de actualizar una instalación existente.
4. Despliega la Edge Function `download-report` a partir de `supabase/download-report.ts` para las descargas PDF mediante QR. Si usas otro proyecto de Supabase, actualiza antes la constante `FUNCTION_URL` de ese archivo con la URL de tu propia función para que los QR no apunten al proyecto original.
5. Para la versión `V5.8.8.11`, ejecuta una sola vez `supabase_v5_8_8_11_admin_backup.sql` sobre una base compatible y despliega la función `owner-admin` desde `supabase/functions/owner-admin/index.ts`.
6. Configura y verifica las políticas RLS, los permisos de Storage y las variables/secretos de las funciones en el entorno de Supabase.
7. Prueba inicio de sesión, aislamiento entre clínicas, informes, descargas QR, administración y restauración de copias usando datos ficticios.

Ejemplo de despliegue de la función administrativa con Supabase CLI:

```bash
supabase functions deploy owner-admin --project-ref <PROJECT_REF>
```

`<PROJECT_REF>` es el identificador de tu proyecto. Mantén activada la autenticación/verificación correspondiente en `owner-admin`: la función está destinada a operaciones del propietario autenticado. La función de descarga QR tiene un flujo distinto, por lo que debes seguir la configuración específica del proyecto y revisar sus implicaciones de seguridad antes de desplegarla.

> **Instalación desde cero:** los SQL de este repositorio incluyen migraciones de distintas etapas y algunos presuponen que ya existen tablas o funciones previas. No ejecutes todos los `.sql` sin comprobar primero el esquema actual y el orden correcto. Para una actualización de `V5.8.8.10` a `V5.8.8.11`, consulta `README-V5.8.8.11.md` y la migración indicada allí.

## Privacidad y seguridad

EcoReport Pro puede manejar datos personales y clínicos sensibles. Para protegerlos:

- No publiques nombres de pacientes, documentos PDF reales, membretes con información privada, capturas con datos clínicos ni copias de seguridad.
- Mantén privado el bucket `reports` y revisa las políticas RLS para impedir el acceso entre clínicas.
- Trata los enlaces y tokens QR como información sensible: compártelos únicamente con las personas autorizadas y deshabilita descargas cuando corresponda.
- Guarda los secretos de las Edge Functions en el entorno de Supabase, nunca en `config.js`.
- Antes de publicar el código, revisa los archivos de configuración para confirmar que no incluyan credenciales, información de pacientes ni identificadores internos que prefieras mantener privados.

## Limitaciones y uso responsable

- Esta versión está en desarrollo y requiere pruebas funcionales y de seguridad en cada entorno de instalación.
- No sustituye el juicio clínico, la revisión del profesional ni los protocolos de la institución.
- El profesional responsable debe revisar la exactitud, integridad y presentación de cada documento antes de firmarlo o entregarlo.
- La organización que lo implemente es responsable de validar el cumplimiento de las normas de privacidad, conservación de registros y uso de software clínico aplicables a su jurisdicción.

## Licencia

Aún no se ha especificado una licencia de código abierto para este proyecto. Hasta que se agregue un archivo `LICENSE`, no debe asumirse permiso para redistribuirlo, modificarlo o utilizarlo comercialmente fuera de los derechos aplicables.

---

**EcoReport Pro · Centro de informes**
