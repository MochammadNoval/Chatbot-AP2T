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
export async function getFilesById(id) {
  try {
    const response = await api.get(`/files/${id}`);
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

export async function uploadFileAxios(formData) {
  console.log(formData.get("file"));
  console.log(formData.get("filename"));
  console.log(formData.get("tag_ids"));
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

export async function downloadFile(id) {
  try {
    const response = await api.get(`/files/${id}/download`, {
      responseType: "blob",
    });

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

    // buat element link dan trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // bersihkan
    setTimeout(() => {
      link.remove();
      window.URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    const message = handleApiError(error, "downloadFile");
    throw new Error(message);
  }
}
