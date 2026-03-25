<script setup>
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/vue/24/outline";
import { downloadFile } from "../services/FileServices";
import { ref } from "vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  document: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close", "download"]);

const isDownloading = ref(false);

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

/**
 * Get file URL untuk preview
 */
const getPreviewUrl = () => {
  if (!props.document) return "";
  // Adjust path sesuai dengan setup backend Anda
  return `/api/files/preview/${props.document.id}`;
};
</script>

<template>
  <!-- Modal Backdrop -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/30 z-40 transition-opacity"
    @click="closeModal"
  ></div>

  <!-- Modal -->
  <div
    v-if="isOpen"
    class="fixed top-0 right-0 h-full w-full max-w-4xl bg-white shadow-2xl z-50 flex flex-col"
  >
    <!-- Modal Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <div class="flex-1">
        <h2 class="text-xl font-bold text-gray-900">
          {{ document?.filename || "Preview Dokumen" }}
        </h2>
        <p v-if="document" class="text-xs text-gray-500 mt-1">
          Ukuran:
          {{ (document.size / 1024 / 1024).toFixed(2) }} Mb • Dibuat:
          {{ new Date(document.created_at).toLocaleDateString("id-ID") }}
        </p>
      </div>

      <div class="flex gap-2">
        <!-- Button Download -->
        <button
          @click="handleDownload"
          :disabled="isDownloading"
          class="p-2 cursor-pointer text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
          title="Download"
        >
          <ArrowDownTrayIcon class="size-6"></ArrowDownTrayIcon>
        </button>

        <!-- Button Close -->
        <button
          @click="closeModal"
          class="p-2 cursor-pointer text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Close"
        >
          <XMarkIcon class="size-6"></XMarkIcon>
        </button>
      </div>
    </div>

    <!-- Modal Body - PDF Viewer -->
    <div class="flex-1 overflow-hidden">
      <div class="h-full w-full">
        <!-- PDF Viewer using iframe -->
        <iframe
          :src="getPreviewUrl()"
          class="w-full h-full"
          title="Document Preview"
        ></iframe>

        <!-- Fallback jika PDF tidak bisa di-preview -->
        <div
          class="flex flex-col items-center justify-center h-full bg-gray-50"
          style="display: none"
        >
          <p class="text-gray-500 mb-4">Preview tidak tersedia</p>
          <button
            @click="handleDownload"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Download Dokumen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Placeholder untuk styling tambahan jika diperlukan */
</style>
