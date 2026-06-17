import api from "./Api";
import axios from "axios";
import { extractErrorMessage } from "../utils/MessageError";

/**
 * Upload file Excel untuk sertifikasi ke endpoint '/api/sertifikasi/upload'
 * @param {File|FormData} fileOrFormData - File Excel (.xlsx, .xls) atau FormData berisi file
 * @param {function} [onProgress] - Callback untuk tracking progress upload
 * @param {CancelToken} [cancelToken] - Token untuk cancel upload
 * @returns {Promise<any>} Response data dari server
 */
export async function uploadSertifikasiExcel(fileOrFormData, onProgress = null, cancelToken = null) {
  try {
    let formData;

    if (fileOrFormData instanceof FormData) {
      formData = fileOrFormData;
    } else if (fileOrFormData instanceof File) {
      // Validasi tipe file (Excel atau CSV)
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-excel", // .xls
        "application/ms-excel",
        "application/x-msexcel",
        "application/x-ms-excel",
        "application/x-excel",
        "application/x-dos_ms_excel",
        "text/csv", // .csv
      ];

      const hasValidExtension =
        fileOrFormData.name.endsWith(".xlsx") ||
        fileOrFormData.name.endsWith(".xls") ||
        fileOrFormData.name.endsWith(".csv");

      if (!allowedTypes.includes(fileOrFormData.type) && !hasValidExtension) {
        throw new Error(
          "Format file tidak didukung. Gunakan file Excel (.xlsx, .xls) atau CSV"
        );
      }

      // Validasi ukuran file (maksimal 50 MB)
      const maxSize = 50 * 1024 * 1024;
      if (fileOrFormData.size > maxSize) {
        throw new Error("Ukuran file terlalu besar. Maksimal 50 MB");
      }

      formData = new FormData();
      formData.append("file", fileOrFormData);
    } else {
      throw new Error("Input harus berupa File atau FormData");
    }

    const response = await api.post("/sertifikasi/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          const percent = Math.round((e.loaded * 100) / e.total);
          onProgress({
            percent,
            loaded: e.loaded,
            total: e.total,
          });
        }
      },
      cancelToken: cancelToken,
    });

    return response.data;
  } catch (error) {
    // Cek jika upload dibatalkan oleh user
    if (axios.isCancel(error)) {
      throw new Error("Upload dibatalkan");
    }

    console.error("[Upload Sertifikasi Error]", error);
    let errorMessage = "Upload file sertifikasi gagal, silakan coba lagi";

    if (error.response) {
      // Menggunakan utility helper untuk extract error message dari backend
      errorMessage = extractErrorMessage(error, errorMessage);
    } else if (error.request) {
      errorMessage = "Periksa koneksi internet Anda, silakan coba lagi";
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}

/**
 * Mengambil daftar data sertifikasi dengan paginasi dan pencarian
 * @param {number} [page=1] - Halaman yang ingin diambil
 * @param {number} [limit=10] - Jumlah data per halaman
 * @param {string} [search=""] - Kata kunci pencarian
 * @returns {Promise<any>} Response data dari server
 */
export async function getSertifikasiList(page = 1, limit = 10, search = "") {
  try {
    const response = await api.get("/sertifikasi/list", {
      params: {
        page,
        limit,
        search,
      },
    });
    return response.data;
  } catch (error) {
    console.error("[Get Sertifikasi List Error]", error);
    let errorMessage = "Gagal mengambil data sertifikasi";

    if (error.response) {
      errorMessage = extractErrorMessage(error, errorMessage);
    } else if (error.request) {
      errorMessage = "Periksa koneksi internet Anda, silakan coba lagi";
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}

