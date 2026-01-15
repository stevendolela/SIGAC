export interface ImportDocumentRecord {
  NumeroDossier: string;
  NomFichier: string;
  TypeDocument: string;
  UrlDocument?: string;
  Base64Content?: string;
  Description?: string;
  EstConfidentiel: boolean;
}

export interface BulkImportDocumentsDto {
  Documents: ImportDocumentRecord[];
}

export interface BulkImportDocumentsResultDto {
  success: boolean;
  message: string;
  documentsCreated: number;
  documentsFailed: number;
  documentsCreatedNames: string[];
  errors: string[];
}
