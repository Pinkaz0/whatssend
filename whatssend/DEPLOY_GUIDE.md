# WhatsSend — Guía de Configuración y Despliegue

## 1. Supabase (Base de Datos)

### 1.1 Crear proyecto
1. Ve a [supabase.com](https://supabase.com) → **New Project**
2. Elige un nombre (ej: `whatssend-prod`) y una contraseña segura
3. Selecciona la región más cercana (ej: `South America - São Paulo`)

### 1.2 Ejecutar migraciones SQL
En **SQL Editor** de Supabase, ejecuta en orden:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_conversations_view.sql
```

> **IMPORTANTE**: `001_initial_schema.sql` crea todas las tablas, RLS policies y realtime.
> `002_conversations_view.sql` crea la vista optimizada del inbox y los índices.

### 1.3 Agregar constraint único para contactos
Ejecuta este SQL adicional para que el **upsert** de contactos funcione:

```sql
ALTER TABLE contacts
  ADD CONSTRAINT unique_workspace_phone UNIQUE (workspace_id, phone);
```

### 1.4 Obtener credenciales
En **Settings → API** copia:
- `NEXT_PUBLIC_SUPABASE_URL` → URL del proyecto
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` → service_role key (**nunca exponerla al cliente**)

---

## 2. UltraMsg (WhatsApp API)

### 2.1 Crear cuenta
1. Ve a [ultramsg.com](https://ultramsg.com)
2. Crea una instancia WhatsApp
3. Escanea el QR con tu teléfono para vincular

### 2.2 Obtener credenciales
En tu panel de UltraMsg → **Instance Settings**:
- **Instance ID** → ej: `instance12345`
- **Token** → ej: `abcdef123456`

### 2.3 Configurar Webhook
En UltraMsg → **Settings → Webhooks**:
- **Webhook URL**: `https://tu-dominio.vercel.app/api/messages/webhook?token=TU_SECRET`
- **Webhook for received messages**: ✅ Activado
- **Events**: Solo `messages` (chat)

> También puedes configurar esto desde la página de **Configuración** dentro de WhatsSend.

---

## 3. Variables de Entorno

### Para desarrollo local (`.env.local`)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# UltraMsg (fallback para webhook si no hay workspace configurado)
ULTRAMSG_INSTANCE_ID=instance12345
ULTRAMSG_TOKEN=abcdef123456
ULTRAMSG_WEBHOOK_SECRET=mi-secret-seguro

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Para Vercel (producción)
Las mismas variables, pero con valores de producción.

---

## 4. Configuración Git (para Vercel)

Si aún no has inicializado el repositorio Git:

1. **Inicializar repo**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Subir a GitHub** (Recomendado):
   - Crea un nuevo repo vacío en GitHub
   - Sigue las instrucciones para pushear tu código existente:
     ```bash
     git remote add origin https://github.com/TU_USUARIO/whatssend.git
     git branch -M main
     git push -u origin main
     ```

---

## 5. Vercel (Despliegue)

### 4.1 Importar proyecto
1. Ve a [vercel.com](https://vercel.com) → **Add New → Project**
2. Importa tu repositorio de GitHub
3. Framework preset: **Next.js** (auto-detectado)
4. Root directory: `whatssend`

### 4.2 Configurar variables de entorno
En **Settings → Environment Variables**, agrega TODAS las variables listadas arriba.

> **IMPORTANTE**: `SUPABASE_SERVICE_ROLE_KEY` debe estar en las env vars de Vercel pero NUNCA con prefijo `NEXT_PUBLIC_`.

### 4.3 Desplegar
1. Click **Deploy**
2. Vercel hará `npm run build` automáticamente
3. Una vez desplegado, copia la URL del dominio (ej: `whatssend-xx.vercel.app`)
4. Usa esa URL para configurar el webhook de UltraMsg

### 4.4 Dominio personalizado (opcional)
En **Settings → Domains** agrega tu dominio y configura los DNS.

---

## 5. Primer Uso

### 5.1 Registrar usuario
1. Ve a `/register` y crea tu cuenta
2. Verifica tu email (Supabase envía un correo de confirmación)

### 5.2 Configurar workspace
1. Ve a `/settings`
2. Ingresa el nombre de tu workspace
3. Pega tu **Instance ID** y **Token** de UltraMsg
4. (Opcional) Configura **Google Account Email** y **Private Key** para la integración con Sheets
5. Click **Probar Conexión** (UltraMsg)
6. Click **Guardar Configuración**
6. Copia la **Webhook URL** y configúrala en UltraMsg

### 5.3 Probar flujo completo
1. **Recibir mensaje**: Envía un WhatsApp desde un teléfono real al número de UltraMsg → debe aparecer en `/inbox`
2. **Enviar mensaje**: Desde `/inbox`, selecciona la conversación y responde → debe llegar al WhatsApp
3. **Importar contactos**: Ve a `/contacts` → **Importar Excel** → sube un .xlsx con columna de teléfonos
4. **Crear campaña**: Ve a `/campaigns` → **Nueva Campaña** → selecciona contactos → enviar

---

## 6. Estructura de Archivos Clave

```
whatssend/
├── app/
│   ├── api/
│   │   ├── messages/webhook/route.ts    ← Webhook UltraMsg (idempotente + bot)
│   │   ├── messages/send/route.ts       ← Envío manual desde inbox
│   │   ├── campaigns/send/route.ts      ← Envío de campañas
│   │   └── settings/test-connection/    ← Test credenciales UltraMsg
│   └── (dashboard)/
│       ├── inbox/page.tsx               ← Bandeja de entrada
│       ├── contacts/page.tsx            ← Lista + importación
│       ├── templates/page.tsx           ← Plantillas con variables
│       ├── campaigns/page.tsx           ← Campañas masivas
│       ├── bot/page.tsx                 ← Reglas auto-respuesta
│       ├── analytics/page.tsx           ← Gráficas y métricas
│       └── settings/page.tsx            ← Config UltraMsg
├── hooks/                               ← TanStack Query hooks
├── components/                          ← UI components
├── lib/ultramsg/client.ts              ← API wrapper UltraMsg
├── lib/utils/phone.ts                  ← Normalización E.164
├── stores/                             ← Zustand stores
└── supabase/migrations/                ← SQL schemas
```

---

## 7. Notas Importantes

- **Throttling**: El envío de campañas tiene un delay de 1.5s entre mensajes. UltraMsg puede limitar mensajes si envías demasiado rápido.
- **RLS**: Todas las tablas tienen Row Level Security. El webhook usa `service_role` key para bypass.
- **Polling**: El inbox usa polling (6s para lista de chats, 3s para mensajes activos). Para Realtime con Supabase subscriptions, se puede migrar después.
- **Bot**: Las reglas se evalúan de menor a mayor prioridad. Solo la primera coincidencia responde.
