/**
 * Utilitaires pour la manipulation de fichiers
 */

/**
 * Convertit un fichier en chaîne Base64 (data URI)
 * @param file Fichier à convertir
 * @returns Promise avec la chaîne Base64 (format: "data:image/png;base64,...")
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Valide qu'un fichier est une image
 * @param file Fichier à valider
 * @returns true si le fichier est une image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Valide la taille d'un fichier
 * @param file Fichier à valider
 * @param maxSizeMB Taille maximum en MB (défaut: 5MB)
 * @returns true si le fichier est sous la limite
 */
export const isValidFileSize = (file: File, maxSizeMB: number = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Valide qu'un fichier est une image valide avec taille appropriée
 * @param file Fichier à valider
 * @param maxSizeMB Taille maximum en MB (défaut: 5MB)
 * @returns Objet avec isValid et errorMessage
 */
export const validateImageFile = (
  file: File,
  maxSizeMB: number = 5
): { isValid: boolean; errorMessage?: string } => {
  if (!isImageFile(file)) {
    return {
      isValid: false,
      errorMessage: 'Le fichier doit être une image (PNG, JPG, GIF, etc.)',
    };
  }

  if (!isValidFileSize(file, maxSizeMB)) {
    return {
      isValid: false,
      errorMessage: `La taille du fichier ne doit pas dépasser ${maxSizeMB}MB`,
    };
  }

  return { isValid: true };
};

/**
 * Extrait le type MIME d'une chaîne Base64
 * @param base64String Chaîne Base64 (format: "data:image/png;base64,...")
 * @returns Type MIME ou null
 */
export const getMimeTypeFromBase64 = (base64String: string): string | null => {
  const match = base64String.match(/^data:([^;]+);base64,/);
  return match ? match[1] : null;
};

/**
 * Redimensionne une image avant conversion en Base64
 * @param file Fichier image à redimensionner
 * @param maxWidth Largeur maximum (défaut: 800px)
 * @param maxHeight Hauteur maximum (défaut: 800px)
 * @returns Promise avec la chaîne Base64 de l'image redimensionnée
 */
export const resizeImageToBase64 = (
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculer les nouvelles dimensions en conservant le ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en Base64
        const base64String = canvas.toDataURL(file.type);
        resolve(base64String);
      };

      img.onerror = () => {
        reject(new Error('Error loading image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsDataURL(file);
  });
};
