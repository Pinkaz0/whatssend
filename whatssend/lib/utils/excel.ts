import * as XLSX from 'xlsx'

export interface ParsedSheet {
  headers: string[]
  rows: Record<string, string>[]
}

/**
 * Parsea un archivo Excel (.xlsx) y retorna headers + filas.
 * @param buffer ArrayBuffer del archivo subido
 * @returns Headers y filas como objetos clave-valor
 */
export function parseExcelBuffer(buffer: ArrayBuffer): ParsedSheet {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]

  if (!sheetName) {
    throw new Error('El archivo Excel no contiene hojas')
  }

  const sheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: '',
    raw: false,
  })

  if (jsonData.length === 0) {
    throw new Error('La hoja de cálculo está vacía')
  }

  const headers = Object.keys(jsonData[0])

  return { headers, rows: jsonData }
}

/**
 * Campos del contacto que se pueden mapear desde Excel.
 */
export const CONTACT_FIELDS = [
  { key: 'phone', label: 'Teléfono', required: true },
  { key: 'name', label: 'Nombre', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'company', label: 'Empresa', required: false },
] as const

export type ContactFieldKey = typeof CONTACT_FIELDS[number]['key']
