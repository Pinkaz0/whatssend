export interface RegistroVenta {
  id: string
  workspace_id: string
  tipo: 'bo' | 'reemision' | 'biometria'
  bo: string | null
  rut: string
  nombre: string | null
  direccion_limpia: string | null
  direccion_inst: string
  comuna: string | null
  region: string | null
  servicio: string | null
  adicional: string | null
  promo: string | null
  ejecutivo: string | null
  supervisor: string | null
  contacto: string | null
  fono: string | null
  ciclo: string | null
  correo: string | null
  estado: 'pendiente_envio' | 'enviada' | 'fallida'
  fecha: string | null
  created_at: string
}
