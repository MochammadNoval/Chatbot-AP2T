<script setup>
import { ref, watch } from "vue";
import { XCircleIcon } from "@heroicons/vue/24/outline";
import { Toast, useToast } from "primevue";
import axios from "axios";
import { downloadExcelFile } from "../services/ExcelServices";
import DownloadProgressBar from "./DownloadProgressBar.vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  fileName: {
    type: String,
    default: "template-dashboard-sertifikasi.xlsx",
  },
});

const emit = defineEmits(["close", "download-start", "download-success", "download-error"]);

const toast = useToast();
const isLoading = ref(false);

// Download progress tracking
const showDownloadProgress = ref(false);
const downloadProgress = ref(0);
const downloadFileSize = ref(0);
const downloadedSize = ref(0);
const downloadStartTime = ref(0);
const downloadCancelSource = ref(null);

// Watch untuk reset state ketika modal ditutup
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    resetState();
  }
});

// Format bytes to readable format
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Handle download
const handleDownload = async () => {
  try {
    isLoading.value = true;
    showDownloadProgress.value = true;
    downloadProgress.value = 0;
    downloadedSize.value = 0;
    downloadFileSize.value = 0;
    downloadStartTime.value = Date.now();

    emit("download-start");

    // Initialize cancel token
    downloadCancelSource.value = axios.CancelToken.source();

    const blob = await downloadExcelFile(
      (progressEvent) => {
        const total = progressEvent.total || 0;
        const loaded = progressEvent.loaded || 0;

        downloadFileSize.value = total;
        downloadedSize.value = loaded;
        downloadProgress.value = total > 0 ? Math.round((loaded / total) * 100) : 0;
      },
      downloadCancelSource.value.token
    );

    // Create temporary URL for blob
    const url = window.URL.createObjectURL(blob);

    // Create anchor element and trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = props.fileName;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Set progress to 100% briefly before hiding
    downloadProgress.value = 100;

    toast.add({
      severity: "success",
      summary: "Success",
      detail: "File berhasil didownload",
      life: 3000,
    });

    emit("download-success");

    setTimeout(() => {
      showDownloadProgress.value = false;
      closeModal();
    }, 1500);
  } catch (error) {
    if (error.message !== "Download dibatalkan") {
      console.error("Download error:", error.message);
      toast.add({
        severity: "error",
        summary: "Error",
        detail: error.message || "Download gagal",
        life: 3000,
      });
      emit("download-error", error);
    }
    showDownloadProgress.value = false;
  } finally {
    isLoading.value = false;
    downloadCancelSource.value = null;
  }
};

// Cancel download
const handleCancelDownload = () => {
  if (downloadCancelSource.value) {
    downloadCancelSource.value.cancel("Download dibatalkan oleh user");
    downloadCancelSource.value = null;
    isLoading.value = false;
    showDownloadProgress.value = false;

    toast.add({
      severity: "info",
      summary: "Info",
      detail: "Download dibatalkan",
      life: 3000,
    });

    resetState();
  }
};

// Reset state
const resetState = () => {
  downloadProgress.value = 0;
  downloadedSize.value = 0;
  downloadFileSize.value = 0;
  downloadStartTime.value = 0;
  downloadCancelSource.value = null;
  showDownloadProgress.value = false;
  isLoading.value = false;
};

// Close modal
const closeModal = () => {
  if (downloadCancelSource.value && downloadProgress.value > 0) {
    handleCancelDownload();
    return;
  }

  resetState();
  emit("close");
};
</script>

<template>
  <!-- Download Progress Bar -->
  <DownloadProgressBar
    v-if="showDownloadProgress"
    :fileName="fileName"
    :progress="downloadProgress"
    :fileSize="downloadFileSize"
    :downloadedSize="downloadedSize"
    :startTime="downloadStartTime"
    @cancel-request="handleCancelDownload"
  />

  <!-- Modal Backdrop -->
  <div
    v-if="props.isOpen"
    class="fixed inset-0 bg-black/30 bg-opacity-10 z-40 transition-opacity"
    :class="{ 'pointer-events-none': isLoading }"
    @click="!isLoading && closeModal()"
  ></div>

  <!-- Modal -->
  <div
    v-if="props.isOpen"
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-lg overflow-y-auto max-h-[90vh]"
  >
    <Toast />

    <!-- Modal Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-200">
      <h2 class="text-xl font-bold text-gray-900">
        Download Template Excel
      </h2>
      <button
        @click="closeModal"
        class="text-gray-400 hover:text-gray-600 transition-colors"
        :disabled="isLoading"
      >
        <XCircleIcon class="size-7 text-red-500 cursor-pointer"></XCircleIcon>
      </button>
    </div>

    <!-- Modal Body -->
    <div class="p-6 space-y-4">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-blue-900 mb-2">
          Download Template
        </h3>
        <p class="text-sm text-blue-800">
          Silakan klik tombol "Download" untuk mendownload template Excel yang
          berisi struktur data yang diperlukan untuk import data dashboard training.
        </p>
      </div>

      <div class="bg-gray-50 rounded-lg p-4">
        <p class="text-xs text-gray-500 font-semibold mb-1">Nama File</p>
        <p class="text-sm font-semibold text-gray-800 break-all">
          {{ fileName }}
        </p>
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p class="text-xs font-semibold text-amber-900 mb-2">📋 Instruksi:</p>
        <ul class="text-xs text-amber-800 space-y-1 list-disc list-inside">
          <li>Download template Excel terlebih dahulu</li>
          <li>Isi data sesuai dengan format yang telah ditentukan</li>
          <li>Upload file yang sudah diisi melalui tombol "Upload Data"</li>
        </ul>
      </div>
    </div>

    <!-- Modal Footer -->
    <div class="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
      <button
        @click="closeModal"
        class="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
        :disabled="isLoading"
      >
        Tutup
      </button>
      <button
        @click="handleDownload"
        class="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        :disabled="isLoading"
      >
        {{ isLoading ? "Downloading..." : "Download" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
:deep(.fade-enter-active),
:deep(.fade-leave-active) {
  transition: opacity 0.3s ease;
}

:deep(.fade-enter-from),
:deep(.fade-leave-to) {
  opacity: 0;
}
</style>
