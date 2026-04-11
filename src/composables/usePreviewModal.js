import { ref, computed } from "vue";
import api from "../services/Api";

/**
 * Composable untuk mengelola state dan logic modal preview dokumen
 * Menyediakan open/close state, loading, error handling, dan fetch preview data
 */
export function usePreviewModal() {
  const isOpen = ref(false);
  const isLoading = ref(false);
  const error = ref(null);
  const selectedDocument = ref(null);
  const previewUrl = ref(null);

  /**
   * Buka modal dengan dokumen tertentu
   */
  const openModal = async (document) => {
    selectedDocument.value = document;
    isOpen.value = true;
    error.value = null;
    await fetchPreview(document.id);
  };

  /**
   * Tutup modal
   */
  const closeModal = () => {
    isOpen.value = false;
    selectedDocument.value = null;
    previewUrl.value = null;
    error.value = null;
    isLoading.value = false;
  };

  /**
   * Fetch preview data dari server
   */
  const fetchPreview = async (fileId) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.get(`/files/${fileId}/preview`, {
        responseType: "blob",
      });
      
      // Buat object URL dari blob
      const fileURL = URL.createObjectURL(response.data);
      previewUrl.value = fileURL;
    } catch (err) {
      error.value =
        err.response?.data?.message ||
        err.message ||
        "Gagal memuat preview dokumen";
      console.error("Preview error:", err);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Reset preview URL untuk penghematan memori
   */
  const revokePreviewUrl = () => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
    }
  };

  /**
   * Hitung ukuran file dalam format yang readable
   */
  const getReadableFileSize = computed(() => {
    if (!selectedDocument.value) return "";
    const bytes = selectedDocument.value.size;
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  });

  /**
   * Format tanggal
   */
  const getFormattedDate = computed(() => {
    if (!selectedDocument.value?.created_at) return "";
    return new Date(selectedDocument.value.created_at).toLocaleDateString(
      "id-ID",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  });

  return {
    isOpen,
    isLoading,
    error,
    selectedDocument,
    previewUrl,
    openModal,
    closeModal,
    fetchPreview,
    revokePreviewUrl,
    getReadableFileSize,
    getFormattedDate,
  };
}
