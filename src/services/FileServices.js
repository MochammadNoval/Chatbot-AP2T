import { extractErrorMessage, handleApiError } from "../utils/MessageError";
import api from "./Api";
import axios from "axios";

export async function getFiles() {
  try {
    const response = await api.get("/files");
    return response.data;
  } catch (error) {
    let fileMessage = "Gagal memuat file, silahkan coba lagi";

    if (error.response) {
      // Ambil pesan asli dari backend
      fileMessage = extractErrorMessage(error, fileMessage);
    } else if (error.request) {
      fileMessage = "Periksa koneksi internet Anda, silahkan coba lagi";
    } else {
      fileMessage = "Aplikasi mengalami gangguan sementara, silahkan coba beberapa saat kemudian";
    }

    throw new Error(fileMessage);
  }
}

// Get files by array of tag ids
export async function getFilesByTags(tagIds) {
  try {
    // Convert array to comma-separated string for query parameter
    const tagIdsParam = Array.isArray(tagIds) ? tagIds.join(",") : tagIds;
    const response = await api.get("/files/by-tags", {
      params: {
        tag_ids: tagIdsParam,
      },
    });
    return response.data;
  } catch (error) {
    let fileMessage = "Gagal memuat file berdasarkan tag, silahkan coba lagi";

    if (error.response) {
      // Ambil pesan asli dari backend
      fileMessage = extractErrorMessage(error, fileMessage);
    } else if (error.request) {
      fileMessage = "Periksa koneksi internet Anda, silahkan coba lagi";
    } else {
      fileMessage = "Aplikasi mengalami gangguan sementara, silahkan coba beberapa saat kemudian";
    }

    throw new Error(fileMessage);
  }
}

export async function getFilesById(id) {
  try {
    const response = await api.get(`/files/${id}`);
    return response.data;
  } catch (error) {
    let fileMessage = "Gagal memuat dokumen, silahkan coba lagi";

    if (error.response) {
      // Ambil pesan asli dari backend
      fileMessage = extractErrorMessage(error, fileMessage);
    } else if (error.request) {
      fileMessage = "Periksa koneksi internet Anda, silahkan coba lagi";
    } else {
      fileMessage = "Aplikasi mengalami gangguan sementara, silahkan coba beberapa saat kemudian";
    }

    throw new Error(fileMessage);
  }
}

export async function uploadFileAxios(formData, onProgress, cancelToken = null) {
  try {
    const response = await api.post("/files/upload", formData, {
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

    return response; // kalau sukses
  } catch (error) {
    // Check if upload was cancelled
    if (axios.isCancel(error)) {
      throw new Error("Upload dibatalkan");
    }

    console.error(error);
    let fileMessage = "Upload gagal, silahkan coba lagi";

    if (error.response) {
      // Ambil pesan asli dari backend (bisa: file terlalu besar, format tidak support, dll)
      fileMessage = extractErrorMessage(error, fileMessage);
    } else if (error.request) {
      fileMessage = "Periksa koneksi internet Anda, silahkan coba lagi";
    } else {
      fileMessage = "Aplikasi mengalami gangguan sementara, silahkan coba beberapa saat kemudian";
    }

    throw new Error(fileMessage);
  }
}

export async function updateFiles(id, payload) {
  try {
    const response = await api.put(`/files/${id}`, payload);
    return response.data;
  } catch (error) {
    let fileMessage = "Gagal memperbarui file, silahkan coba lagi";

    if (error.response) {
      // Ambil pesan asli dari backend
      fileMessage = extractErrorMessage(error, fileMessage);
    } else if (error.request) {
      fileMessage = "Periksa koneksi internet Anda, silahkan coba lagi";
    } else {
      fileMessage = "Aplikasi mengalami gangguan sementara, silahkan coba beberapa saat kemudian";
    }

    throw new Error(fileMessage);
  }
}

export async function deleteFile(id) {
  try {
    uploadFileAxios
    const response = await api.delete(`/files/${id}`);
    return response.data;
  } catch (error) {
    const message = handleApiError(error, "deleteFile");
    throw new Error(message);
  }
}

export function downloadFile(id, onProgress) {
  // Create AbortController untuk cancel functionality - RETURN IMMEDIATELY!
  const abortController = new AbortController();
  let downloadCanceled = false;
  let downloadCompleted = false;

  // Track when abort is called
  abortController.signal.addEventListener("abort", () => {
    downloadCanceled = true;
  });

  // Create promise tapi jangan di-await di sini
  const downloadPromise = (async () => {
    try {
      // Double-check cancel status sebelum mulai
      if (downloadCanceled) {
        throw new Error("Download dibatalkan oleh user");
      }

      const response = await api.get(`/files/${id}/download`, {
        responseType: "blob",
        signal: abortController.signal,
        onDownloadProgress: (progressEvent) => {
          // Jangan lanjut jika sudah di-cancel
          if (downloadCanceled) return;
          if (progressEvent.total && onProgress) {
            const percentComplete = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percent: percentComplete,
            });
          }
        },
      });

      // Check jika sudah di-cancel sebelum lanjut
      if (downloadCanceled) {
        throw new Error("Download dibatalkan oleh user");
      }

      // ambil filename dari header Content-Disposition
      const contentDisposition = response.headers["content-disposition"];
      let filename = "file";

      if (contentDisposition) {
        // Handle UTF-8 encoded dan regular filenames
        const filenameMatch = contentDisposition.match(
          /filename\*=UTF-8''(.+?)(?:;|$)|filename="?([^";\n]+)"?/,
        );
        if (filenameMatch?.[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        } else if (filenameMatch?.[2]) {
          filename = filenameMatch[2];
        }
      }

      // buat blob dengan content-type yang sesuai
      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });
      const url = window.URL.createObjectURL(blob);

      // Check lagi sebelum trigger download
      if (downloadCanceled) {
        window.URL.revokeObjectURL(url);
        throw new Error("Download dibatalkan oleh user");
      }

      // buat element link dan trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      downloadCompleted = true;

      // bersihkan
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);

    } catch (error) {
      // Check if error is from abort
      if (error.name === "CanceledError" || error.code === "ECONNABORTED" || downloadCanceled || error.message.includes("dibatalkan")) {
        throw new Error("Download dibatalkan oleh user");
      }

      const message = handleApiError(error, "downloadFile");
      throw new Error(message);
    }
  })();

  // RETURN IMMEDIATELY dengan abortController dan promise
  // Component bisa langsung call abortController.abort() tanpa menunggu
  return {
    abortController,
    promise: downloadPromise,
    isCompleted: () => downloadCompleted,
    isCanceled: () => downloadCanceled
  };
}

