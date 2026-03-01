# WhatsVentas CRM — Guía de Integración Completa
**Humaware Studio · Para: Cursor AI / Desarrollador**

---

## ÍNDICE

1. [Prompt para Cursor — Cambios UX del Dashboard](#1-prompt-cursor-ux)
2. [Arquitectura de Integración](#2-arquitectura)
3. [Paso a paso: Convertir Script TOA en API](#3-api-toa)
4. [Actualización de Credenciales TOA](#4-credenciales)
5. [Integración con el CRM (Frontend → Backend)](#5-integracion-crm)
6. [Lógica Super Agente: Consulta Dirección vía WhatsApp](#6-consulta-direccion-whatsapp)
7. [Variables de Entorno y Configuración](#7-env)
8. [Orden de Deploy en VPS Hetzner](#8-deploy)

---

## 1. PROMPT CURSOR — CAMBIOS UX DEL DASHBOARD

> Copia este bloque completo y pégalo en Cursor como contexto antes de comenzar.

---

```
Eres un experto en UX/UI y desarrollo React con 10+ años de experiencia.
Voy a describir los cambios que necesito aplicar sobre el CRM WhatsVentas.
El proyecto usa React + Tailwind CSS con tema dark (#07090F base).

CAMBIOS A IMPLEMENTAR:

════════════════════════════════════════
[MÓDULO: REGISTRO DE VENTAS]
════════════════════════════════════════

1. SELECTOR DE TIPO DE VENTA (3 opciones, visualmente como 3 botones):
   - "Código BO"          → color #10b981 (verde)  — venta nueva con código BO N°XXXX
   - "Reemisión de Venta" → color #f59e0b (ámbar)  — reemplazo de orden cancelada
   - "Biometría en Calle" → color #a78bfa (violeta) — técnico hace proceso in situ

2. CAMPO DINÁMICO según tipo seleccionado:
   - Si "Código BO"        → mostrar input "Código BO *"           placeholder: "BO N°Q1234"
   - Si "Reemisión"        → mostrar input "Nº Orden Cancelada *"  placeholder: "Nº orden cancelada"
   - Si "Biometría en Calle" → NO mostrar campo adicional (campo vacío, proceso lo hace el técnico)

3. VALIDACIÓN OBLIGATORIA (modal nueva venta y modal editar):
   - RUT Cliente:             SIEMPRE obligatorio
   - Dirección Instalación:   SIEMPRE obligatoria  ← (NO Dirección Limpia)
   - Dirección Limpia:        opcional
   - Código BO:               obligatorio solo si tipo = "Código BO"
   - Nº Orden Cancelada:      obligatorio solo si tipo = "Reemisión de Venta"
   - Biometría en Calle:      sin campo adicional obligatorio
   - Todos los demás campos:  opcionales

4. CAMPOS DEL FORMULARIO (orden exacto):
   [Selector Tipo de Venta]
   [Campo dinámico BO / Orden Cancelada según tipo]
   RUT Cliente *
   Nombre Cliente
   Dirección Instalación *  (con depto/piso/block — campo OBLIGATORIO)
   Dirección Limpia         (sin depto/piso — opcional)
   Comuna
   Región
   Servicio que Contrata
   Servicio Adicional
   Promoción
   Ejecutivo
   Supervisor
   Contacto Instalación
   Fono
   Ciclo de Pago
   Correo

5. CARDS en pantalla Registro de Ventas:
   - Badge tipo con color del tipo seleccionado (verde/ámbar/violeta)
   - Badge estado: "✓ Enviada" (verde) o "Pendiente" (ámbar)
   - Código BO o Nº Cancelada en fuente monospace con color del tipo
   - Si tipo "Biometría en Calle" → mostrar "Biometría en calle" en el campo de código
   - Click en card → modal detalle con todos los campos en modo lectura
   - Modal detalle tiene 3 botones: [Editar] [Reenviar] [Enviar al BI]

6. BOTÓN "Nueva venta manual":
   - Card punteada al final del grid que abre el modal de formulario vacío

════════════════════════════════════════
[MÓDULO: GESTIÓN DE VENTAS (SEGUIMIENTO)]
════════════════════════════════════════

7. BOTÓN "Agregar Venta" → modal SIMPLIFICADO:
   - Un solo campo: Número de Orden (solo números, mínimo 6 dígitos)
   - Placeholder: "Ej: 1233441422"
   - Al guardar → loading "Consultando TOA..." con spinner
   - El sistema llama automáticamente a la API TOA con ese número
   - Cuando responde → crear fila en la tabla con los datos extraídos
   - Si error → mostrar mensaje de error en el modal
   - Endpoint: POST /api/toa/consultar  body: { "orden": "1233441422" }

8. COLUMNAS DE LA TABLA (en este orden, con emojis en header):
   🔢 Orden | 👤 Cliente / RUT | 📌 Fibra | 📊 Estado TOA |
   📅 Fecha Agenda | ⏰ Bloque | 🚪 Ventana | 🛠️ Técnico |
   🗒️ Obs. | Acciones

9. BOTONES DE ACCIÓN por fila (con tooltip title descriptivo):
   👁️  Ver TOA            → sky/azul      — muestra modal con resumen TOA completo
   🔄  Actualizar TOA     → emerald/verde  — re-consulta TOA para esa orden (spinner durante consulta)
   📤  Notificar cliente  → violet/violeta — envía mensaje WhatsApp al cliente
   📅  Reagendar BA       → amber/ámbar    — SOLO visible si estado = "NO REALIZADA"
   📧  Enviar venta al BI → teal/verde-azul — envía formato de venta al backoffice ingreso

10. LEYENDA debajo de la tabla:
    Fila horizontal con cada botón, su color y descripción.
    Formato: [ícono con fondo de color] "Descripción"

11. MODAL VER TOA — mostrar exactamente estos campos con emojis:
    🔢 Orden | 📊 Estado | 👤 Cliente | 📍 Dirección | 📞 Teléfonos |
    📆 Fecha Emisión | 📅 Fecha Agenda | ⏰ Bloque Horario | 🚪 Ventana Llegada |
    📌 Fibra | 🗒️ Observaciones | 🛠️ Técnico
    Footer del modal: [Reagendar BA] (solo si NO REALIZADA) + [Notificar Cliente]

════════════════════════════════════════
[MÓDULO: BANDEJA DE ENTRADA]
════════════════════════════════════════

12. LAYOUT 3 columnas — igual a WhatsApp Web:
    Col 1 (260px fija):  Lista de conversaciones
    Col 2 (flex-1):      Chat activo
    Col 3 (240px fija):  Perfil del contacto (toggle al hacer click en el nombre)

13. HEADERS FIJOS en cada columna (no hacen scroll):
    Col 1: título "Bandeja" + contador + filtros tabs "Todos / No leídos"
    Col 2: avatar + nombre + estado venta badge + botón menú
    Col 3: "Perfil" + botón X para cerrar
    → Solo el contenido interior de cada columna hace scroll

14. PANEL DERECHO (Perfil):
    - Se abre al hacer CLICK en el NOMBRE del contacto en el header del chat central
    - Se cierra con el botón X
    - Contenido: avatar, nombre, número, y datos de la venta asociada
      (Plan, Orden, RUT, Fecha Agenda, Técnico, Estado badge)
    - NO incluir botones de acción del super agente aquí

15. NO hay acciones de factibilidad en el CRM para el ejecutivo.
    La consulta de dirección/factibilidad se hace ÚNICAMENTE a través del
    Super Agente enviando un mensaje de WhatsApp al Backoffice de Prechequeo (BP).

════════════════════════════════════════
[MÓDULO: PANEL DE CONTROL]
════════════════════════════════════════

16. Layout en 2 columnas inferiores:
    Izquierda: Resumen estados de ventas con barras de progreso por estado
    Derecha:   Alertas que requieren atención (NO REALIZADA, pendientes, mensajes sin leer)

17. Las alertas tienen flecha/link para navegar a Ventas o Bandeja directamente

18. ELIMINAR del Panel estas acciones rápidas:
    ❌ Refrescar estado de todas las órdenes
    ❌ Subir ventas desde archivo
    ❌ Formato de venta a Backoffice Ingreso
    ❌ Iniciar Super Agente Movistar

════════════════════════════════════════
[NAVEGACIÓN / SIDEBAR]
════════════════════════════════════════

19. SECCIONES DEL SIDEBAR (orden exacto):
    Panel
    Bandeja       (badge con mensajes no leídos)
    Ventas        (badge con órdenes activas)
    Registro Ventas
    Campañas & Plantillas   ← FUSIONADAS en una sola sección con tabs
    Contactos
    Super Agente
    Analíticas
    ────────────
    Configuración  (footer)

    ❌ ELIMINAR: "Consulta de Dirección" del sidebar
       (la consulta de dirección es función del Super Agente, no del ejecutivo)

20. Campañas y Plantillas fusionadas:
    Una sola sección con dos tabs internos: [Campañas] [Plantillas]

════════════════════════════════════════
[CONFIGURACIÓN]
════════════════════════════════════════

21. SECCIÓN "Backoffices":
    Tres campos de número/correo:
    - BP Prechequeo  → número WhatsApp para consultas RUT + Biometría
    - BI Ingreso     → correo/número para formatos de venta
    - BA Agenda      → número WhatsApp para reagendamientos
    Estos números son los que el Super Agente usa al ejecutar las acciones.

════════════════════════════════════════
[DISEÑO VISUAL]
════════════════════════════════════════

22. PALETA:
    Background base:  #07090F
    Cards/panels:     #0C0F1A
    Borders:          #141928
    Borders hover:    #1E2537
    Accent:           #10b981 (emerald-500)
    Sombra accent:    shadow-emerald-500/20

23. Tipografía: 'Instrument Sans' o 'DM Sans', fallback system-ui
24. Scrollbars: width 4px, thumb #1E2537, hover #2A3347
25. Botones primarios: bg-emerald-500 + shadow-lg shadow-emerald-500/20
26. Badges siempre con: bg/10 + text + border/20 (nunca colores sólidos)
```

---

## 2. ARQUITECTURA DE INTEGRACIÓN

```
┌──────────────────────────────────────────────────────────┐
│                   WHATSVENTAS CRM                         │
│             React Frontend (Vite / Next.js)               │
└──────────────────┬───────────────────────────────────────┘
                   │ HTTP fetch
        ┌──────────▼──────────┐
        │   FastAPI Backend    │
        │   api_server.py      │
        │   Puerto: 8000       │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │   TOA Script        │
        │   Selenium + Chrome  │
        │   (scraping interno) │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  TOA Movistar CTC   │
        │  (sistema interno)  │
        └─────────────────────┘

Consulta Dirección / Factibilidad:
        ┌────────────────────────────────────────┐
        │        Super Agente WhatsApp           │
        │  (n8n / LangChain + Evolution API)     │
        │                                        │
        │  Ejecutivo pide → Agente reenvía       │
        │  mensaje a BP (BackOffice Prechequeo)  │
        │  vía WhatsApp → BP responde            │
        │  → Agente retransmite al ejecutivo     │
        └────────────────────────────────────────┘

⚠️  ConsultaFact.py ELIMINADO del flujo CRM:
    Requiere VPN — no accesible desde todos los usuarios.
    La consulta de dirección se delega al Backoffice a través del Super Agente.
```

---

## 3. PASO A PASO: CONVERTIR SCRIPT TOA EN API

### 3.1 Crear `api_server.py`

```python
# api_server.py
# Coloca este archivo en la misma carpeta que actseguimiento_final_ok_COMPLETO_FUNCIONAL.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn, sys, os
from dotenv import load_dotenv

load_dotenv()  # Carga .env con credenciales TOA

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from actseguimiento_final_ok_COMPLETO_FUNCIONAL import (
    lock_and_run,
    verificar_bloqueos_huerfanos
)

app = FastAPI(title="WhatsVentas API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── MODELOS ──────────────────────────────────────────────

class OrdenRequest(BaseModel):
    orden: str

# ─── ENDPOINTS TOA ────────────────────────────────────────

@app.post("/api/toa/consultar")
async def consultar_toa(req: OrdenRequest):
    """
    Consulta una orden en TOA Movistar.
    Retorna todos los campos para el CRM.
    """
    try:
        verificar_bloqueos_huerfanos()
        resultado = lock_and_run(req.orden.strip())

        if resultado.get("estado") == "Error":
            raise HTTPException(
                status_code=422,
                detail=resultado.get("observacion", "Error al consultar TOA")
            )

        return {
            "ok": True,
            "datos": {
                "orden":        resultado.get("orden", ""),
                "estado":       resultado.get("estado", "PENDIENTE"),
                "cliente":      resultado.get("cliente", ""),
                "rut":          resultado.get("rut", ""),          # extender si TOA lo expone
                "direccion":    resultado.get("direccion", ""),
                "telefono":     resultado.get("telefono", ""),     # extender si TOA lo expone
                "fechaEmision": resultado.get("fecha_emision", ""),
                "fechaAgenda":  resultado.get("fecha_agenda", ""),
                "bloque":       resultado.get("bloque_horario", ""),
                "ventana":      resultado.get("ventana_llegada", ""),
                "fibra":        resultado.get("fibra", ""),
                "obs":          resultado.get("observacion", ""),
                "tecnico":      resultado.get("tecnico", ""),
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error TOA: {str(e)}")


@app.post("/api/toa/consultar-multiple")
async def consultar_multiple(ordenes: list[str]):
    """
    Actualiza múltiples órdenes en secuencia.
    Úsalo para el botón 'Actualizar Todo TOA'.
    """
    resultados = []
    for orden in ordenes:
        try:
            res = lock_and_run(orden.strip())
            resultados.append({"orden": orden, "ok": True, "datos": res})
        except Exception as e:
            resultados.append({"orden": orden, "ok": False, "error": str(e)})
    return {"resultados": resultados}


# ─── HEALTHCHECK ──────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"ok": True, "status": "WhatsVentas API corriendo"}


if __name__ == "__main__":
    uvicorn.run(
        app,
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", "8000")),
        reload=False
    )
```

### 3.2 Instalar dependencias

```bash
pip install fastapi uvicorn python-dotenv python-multipart --break-system-packages
```

### 3.3 Iniciar el servidor

```bash
# Desarrollo
python api_server.py

# Producción con PM2
pm2 start "python3 api_server.py" --name whatsventas-api
pm2 save && pm2 startup
```

---

## 4. ACTUALIZACIÓN DE CREDENCIALES TOA

En `actseguimiento_final_ok_COMPLETO_FUNCIONAL.py`, **líneas ~108-109**, cambiar:

```python
# ❌ ANTES — credenciales hardcodeadas:
username.send_keys("26300136")
password.send_keys("Pinky1912$$")

# ✅ DESPUÉS — desde variables de entorno:
import os
username.send_keys(os.getenv("TOA_USERNAME", ""))
password.send_keys(os.getenv("TOA_PASSWORD", ""))
```

También agregar al inicio del script (línea 1 aproximadamente):

```python
from dotenv import load_dotenv
load_dotenv()
```

> ⚠️ Agregar `.env` al `.gitignore` — nunca commitear credenciales.

---

## 5. INTEGRACIÓN CON EL CRM (Frontend → Backend)

### 5.1 Crear `src/services/api.js`

```javascript
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

// ─── TOA ──────────────────────────────────────────────────────────────

/**
 * Consulta una orden en TOA y retorna todos sus datos.
 * Se usa al "Agregar Venta" y al "Actualizar TOA" por fila.
 */
export async function consultarTOA(numeroOrden) {
  const res = await fetch(`${BASE_URL}/api/toa/consultar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orden: String(numeroOrden).trim() })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${res.status} consultando TOA`)
  }
  return res.json()
  // Retorna: { ok: true, datos: { orden, estado, cliente, rut, direccion,
  //            telefono, fechaEmision, fechaAgenda, bloque, ventana,
  //            fibra, obs, tecnico } }
}

/**
 * Actualiza múltiples órdenes en secuencia.
 * Se usa en el botón "Actualizar Todo TOA".
 */
export async function actualizarTodosToA(ordenes) {
  const res = await fetch(`${BASE_URL}/api/toa/consultar-multiple`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ordenes)
  })
  return res.json()
  // Retorna: { resultados: [{ orden, ok, datos? error? }] }
}
```

### 5.2 Modal "Agregar Venta" — conectar con TOA

```javascript
// ModalAgregarVenta.jsx
import { consultarTOA } from "../services/api"

const handleGuardar = async () => {
  if (!valid) return
  setLoading(true)
  setError("")

  try {
    const response = await consultarTOA(orden)

    if (response.ok) {
      onVentaAgregada(response.datos)   // callback al componente padre
      onClose()
    } else {
      setError("TOA no encontró datos para esa orden")
    }
  } catch (err) {
    setError(err.message || "Error de conexión con el servidor")
  } finally {
    setLoading(false)
  }
}
```

### 5.3 Botón "Actualizar TOA" por fila

```javascript
// VentasView.jsx
import { consultarTOA } from "../services/api"

const handleActualizarTOA = async (orden) => {
  setUpdating(orden)
  try {
    const response = await consultarTOA(orden)
    if (response.ok) {
      setVentas(prev =>
        prev.map(v => v.orden === orden ? { ...v, ...response.datos } : v)
      )
    }
  } catch (err) {
    console.error("Error actualizando TOA:", err.message)
  } finally {
    setUpdating(null)
  }
}
```

---

## 6. LÓGICA SUPER AGENTE: CONSULTA DIRECCIÓN VÍA WHATSAPP

**La consulta de factibilidad/dirección no se hace en el CRM directamente.**
Requiere VPN y no es accesible para todos los usuarios.

### Flujo diseñado:

```
Ejecutivo (WhatsApp o CRM)
    │
    │  "Consultar dirección: Av. Providencia 1234, Santiago"
    ▼
Super Agente (n8n / LangChain)
    │
    │  Detecta intención: consulta_factibilidad
    │  Extrae: calle, número, comuna, región
    ▼
Evolution API → Envía mensaje a BP (Backoffice Prechequeo)
    │
    │  Mensaje formateado:
    │  "Consulta factibilidad:
    │   📍 Av. Providencia 1234, Santiago
    │   🏘️ Providencia, Región Metropolitana
    │   Cliente: [nombre] RUT: [rut]"
    ▼
Backoffice Prechequeo (operador con acceso VPN)
    │
    │  Consulta el sistema CTC desde su equipo
    │  Responde por WhatsApp al agente
    ▼
Super Agente recibe la respuesta del BP
    │
    │  Parsea: disponible / no disponible / velocidad
    ▼
Ejecutivo recibe resultado en su chat
```

### Implementación en n8n (nodo "Enviar a BP"):

```javascript
// Nodo Function en n8n — preparar mensaje para BP
const direccion = $json.direccion_extraida  // extraída por el LLM del mensaje del ejecutivo
const cliente   = $json.nombre_cliente || ""
const rut       = $json.rut_cliente || ""
const ejecutivo = $json.ejecutivo_nombre || "Ejecutivo"

const mensaje = `📋 *CONSULTA FACTIBILIDAD*
Solicitado por: ${ejecutivo}

📍 *Dirección:* ${direccion}
👤 *Cliente:* ${cliente}
🪪 *RUT:* ${rut}

Por favor confirmar disponibilidad fibra y velocidad máxima.`

return [{ json: { mensaje, numero_bp: $env.BP_NUMERO_WHATSAPP } }]
```

### Configuración en la sección de Backoffices del CRM:

En la pantalla **Configuración → Backoffices**, guardar:

| Campo | Descripción | Usado por |
|-------|-------------|-----------|
| BP Prechequeo | Número WhatsApp del operador BP | Consulta dirección + RUT + Biometría |
| BI Ingreso | Correo o número de Backoffice Ingreso | Envío de formatos de venta |
| BA Agenda | Número WhatsApp de Backoffice Agenda | Reagendamientos NO REALIZADOS |

Estos valores se leen desde la configuración del CRM y el Super Agente los usa al ejecutar cada acción. En el backend se guardan en la DB o en un archivo de configuración.

---

## 7. VARIABLES DE ENTORNO

### Backend — `.env`
```bash
# Credenciales TOA
TOA_USERNAME=TU_USUARIO_TOA_NUEVO
TOA_PASSWORD=TU_PASSWORD_TOA_NUEVA

# Servidor API
API_HOST=0.0.0.0
API_PORT=8000

# CORS (separar por comas)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://whatsventas.tudominio.com

# Backoffices (opcional — también se pueden guardar en DB)
BP_NUMERO_WHATSAPP=56912345678
BA_NUMERO_WHATSAPP=56987654321
BI_CORREO=backoffice.ingreso@movistar.cl
```

### Frontend — `.env.local`
```bash
VITE_API_URL=http://localhost:8000
```

### Frontend — `.env.production`
```bash
VITE_API_URL=https://crm-api.empathaiapp.net
```

---

## 8. ORDEN DE DEPLOY EN VPS HETZNER

El VPS `89.167.104.163` ya tiene Docker + Nginx + SSL con Evolution API en `api.empathaiapp.net`. La API del CRM va en el mismo servidor.

```bash
# 1. Crear carpeta del proyecto
ssh deploy@89.167.104.163
mkdir -p /opt/whatsventas && cd /opt/whatsventas

# 2. Subir archivos desde tu máquina local
scp actseguimiento_final_ok_COMPLETO_FUNCIONAL.py deploy@89.167.104.163:/opt/whatsventas/
scp api_server.py deploy@89.167.104.163:/opt/whatsventas/

# 3. Crear .env con credenciales
nano .env  # pegar variables de la sección 7

# 4. Instalar dependencias
pip3 install fastapi uvicorn python-dotenv selenium webdriver-manager python-multipart --break-system-packages

# 5. Verificar que Chrome/Chromium está instalado (para Selenium)
google-chrome --version || chromium --version
# Si no está: apt install chromium-browser -y

# 6. Probar que la API funciona
python3 api_server.py &
curl http://localhost:8000/api/health
# Esperado: {"ok":true,"status":"WhatsVentas API corriendo"}

# 7. Configurar PM2
pm2 start "python3 /opt/whatsventas/api_server.py" --name whatsventas-api
pm2 save && pm2 startup

# 8. Configurar Nginx
nano /etc/nginx/sites-available/crm-api.empathaiapp.net
```

```nginx
# /etc/nginx/sites-available/crm-api.empathaiapp.net
server {
    listen 80;
    server_name crm-api.empathaiapp.net;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name crm-api.empathaiapp.net;

    ssl_certificate /etc/letsencrypt/live/crm-api.empathaiapp.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crm-api.empathaiapp.net/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 120s;   # TOA puede tardar ~30-60s
        proxy_connect_timeout 10s;
    }
}
```

```bash
# 9. Activar y obtener SSL
ln -s /etc/nginx/sites-available/crm-api.empathaiapp.net /etc/nginx/sites-enabled/
certbot --nginx -d crm-api.empathaiapp.net
nginx -t && systemctl reload nginx
```

---

## MAPEO COMPLETO: CAMPOS TOA → CRM

| Campo en script `resultado`  | Campo en CRM               | Columna tabla Ventas  |
|------------------------------|----------------------------|-----------------------|
| `resultado["orden"]`         | `venta.orden`              | 🔢 Orden              |
| `resultado["estado"]`        | `venta.estado`             | 📊 Estado             |
| `resultado["cliente"]`       | `venta.cliente`            | 👤 Cliente            |
| *(extender en script)*       | `venta.rut`                | 👤 RUT (sub-fila)     |
| `resultado["direccion"]`     | `venta.direccion`          | 📍 Dirección          |
| *(extender en script)*       | `venta.telefono`           | 📞 Teléfonos          |
| `resultado["fecha_emision"]` | `venta.fechaEmision`       | 📆 Fecha Emisión      |
| `resultado["fecha_agenda"]`  | `venta.fechaAgenda`        | 📅 Fecha Agenda       |
| *(extender en script)*       | `venta.bloque`             | ⏰ Bloque             |
| *(extender en script)*       | `venta.ventana`            | 🚪 Ventana Llegada    |
| `resultado["fibra"]`         | `venta.fibra`              | 📌 Fibra              |
| `resultado["observacion"]`   | `venta.obs`                | 🗒️ Observaciones     |
| `resultado["tecnico"]`       | `venta.tecnico`            | 🛠️ Técnico           |

> Los campos marcados como "extender en script" requieren agregar su extracción
> dentro de `consultar_orden_toa()` en el script TOA, siguiendo el mismo patrón
> de extracción ya implementado para `cliente`, `estado`, `tecnico`, etc.

---

## RESUMEN DE ARCHIVOS

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `api_server.py` | **CREAR** | FastAPI wrapper del script TOA |
| `.env` | **CREAR** | Credenciales TOA + config servidor |
| `actseguimiento...py` | **MODIFICAR 2 líneas** | Leer credenciales desde `.env` |
| `src/services/api.js` | **CREAR** | Servicio HTTP frontend → API |
| `src/components/ModalAgregarVenta.jsx` | **MODIFICAR** | Solo número de orden → auto-fetch |
| `src/views/VentasView.jsx` | **MODIFICAR** | Conectar botón "Actualizar TOA" |
| `.env.local` | **CREAR** | URL de la API para el frontend |
| `.gitignore` | **MODIFICAR** | Agregar `.env`, `lock.tmp`, `__pycache__` |
| ~~`ConsultaFact.py`~~ | **NO SE USA** | Requiere VPN — flujo delegado a Super Agente vía WhatsApp |

---

*Humaware Studio · WhatsVentas CRM v5.0*
*TOA Script: actseguimiento_final_ok_COMPLETO_FUNCIONAL.py — operativo ✅*
*Factibilidad: delegada al Super Agente vía WhatsApp BP ✅*
