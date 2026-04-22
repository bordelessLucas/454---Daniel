import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeFilename(filename: string) {
  return filename
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeFilenamePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function buildRelatorioPdfFilename(clientName: string, dateStr: string) {
  const client = normalizeFilenamePart(clientName || 'Cliente')
  const reportDate = normalizeFilenamePart(dateStr || 'Data')
  return sanitizeFilename(`Relatorio_${client}_${reportDate}.pdf`)
}

export function downloadBlobFile(blob: Blob, filename: string) {
  if (!blob || blob.size === 0) {
    throw new Error('Arquivo inválido para download.')
  }

  const safeFilename = sanitizeFilename(filename || 'download.bin')
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = safeFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(objectUrl)
}
