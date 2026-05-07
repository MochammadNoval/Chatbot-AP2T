/**
 * Service untuk menangani upload dan manajemen file Excel
 * Create-only (No edit/delete untuk saat ini, tapi architecture memungkinkan future expansion)
 */

import api from './Api';
import axios from 'axios';

/**
 * Upload file Excel ke server
 * @param {FormData} formData - FormData yang berisi file Excel
 * @param {function} onUploadProgress - Callback untuk tracking progress
 * @param {CancelToken} cancelToken - Token untuk cancel upload
 * @returns {Promise<object>} Response dari server
 * 
 * @example
 * const formData = new FormData();
 * formData.append('file', excelFile);
 * formData.append('filename', 'data-import');
 * 
 * await uploadExcelFile(formData, (progress) => {
 *   console.log(progress.percent);
 * });
 */
export const uploadExcelFile = async (formData, onUploadProgress, cancelToken) => {
  try {
    const response = await api.post('/excel-import/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
      cancelToken,
    });

    if (response.status === 200 || response.status === 201) {
      return response.data;
    }

    throw new Error('Upload gagal');
  } catch (error) {
    if (axios.isCancel(error)) {
      throw new Error('Upload dibatalkan');
    }

    const message = error.response?.data?.message || error.message || 'Upload Excel gagal';
    throw new Error(message);
  }
};

/**
 * Get Excel file by ID (untuk preview/view)
 * @param {number} id - ID file Excel
 * @returns {Promise<object>} File data
 */
export const getExcelFileById = async (id) => {
  try {
    const response = await api.get(`/excel/${id}`);
    return response.data.data || response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Gagal memuat file Excel';
    throw new Error(message);
  }
};

/**
 * Download Excel file
 * @param {function} onDownloadProgress - Callback untuk tracking progress download
 * @returns {Promise<Blob>} File blob yang siap didownload
 */
export const downloadExcelFile = async (onDownloadProgress) => {
  try {
    const response = await api.get(`/excel-import/template`, {
      responseType: 'blob',
      onDownloadProgress,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Gagal download file Excel';
    throw new Error(message);
  }
};

/**
 * Delete Excel file (implement nanti jika diperlukan)
 * @param {number} id - ID file Excel
 * @returns {Promise<object>} Response dari server
 * 
 * @note Untuk saat ini hanya placeholder, bisa di-enable di masa depan
 */
// export const deleteExcelFile = async (id) => {
//   try {
//     const response = await api.delete(`/excel/${id}`);
//     return response.data;
//   } catch (error) {
//     const message = error.response?.data?.message || 'Gagal menghapus file Excel';
//     throw new Error(message);
//   }
// };

/**
 * Get list of Excel files dengan pagination
 * @param {number} page - Halaman (default: 1)
 * @param {number} limit - Limit per halaman (default: 10)
 * @returns {Promise<object>} List of files dengan pagination info
 */
// export const getExcelFilesList = async (page = 1, limit = 10) => {
//   try {
//     const response = await api.get('/excel', {
//       params: {
//         page,
//         limit,
//       },
//     });
//     return response.data.data || response.data;
//   } catch (error) {
//     const message = error.response?.data?.message || 'Gagal memuat daftar file Excel';
//     throw new Error(message);
//   }
// };
