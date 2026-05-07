/**
 * Composable untuk konfigurasi upload document berbeda tipe file
 * Mendukung: PDF (CRUD), Excel (Create only)
 * 
 * Struktur config memudahkan untuk extend ke tipe file baru di masa depan
 */

export const UPLOAD_CONFIG = {
  pdf: {
    name: 'PDF Document',
    acceptedFormats: '.pdf',
    acceptedMimeTypes: 'application/pdf',
    maxFileSize: 100 * 1024 * 1024, // 100 MB
    supportsCRUD: true,
    requiresTags: true,           // PDF memerlukan tags
    allowsIndexing: true,          // PDF bisa di-index
    actions: ['create', 'edit', 'delete', 'view'], // Full CRUD
    description: 'Upload file PDF untuk manajemen dokumen',
  },

  excel: {
    name: 'Excel Data',
    acceptedFormats: '.xlsx, .xls',
    acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel',
    maxFileSize: 50 * 1024 * 1024, // 50 MB (lebih kecil untuk file excel)
    supportsCRUD: false,
    requiresTags: false,           // Excel tidak memerlukan tags
    allowsIndexing: false,         // Excel tidak di-index
    actions: ['create'],           // Create only (edit mungkin ditambah di masa depan)
    description: 'Upload file Excel untuk import data',
  },
};

/**
 * Composable untuk mendapatkan config berdasarkan mode
 * @param {string} mode - 'pdf' atau 'excel'
 * @returns {object} Configuration object untuk mode tersebut
 */
export const useDocumentUploadConfig = (mode = 'pdf') => {
  const config = UPLOAD_CONFIG[mode];

  if (!config) {
    console.error(`[useDocumentUploadConfig] Mode '${mode}' tidak tersedia. Gunakan 'pdf' atau 'excel'.`);
    return UPLOAD_CONFIG.pdf; // fallback ke PDF
  }

  /**
   * Validate file berdasarkan config
   * @param {File} file
   * @returns {object} { isValid: boolean, error?: string }
   */
  const validateFile = (file) => {
    if (!file) {
      return { isValid: false, error: 'File harus dipilih' };
    }

    // Check file size
    if (file.size > config.maxFileSize) {
      const maxSizeMB = (config.maxFileSize / (1024 * 1024)).toFixed(0);
      return {
        isValid: false,
        error: `Ukuran file maksimal ${maxSizeMB} MB, file Anda ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      };
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    const allowedExtensions = config.acceptedFormats.split(',').map(ext => ext.trim().toLowerCase());

    if (!allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: `Format file tidak didukung. Format yang diizinkan: ${config.acceptedFormats}`,
      };
    }

    return { isValid: true };
  };

  /**
   * Format bytes to readable format
   * @param {number} bytes
   * @returns {string}
   */
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Check apakah action tersebut supported untuk mode ini
   * @param {string} action - 'create', 'edit', 'delete', 'view'
   * @returns {boolean}
   */
  const isActionSupported = (action) => {
    return config.actions.includes(action);
  };

  return {
    config,
    validateFile,
    formatBytes,
    isActionSupported,
  };
};

/**
 * Get all available upload modes
 * @returns {array} Array of available modes
 */
export const getAvailableModes = () => {
  return Object.keys(UPLOAD_CONFIG);
};
