export interface DocumentDto {
  id: string
  dossierId: string
  nomFichier: string
  cheminFichier: string
  typeDocument: string
  tailleFichier: number
  mimeType: string
  numeroVersion: number
  estConfidentiel: boolean
  hashSHA256: string
  uploadedBy: string
  uploadedAt: string // ISO
}
