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

DEFAULT_ORIGINS = ",".join([
    "http://localhost:3000",
    "http://localhost:5173",
    "https://whatssend-w6tu.vercel.app",
])
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", DEFAULT_ORIGINS).split(","),
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
                "rut":          resultado.get("rut_cliente", ""),
                "direccion":    resultado.get("direccion", ""),
                "telefono":     resultado.get("telefonos", ""),
                "subtipo":      resultado.get("subtipo", ""),
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