export async function uploadExcelFile(file, onProgress = null, cancelToken = null) {
  try {
    // Validasi file
    if (!file) {
      throw new Error("File tidak ditemukan");
    }

    // Validasi tipe file (hanya excel)
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/ms-excel',
      'application/x-msexcel',
      'application/x-ms-excel',
      'application/x-excel',
      'application/x-dos_ms_excel',
      'text/csv', // .csv
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error("Format file tidak didukung. Gunakan file Excel (.xlsx, .xls) atau CSV");
    }

    // Validasi ukuran file (maksimal 50 MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error("Ukuran file terlalu besar. Maksimal 50 MB");
    }

    // Buat FormData
    const formData = new FormData();
    formData.append("file", file);

    // Lakukan POST request
    const response = await api.post("/excel-import/upload", formData, {
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
    // Check if upload was cancelled
    if (axios.isCancel(error)) {
      throw new Error("Upload dibatalkan");
    }

    console.error(error);
    let fileMessage = "Upload file Excel gagal, silahkan coba lagi";

    if (error.response) {
      // Ambil pesan asli dari backend
      fileMessage = extractErrorMessage(error, fileMessage);
    } else if (error.request) {
      fileMessage = "Periksa koneksi internet Anda, silahkan coba lagi";
    } else {
      fileMessage = "Aplikasi mengalami gangguan sementara, silahkan coba beberapa saat kemudian";
    }

    throw new Error(fileMessage);
  }
}

/**
 * Share dokumen dengan password dan expired date
 * @param {number} fileId - ID file yang akan di-share
 * @param {Object} payload - Object berisi password dan expired_at
 * @param {string} payload.password - Password untuk share link
 * @param {string} payload.expired_at - Tanggal kedaluwarsa (format ISO 8601)
 * @returns {Promise<Object>} Response berisi share_url
 */
export async function shareDocumentLink(fileId, payload) {
  console.log(fileId, payload)
  try {
    if (!fileId) {
      throw new Error("File ID diperlukan");
    }

    const response = await api.post(`/files/${fileId}/share`, {
      password: payload.password,
      expires_at: payload.expires_at || null,
    });

    return response.data;
  } catch (error) {
    let fileMessage = "Gagal membuat share link, silahkan coba lagi";

    if (error.response) {
      fileMessage = extractErrorMessage(error, fileMessage);
    } else if (error.request) {
      fileMessage = "Periksa koneksi internet Anda, silahkan coba lagi";
    } else if (error.message) {
      fileMessage = error.message;
    } else {
      fileMessage = "Aplikasi mengalami gangguan sementara, silahkan coba beberapa saat kemudian";
    }

    throw new Error(fileMessage);
  }
}

/**
 * Hapus share link untuk dokumen
 * @param {number} fileId - ID file yang share link-nya akan dihapus
 * @returns {Promise<Object>} Response dari backend
 */
