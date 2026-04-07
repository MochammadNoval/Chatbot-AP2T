import api from "./Api";

export async function sendChatMessage(message, conversationId = 0, k = 5) {
  try {
    const response = await api.post("/chat/message", {
      message,
      conversation_id: conversationId,
      k,
    });
    return response.data;
  } catch (error) {
    let chatMessage = "Gagal mengirim pesan, silahkan coba lagi!";

    if (error.response) {
      chatMessage = "Terjadi kesalahan pada server, silahkan coba lagi!";
    } else if (error.request) {
      chatMessage = "Periksa koneksi internet anda, silahkan coba lagi!";
    } else {
      chatMessage =
        "Aplikasi mengalami gangguan sementara, silahkan coba beberapa saat kemudian!";
    }
    throw new Error(chatMessage);
  }
}

export async function getChatSessions() {
  try {
    const response = await api.get("/chat/sessions");
    return response.data;
  } catch (error) {
    let chatMessage = "Gagal mengambil riwayat chat, silahkan coba lagi!";

    if (error.response) {
      chatMessage = "Terjadi kesalahan pada server, silahkan coba lagi!";
    } else if (error.request) {
      chatMessage = "Periksa koneksi internet anda, silahkan coba lagi!";
    } else {
      chatMessage =
        "Aplikasi mengalami gangguan sementara, silahkan coba beberapa saat kemudian!";
    }
    throw new Error(chatMessage);
  }
}

export async function getChatSessionMessages(sessionId) {
  try {
    const response = await api.get(`/chat/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    let chatMessage = "Gagal mengambil percakapan, silahkan coba lagi!";

    if (error.response) {
      chatMessage = "Terjadi kesalahan pada server, silahkan coba lagi!";
    } else if (error.request) {
      chatMessage = "Periksa koneksi internet anda, silahkan coba lagi!";
    } else {
      chatMessage =
        "Aplikasi mengalami gangguan sementara, silahkan coba beberapa saat kemudian!";
    }
    throw new Error(chatMessage);
  }
}

export async function deleteSession(sessionId) {
  try {
    const response = await api.delete(`/chat/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    let chatMessage = "Gagal menghapus percakapan, silahkan coba lagi!";

    if (error.response) {
      chatMessage = "Terjadi kesalahan pada server, silahkan coba lagi!";
    } else if (error.request) {
      chatMessage = "Periksa koneksi internet anda, silahkan coba lagi!";
    } else {
      chatMessage =
        "Aplikasi mengalami gangguan sementara, silahkan coba beberapa saat kemudian!";
    }
    throw new Error(chatMessage);
  }
}
