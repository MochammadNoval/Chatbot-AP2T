import api from "./Api";

/**
 * Handle API errors dengan pesan yang sesuai konteks
 * @param {Error} error - Error object dari axios
 * @param {string} operation - Nama operasi untuk logging (contoh: "addGroupTags")
 * @returns {string} User-friendly error message
 */
function handleApiError(error, operation = "Operation") {
  console.error(`[${operation}]`, error);

  if (error.response) {
    // Server merespons dengan status code error
    const { status, data } = error.response;
    const serverMessage = data?.detail || data?.message || "Server error";
    // console.error(`[${operation}] Server error (${status}):`, data);
    return serverMessage;
  }

  if (error.request) {
    // Request dibuat tapi tidak ada response
    console.error(`[${operation}] No response from server`);
    return "Periksa koneksi internet Anda!";
  }

  // Error lain (setup/config)
  console.error(`[${operation}] Error:`, error.message);
  return "Aplikasi error! Silahkan coba lagi nanti.";
}

/**
 * Validasi input data untuk addGroupTags
 * @param {object} data - Data yang akan dikirim
 * @throws {Error} Jika data tidak valid
 */

function validateGroupTagsData(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Data harus berupa object");
  }

  if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
    throw new Error("Nama group tags tidak boleh kosong");
  }
}

/**
 * Membuat group tags baru
 * @param {object} data - Data group tags (minimal: { name: string })
 * @returns {Promise<object>} Response data dari server
 * @throws {Error} Jika request gagal atau validasi tidak lolos
 *
 * @example
 * try {
 *   const result = await addGroupTags({ name: "Penting" });
 *   console.log(result);
 * } catch (error) {
 *   console.error(error.message);
 * }
 */

export async function addTags(id, data) {
  console.log(id);
  try {
    const normalizedData = {
      name: data,
      tag_group_id: id,
    };
    const response = await api.post("/tags", normalizedData);
    if (!response.data) {
      throw new Error("Response dari server tidak valid");
    }
    return response.data;
  } catch (error) {
    // Jika error dari validasi input
    if (error instanceof Error && !error.response) {
      throw error;
    }

    // Error dari API
    const message = handleApiError(error, "addTags");
    console.log(message);
    throw new Error(message);
  }
}

export async function addGroupTags(data) {
  try {
    // Validasi input
    validateGroupTagsData(data);

    // Normalisasi data
    const normalizedData = {
      name: data.name.trim(),
      description: data.description?.trim() || "",
    };

    // Request ke server
    const response = await api.post("/tags/groups", normalizedData);

    // Validasi response
    if (!response.data) {
      throw new Error("Response dari server tidak valid");
    }

    return response.data;
  } catch (error) {
    // Jika error dari validasi input
    if (error instanceof Error && !error.response) {
      throw error;
    }

    // Error dari API
    const message = handleApiError(error, "addGroupTags");
    throw new Error(message);
  }
}

/**
 * Mengambil daftar semua group tags
 * @returns {Promise<object>} List group tags dari server
 * @throws {Error} Jika request gagal
 *
 * @example
 * try {
 *   const tags = await getTag();
 *   console.log(tags);
 * } catch (error) {
 *   console.error(error.message);
 * }
 */
export async function getTagGroups() {
  try {
    const response = await api.get("/tags/groups");

    // Validasi response
    if (!response.data) {
      throw new Error("Response dari server tidak valid");
    }

    return response.data;
  } catch (error) {
    const message = handleApiError(error, "getTagGroups");
    throw new Error(message);
  }
}

export async function getTags() {
  try {
    const response = await api.get("/tags");

    // Validasi response
    if (!response.data) {
      throw new Error("Response dari server tidak valid");
    }

    return response.data;
  } catch (error) {
    const message = handleApiError(error, "getTag");
    throw new Error(message);
  }
}

/**
 * Update daftar group tags
 * @returns {Promise<object>} List group tags dari server
 * @throws {Error} Jika request gagal
 *
 * @example
 * try {
 *   const tags = await UpdateGroupsTags();
 *   console.log(tags);
 * } catch (error) {
 *   console.error(error.message);
 * }
 */

