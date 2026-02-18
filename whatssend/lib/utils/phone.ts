import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'

/**
 * Normaliza un número de teléfono a formato E.164.
 * @param input Número en cualquier formato (ej: "011-1234-5678", "+54 11 1234-5678")
 * @param defaultCountry Código de país por defecto (ej: 'CL', 'AR')
 * @returns Número normalizado en E.164 (ej: "+5491112345678") o null si es inválido
 */
export function normalizePhone(
  input: string,
  defaultCountry: CountryCode = 'CL'
): string | null {
  if (!input || typeof input !== 'string') return null

  // Limpiar caracteres extra
  const cleaned = input.trim()

  const phone = parsePhoneNumberFromString(cleaned, defaultCountry)

  if (!phone || !phone.isValid()) {
    return null
  }

  return phone.format('E.164')
}

/**
 * Extrae un número de teléfono desde el formato UltraMsg webhook.
 * UltraMsg envía números como "5491112345678@c.us"
 */
export function extractPhoneFromUltraMsg(from: string): string {
  // Remover sufijo @c.us o @s.whatsapp.net
  const raw = from.split('@')[0]
  // Agregar prefijo + para E.164
  return `+${raw}`
}

/**
 * Formatea un teléfono E.164 para mostrar en UI.
 * @param phone Número E.164 (ej: "+56912345678")
 * @returns Formato legible (ej: "+56 9 1234 5678")
 */
export function formatPhoneDisplay(phone: string): string {
  const parsed = parsePhoneNumberFromString(phone)
  if (!parsed) return phone
  return parsed.formatInternational()
}
