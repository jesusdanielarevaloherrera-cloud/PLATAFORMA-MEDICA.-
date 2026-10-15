window.ECOREPORT_CONFIG = {
  // Tu proyecto ya creado en Supabase.
  SUPABASE_URL: 'https://qlurmnuyhqdlruqqjvip.supabase.co',

  // Pega aquí la Publishable key (o anon key legacy) de Supabase.
  // NUNCA pongas service_role ni una secret key en este archivo.
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_lru-QQ0ZOTWUzOxgzVRetg__L5ujgEf',

  // Opcional: si ya creaste una clínica, pega aquí su UUID.
  // Si lo dejas vacío, EcoReport puede ayudarte a crear una clínica
  // después de iniciar sesión, usando la función RPC del SQL de V5.
  CLINIC_ID: 'cd44d505-f9e5-44d9-a6f6-2e6260aaa738',

  STORAGE_BUCKET: 'reports',
  DOWNLOAD_FUNCTION_URL: 'https://qlurmnuyhqdlruqqjvip.supabase.co/functions/v1/download-report'
};
