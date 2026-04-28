import Papa from 'papaparse'
import { z } from 'zod'

export interface CSVParseResult<T> {
  data: T[]
  errors: CSVRowError[]
  meta: Papa.ParseMeta
}

export interface CSVRowError {
  row: number
  message: string
  field?: string
}

export function parseCSV<T extends z.ZodSchema>(
  csvContent: string,
  schema: T,
  requiredFields?: string[]
): CSVParseResult<z.infer<T>> {
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  })

  const errors: CSVRowError[] = []
  const validData: (z.infer<T>)[] = []

  result.data.forEach((row: any, index: number) => {
    try {
      const normalizedRow: any = {}
      Object.keys(row).forEach((key) => {
        const value = row[key]
        if (typeof value === 'string') {
          const trimmed = value.trim()
          if (trimmed === 'true') normalizedRow[key] = true
          else if (trimmed === 'false') normalizedRow[key] = false
          else if (trimmed !== '') normalizedRow[key] = trimmed
        } else {
          normalizedRow[key] = value
        }
      })

      const parsed = schema.parse(normalizedRow)
      validData.push(parsed)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.errors.map((e) => e.path.join('.')).join(', ')
        errors.push({
          row: index + 2,
          message: `Error de validación: ${fieldErrors}`,
        })
      } else {
        errors.push({
          row: index + 2,
          message: 'Error desconocido',
        })
      }
    }
  })

  if (requiredFields) {
    const headers = result.meta.fields || []
    const missingFields = requiredFields.filter((f) => !headers.includes(f.toLowerCase()))
    if (missingFields.length > 0) {
      errors.unshift({
        row: 0,
        message: `Campos requeridos faltantes: ${missingFields.join(', ')}`,
      })
    }
  }

  return {
    data: validData,
    errors,
    meta: result.meta,
  }
}

export function generateCSVTemplate(headers: string[]): string {
  return headers.join(',') + '\n'
}

export function arrayToCSV<T>(data: T[], headers: (keyof T)[]): string {
  const headerRow = headers.join(',')
  const rows = data.map((item) =>
    headers.map((h) => {
      const value = item[h]
      if (value === null || value === undefined) return ''
      const str = String(value)
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str
    }).join(',')
  )
  return [headerRow, ...rows].join('\n')
}
