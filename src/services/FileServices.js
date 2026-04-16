import { handleApiError } from "../utils/MessageError";
import api from "./Api";

export async function getFiles() {
  try {
    const response = await api.get("/files");
    return response.data;
  } catch (error) {
    // handling error
    let fileMessage = "Upload gagal, Silahkan coba lagi!";
    // error dari server (4xx / 5xx)
    if (error.response) {
      fileMessage = "Terjadi kesalahan pada server, Silahkan coba lagi!";
      // request terkirim tapi tidak ada response
    } else if (error.request) {
      fileMessage = "Periksa koneksi internet anda, Silahkan coba lagi!";
      // error di sisi axios / JS
    } else {
      fileMessage =
        "Aplikasi mengalami gangguan sementara, Silahkan coba beberapa saat kemudian!";
    }
    throw new Error(fileMessage); // lempar lagi biar bisa ditangkap di component
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
    // handling error
    let fileMessage = "gagal mendapatkan file, Silahkan coba lagi!";
    // error dari server (4xx / 5xx)
    if (error.response) {
      fileMessage = "Terjadi kesalahan pada server, Silahkan coba lagi!";
      // request terkirim tapi tidak ada response
    } else if (error.request) {
      fileMessage = "Periksa koneksi internet anda, Silahkan coba lagi!";
      // error di sisi axios / JS
    } else {
      fileMessage =
        "Aplikasi mengalami gangguan sementara, Silahkan coba beberapa saat kemudian!";
    }
    throw new Error(fileMessage); // lempar lagi biar bisa ditangkap di component
  }
}

export async function getFilesById(id) {
  try {
    const response = await api.get(`/files/${id}`);
    return response.data;
  } catch (error) {
    let fileMessage = "Gagal memuat dokumen, Silahkan coba lagi!";
    if (error.response) {
      fileMessage =
        error.response.data?.message || "Terjadi kesalahan pada server, Silahkan coba lagi!";
    } else if (error.request) {
      fileMessage = "Periksa koneksi internet anda, Silahkan coba lagi!";
    } else {
      fileMessage =
        "Aplikasi mengalami gangguan sementara, Silahkan coba beberapa saat kemudian!";
    }
    throw new Error(fileMessage);
  }
}

export async function uploadFileAxios(formData) {
  try {
    const response = await api.post("/files/upload", formData, {
      onUploadProgress: (e) => {
        if (e.total) {
          const percent = Math.round((e.loaded * 100) / e.total);
        }
      },
    });

    return response; // kalau sukses
  } catch (error) {
    // handling error
    let fileMessage = "Upload gagal, Silahkan coba lagi!";
    // error dari server (4xx / 5xx)
    if (error.response) {
      fileMessage = "Terjadi kesalahan pada server, Silahkan coba lagi!";
      // request terkirim tapi tidak ada response
    } else if (error.request) {
      fileMessage = "Periksa koneksi internet anda, Silahkan coba lagi!";
      // error di sisi axios / JS
    } else {
      fileMessage =
        "Aplikasi mengalami gangguan sementara, Silahkan coba beberapa saat kemudian!";
    }
    throw new Error(fileMessage); // lempar lagi biar bisa ditangkap di component
  }
}

export async function updateFiles(id, payload) {
  try {
    const response = await api.put(`/files/${id}`, payload);
    return response.data;
  } catch (error) {
    let fileMessage = "Upload gagal, Silahkan coba lagi!";

    if (error.response) {
      // ambil message dari backend
      fileMessage =
        error.response.data?.message || JSON.stringify(error.response.data);
    } else if (error.request) {
      fileMessage = "Periksa koneksi internet anda, Silahkan coba lagi!";
    } else {
      fileMessage =
        "Aplikasi mengalami gangguan sementara, Silahkan coba beberapa saat kemudian!";
    }
    throw new Error(fileMessage);
  }
}

export async function deleteFile(id) {
  try {
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