/**
 * Update group tags yang sudah ada
 * @param {object} data - Data group tags yang akan diupdate (minimal: { name: string })
 * @param {string|number} id - ID dari group tags yang akan diupdate
 * @returns {Promise<object>} Response data dari server
 * @throws {Error} Jika request gagal atau validasi tidak lolos
 *
 * @example
 * try {
 *   const result = await updateGroupTags({ name: "Penting Sekali" }, 1);
 *   console.log(result);
 * } catch (error) {
 *   console.error(error.message);
 * }
 */
export async function updateGroupTags(data, id) {
  try {
    // Validasi ID
    if (!id) {
      throw new Error("ID group tags tidak boleh kosong");
    }

    // Validasi data
    if (!data || typeof data !== "object") {
      throw new Error("Data harus berupa object");
    }

    if (
      !data.name ||
      typeof data.name !== "string" ||
      data.name.trim() === ""
    ) {
      throw new Error("Nama group tags tidak boleh kosong");
    }

    // Normalisasi data
    const normalizedData = {
      name: data.name.trim(),
      description: data.description?.trim() || "",
    };

    // Request ke server
    const response = await api.put(`/tags/groups/${id}`, normalizedData);

    // Validasi response
    if (!response.data) {
      throw new Error("Response dari server tidak valid");
    }

    return response.data;
  } catch (error) {
    // Jika error dari validasi input
    if (error instanceof Error && !error.response) {
      throw error;
    }

    // Error dari API
    const message = handleApiError(error, "updateGroupTags");
    throw new Error(message);
  }
}

export async function deleteGroupTags(id) {
  try {
    // Validasi ID
    if (!id) {
      throw new Error("ID group tags tidak boleh kosong");
    }

    const res = await api.delete(`/tags/groups/${id}`);
    // DELETE endpoint biasanya tidak mengembalikan data
    return true;
  } catch (error) {
    const message = handleApiError(error, "deleteGroupTags");
    throw new Error(message);
  }
}

/**
 * Menghapus tag berdasarkan ID
 * @param {string|number} id - ID dari tag yang akan dihapus
 * @returns {Promise<boolean>} True jika berhasil dihapus
 * @throws {Error} Jika request gagal
 *
 * @example
 * try {
 *   await deleteTag(5);
 *   console.log("Tag deleted successfully");
 * } catch (error) {
 *   console.error(error.message);
 * }
 */
export async function deleteTag(id) {
  try {
    // Validasi ID
    if (!id) {
      throw new Error("ID tag tidak boleh kosong");
    }

    // Request ke server
    const response = await api.delete(`/tags/${id}`);

    // DELETE endpoint biasanya tidak mengembalikan data (204 atau 200 dengan body kosong)
    // Status code 2xx sudah cukup menunjukkan kesuksesan
    return true;
  } catch (error) {
    // Jika error dari validasi input
    if (error instanceof Error && !error.response) {
      throw error;
    }

    // Error dari API
    const message = handleApiError(error, "deleteTag");
    throw new Error(message);
  }
}

/**
 * Update tag yang sudah ada
 * @param {string|number} id - ID dari tag yang akan diupdate
 * @param {object} data - Data tag yang akan diupdate (minimal: { name: string })
 * @returns {Promise<object>} Response data dari server
 * @throws {Error} Jika request gagal atau validasi tidak lolos
 *
 * @example
 * try {
 *   const result = await updateTag(5, { name: "Tag Baru" });
 *   console.log(result);
 * } catch (error) {
 *   console.error(error.message);
 * }
 */
export async function updateTag(id, data) {
  try {
    // Validasi ID
    if (!id) {
      throw new Error("ID tag tidak boleh kosong");
    }

    // Validasi data
    if (!data || typeof data !== "object") {
      throw new Error("Data harus berupa object");
    }

    if (
      !data.name ||
      typeof data.name !== "string" ||
      data.name.trim() === ""
    ) {
      throw new Error("Nama tag tidak boleh kosong");
    }

    // Normalisasi data
    const normalizedData = {
      name: data.name.trim(),
    };

    // Request ke server
    const response = await api.put(`/tags/${id}`, normalizedData);

    // Validasi response
    if (!response.data) {
      throw new Error("Response dari server tidak valid");
    }

    return response.data;
  } catch (error) {
    // Jika error dari validasi input
    if (error instanceof Error && !error.response) {
      throw error;
    }

    // Error dari API
    const message = handleApiError(error, "updateTag");
    throw new Error(message);
  }
}
