import axios from "axios";

export async function uploadFileAxios(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post("/api/files/upload", formData, {
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

export async function getFiles() {
  try {
    const response = await axios.get("/api/files");

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

export async function updateFiles(id, payload) {
  try {
    const response = await axios.put(`/api/files/${id}`, payload);
    console.log(id);
    // return response.data;
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