export async function deleteShareLink(fileId) {
  try {
    if (!fileId) {
      throw new Error("File ID diperlukan");
    }

    const response = await api.delete(`/files/${fileId}/share`);

    return response.data;
  } catch (error) {
    let fileMessage = "Gagal menghapus share link, silahkan coba lagi";

    if (error.response) {
      fileMessage = extractErrorMessage(error, fileMessage);
    } else if (error.request) {
      fileMessage = "Periksa koneksi internet Anda, silahkan coba lagi";
    } else if (error.message) {
      fileMessage = error.message;
    } else {
      fileMessage = "Aplikasi mengalami gangguan sementara, silahkan coba beberapa saat kemudian";
    }

    throw new Error(fileMessage);
  }
}

/**
 * Ambil share link yang sudah ada untuk dokumen
 * @param {number} fileId - ID file
 * @returns {Promise<Object>} Response berisi share_token
 */
export async function getShareLink(fileId) {
  try {
    if (!fileId) {
      throw new Error("File ID diperlukan");
    }

    const response = await api.get(`/files/${fileId}/share`);

    return response.data;
  } catch (error) {
    let fileMessage = "Gagal mengambil share link, silahkan coba lagi";

    if (error.response) {
      fileMessage = extractErrorMessage(error, fileMessage);
    } else if (error.request) {
      fileMessage = "Periksa koneksi internet Anda, silahkan coba lagi";
    } else if (error.message) {
      fileMessage = error.message;
    } else {
      fileMessage = "Aplikasi mengalami gangguan sementara, silahkan coba beberapa saat kemudian";
    }

    throw new Error(fileMessage);
  }
}

/**
 * Update share link untuk dokumen
 * @param {number} fileId - ID file yang share link-nya akan diupdate
 * @param {Object} payload - Object berisi data yang akan diupdate
 * @param {string} payload.password - Password untuk share link (optional)
 * @param {string} payload.expires_at - Tanggal kedaluwarsa format ISO 8601 (optional)
 * @param {boolean} payload.is_active - Status aktif share link (optional)
 * @returns {Promise<Object>} Response dari backend
 */
export async function updateShareLink(fileId, payload = {}) {
  try {
    if (!fileId) {
      throw new Error("File ID diperlukan");
    }

    if (!payload || Object.keys(payload).length === 0) {
      throw new Error("Minimal satu parameter harus disediakan");
    }

    // Buat object untuk dikirim, hanya kirim field yang disediakan
    const updateData = {};

    if (payload.hasOwnProperty('password')) {
      updateData.password = payload.password;
    }

    if (payload.hasOwnProperty('expires_at')) {
      updateData.expires_at = payload.expires_at;
    }

    if (payload.hasOwnProperty('is_active')) {
      updateData.is_active = payload.is_active;
    }

    const response = await api.put(`/files/${fileId}/share`, updateData);

    return response.data;
  } catch (error) {
    let fileMessage = "Gagal mengupdate share link, silahkan coba lagi";

    if (error.response) {
      fileMessage = extractErrorMessage(error, fileMessage);
    } else if (error.request) {
      fileMessage = "Periksa koneksi internet Anda, silahkan coba lagi";
    } else if (error.message) {
      fileMessage = error.message;
    } else {
      fileMessage = "Aplikasi mengalami gangguan sementara, silahkan coba beberapa saat kemudian";
    }

    throw new Error(fileMessage);
  }
}

/**
 * Ambil preview dokumen secara publik menggunakan share token
 * @param {string} shareToken - Token public share
 * @param {string} password - Password share link (optional)
 * @returns {Promise<Object>} Response berisi blob data dan headers
 */
export async function getPublicSharePreview(shareToken, password = null) {
  try {
    const config = {
      responseType: "blob",
    };

    if (password) {
      config.params = { password };
    }

    const response = await api.get(`/files/public/shares/${shareToken}/preview`, config);
    return response;
  } catch (error) {
    if (error.response && error.response.data instanceof Blob) {
      // Baca error message dari Blob response
      const text = await error.response.data.text();
      try {
        const errorJson = JSON.parse(text);
        throw new Error(errorJson.message || "Gagal memuat preview dokumen");
      } catch (e) {
        throw new Error("Password salah atau link kedaluwarsa");
      }
    }
    
    let fileMessage = "Gagal memuat preview dokumen, silahkan coba lagi";
    if (error.response) {
      fileMessage = extractErrorMessage(error, fileMessage);
    } else if (error.request) {
      fileMessage = "Periksa koneksi internet Anda, silahkan coba lagi";
    } else if (error.message) {
      fileMessage = error.message;
    }
    throw new Error(fileMessage);
  }
}