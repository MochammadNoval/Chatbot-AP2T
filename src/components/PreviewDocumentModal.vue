<script setup>
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/vue/24/outline";
import { downloadFile } from "../services/FileServices";
import { ref, watch, onBeforeUnmount, computed } from "vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  document: {
    type: Object,
    default: null,
  },
  previewUrl: {
    type: String,
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["close", "download"]);

const isDownloading = ref(false);

/**
 * Hitung ukuran file dalam format yang readable
 */
const getReadableFileSize = computed(() => {
  if (!props.document) return "";
  const bytes = props.document.filesize;
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
  if (!props.document?.created_at) return "";
  return new Date(props.document.created_at).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

/**
 * Handle close modal
 */
const closeModal = () => {
  emit("close");
};

/**
 * Handle download dokumen
 */
const handleDownload = async () => {
  isDownloading.value = true;
  try {
    await downloadFile(props.document.id);
    emit("download");
  } catch (error) {
    console.error("Error downloading file:", error);
  } finally {
    isDownloading.value = false;
  }
};
</script>

<template>
  <!-- Modal Backdrop -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/30 z-40 transition-opacity duration-200"
    @click="closeModal"
  ></div>

  <!-- Modal -->
  <div
    v-if="isOpen"
    class="fixed top-0 right-0 h-full w-full max-w-4xl bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right-80"
  >
    <!-- Modal Header -->
    <div
      class="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50"
    >
      <div class="flex-1">
        <h2 class="text-xl font-bold text-gray-900">
          {{ document?.filename || "Preview Dokumen" }}
        </h2>
        <p v-if="document" class="text-sm text-gray-500 mt-1">
          <span>{{ getReadableFileSize }}</span>
          <span class="mx-2">•</span>
          <span>{{ getFormattedDate }}</span>
        </p>
      </div>

      <div class="flex gap-2">
        <!-- Button Download -->
        <button
          @click="handleDownload"
          :disabled="isDownloading || isLoading"
          class="p-2 cursor-pointer text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Download Dokumen"
        >
          <ArrowDownTrayIcon class="size-6"></ArrowDownTrayIcon>
        </button>

        <!-- Button Close -->
        <button
          @click="closeModal"
          class="p-2 cursor-pointer text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Tutup Preview"
        >
          <XMarkIcon class="size-6"></XMarkIcon>
        </button>
      </div>
    </div>

    <!-- Modal Body - PDF Viewer -->
    <div class="flex-1 overflow-hidden flex flex-col bg-gray-100">
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="flex-1 flex items-center justify-center bg-white"
      >
        <div class="flex flex-col items-center gap-4">
          <div class="relative w-12 h-12">
            <div
              class="absolute inset-0 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"
            ></div>
          </div>
          <p class="text-gray-600 font-medium">Memuat preview dokumen...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex-1 flex items-center justify-center bg-white">
        <div class="flex flex-col items-center gap-4 px-6 py-6 text-center">
          <div class="text-red-500">
            <svg
              class="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <div>
            <p class="text-gray-900 font-semibold mb-1">Gagal Memuat Preview</p>
            <p class="text-gray-600 text-sm">{{ error }}</p>
          </div>
          <button
            @click="handleDownload"
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Download Dokumen
          </button>
        </div>
      </div>

      <!-- PDF Viewer (Success State) -->
      <div v-else-if="previewUrl" class="flex-1 overflow-auto">
        <iframe
          :src="previewUrl"
          class="w-full h-full border-none"
          title="Document Preview"
        ></iframe>
      </div>

      <!-- Empty State (fallback) -->
      <div v-else class="flex-1 flex items-center justify-center bg-white">
        <div class="flex flex-col items-center gap-4">
          <div class="text-gray-400">
            <svg
              class="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
          </div>
          <p class="text-gray-500 mb-4">Preview tidak tersedia</p>
          <button
            @click="handleDownload"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Download Dokumen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes slide-in-from-right-80 {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-in {
  animation: slide-in-from-right-80 0.3s ease-out;
}
</style>
