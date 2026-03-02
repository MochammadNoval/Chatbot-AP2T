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
    // handling error
    let fileMessage = "Upload gagal, Silahkan coba lagi!";
    // error dari server (4xx / 5xx)
    if (error.response) {
      fileMessage = error.response;
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

export async function deleteFile(id) {
  try {
    const response = await api.delete(`/files/${id}`);
    return response.data;
  } catch (error) {
    const message = handleApiError(error, "deleteFile");
    throw new Error(message);
  }
}
