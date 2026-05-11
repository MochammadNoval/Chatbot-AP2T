<script setup>
import { ref, watch } from "vue";
import { XCircleIcon,PlusCircleIcon, ArrowDownOnSquareIcon } from "@heroicons/vue/24/outline";
import { Toast, useToast } from "primevue";
import axios from "axios";
import { uploadExcelFile, downloadExcelFile } from "../services/ExcelServices";
import Swal from "sweetalert2";
import DownloadProgressBar from "./DownloadProgressBar.vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: "Upload Excel File",
  },
});

const emit = defineEmits(["close", "completed", "upload-success"]);

// State management
const isDragging = ref(false);
const fileInput = ref(null);
const toast = useToast();
const isLoading = ref(false);

// Upload progress tracking
const uploadProgress = ref(0);
const uploadedSize = ref(0);
const totalSize = ref(0);
const uploadStartTime = ref(null);
const estimatedTimeRemaining = ref(0);
const uploadCancelSource = ref(null);

// Download progress tracking
const showDownloadProgress = ref(false);
const downloadProgress = ref(0);
const downloadFileSize = ref(0);
const downloadedSize = ref(0);
const downloadStartTime = ref(0);
const downloadCancelSource = ref(null);
const downloadFileName = ref('template-dashboard-sertifikasi.xlsx');

const formData = ref({
  filename: "",
  file: null,
});

// Watch untuk mereset state ketika modal dibuka/ditutup
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    resetForm();
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

// Format time remaining
const formatTimeRemaining = (seconds) => {
  if (seconds <= 0) return "Calculating...";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

// Calculate time remaining
const calculateTimeRemaining = (loaded, total) => {
  if (!uploadStartTime.value) return 0;
  
  const elapsedTime = (Date.now() - uploadStartTime.value) / 1000;
  const uploadSpeed = loaded / elapsedTime;
  
  if (uploadSpeed === 0) return 0;
  
  const remainingBytes = total - loaded;
  const remainingTime = remainingBytes / uploadSpeed;
  
  return remainingTime;
};

// Drag over handler
const onDragOver = (event) => {
  event.preventDefault();
  isDragging.value = true;
};

// Drag leave handler
const onDragLeave = (event) => {
  if (event.currentTarget.contains(event.relatedTarget)) return;
  isDragging.value = false;
};

// Drop handler
const onDrop = (event) => {
  event.preventDefault();
  isDragging.value = false;

  const files = Array.from(event.dataTransfer.files);
  if (!files.length) return;

  if (files && files[0]) {
    formData.value.file = files[0];
    formData.value.filename = "";
  }
};

// File change handler
const handleFileChange = (event) => {
  const files = event.target.files;
  if (files && files[0]) {
    formData.value.file = files[0];
    formData.value.filename = "";
    event.target.value = "";
  }
};

// Clear file
const clearFile = () => {
  formData.value.file = null;
  formData.value.filename = "";
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

// Handle upload
const handleUpload = async () => {
  if (!formData.value.file) {
    toast.add({
      severity: "warn",
      summary: "Peringatan",
      detail: "Silakan pilih file terlebih dahulu",
      life: 3000,
    });
    return;
  }

  // Validate file type (Excel only)
  const validTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
  ];

  if (!validTypes.includes(formData.value.file.type)) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "File harus berformat Excel (.xlsx, .xls, .csv)",
      life: 3000,
    });
    return;
  }

  // Validate file size
  if (formData.value.file.size > 100 * 1024 * 1024) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "File maksimal 100 MB",
      life: 3000,
    });
    return;
  }

  isLoading.value = true;
  uploadToServer();
};

// Upload to server
const uploadToServer = async () => {
  try {
    const dataFile = new FormData();
    dataFile.append("file", formData.value.file);
    dataFile.append("filename", formData.value.filename || formData.value.file.name);

    // Initialize cancel token
    uploadCancelSource.value = axios.CancelToken.source();

    // Initialize progress tracking
    uploadStartTime.value = Date.now();
    totalSize.value = formData.value.file.size;

    const res = await uploadExcelFile(
      dataFile,
      (progressEvent) => {
        const percent = (progressEvent.loaded / progressEvent.total) * 100;
        uploadProgress.value = Math.round(percent);
        uploadedSize.value = progressEvent.loaded;
        estimatedTimeRemaining.value = calculateTimeRemaining(
          progressEvent.loaded,
          progressEvent.total
        );
      },
      uploadCancelSource.value.token
    );

    toast.add({
      severity: "success",
      summary: "Success",
      detail: "File berhasil diupload",
      life: 3000,
    });

    isLoading.value = false;
    uploadProgress.value = 100;

    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = "";
    }

    formData.value.file = null;
    formData.value.filename = "";

    emit("upload-success", res);

    setTimeout(() => {
      emit("completed");
      closeModal();
    }, 2000);
  } catch (err) {
    if (err.message !== "Upload dibatalkan") {
      console.error('[Upload Error]', err);
      
      toast.add({
        severity: "error",
        summary: "Error Upload",
        detail: err.message || "Upload gagal",
        life: 7000,
      });
      
      // Reset state untuk kembali ke modal awal
      uploadProgress.value = 0;
      uploadedSize.value = 0;
      totalSize.value = 0;
      uploadStartTime.value = null;
      estimatedTimeRemaining.value = 0;
      
      // Reset file input
      if (fileInput.value) {
        fileInput.value.value = "";
      }
      formData.value.file = null;
      formData.value.filename = "";
    }

  } finally {
    isLoading.value = false;
    uploadCancelSource.value = null;
  }
};

// Cancel upload
const handleCancelUpload = () => {
  if (uploadCancelSource.value) {
    uploadCancelSource.value.cancel("Upload dibatalkan oleh user");
    uploadCancelSource.value = null;
    isLoading.value = false;
    uploadProgress.value = 0;
    uploadedSize.value = 0;
    totalSize.value = 0;
    uploadStartTime.value = null;
    estimatedTimeRemaining.value = 0;

    if (fileInput.value) {
      fileInput.value.value = "";
    }
    formData.value.file = null;
    formData.value.filename = "";

    toast.add({
      severity: "info",
      summary: "Info",
      detail: "Upload dibatalkan",
      life: 3000,
    });
  }
};

// Reset form
const resetForm = () => {
  if (fileInput.value) {
    fileInput.value.value = "";
  }

  formData.value = {
    filename: "",
    file: null,
  };

  uploadProgress.value = 0;
  uploadedSize.value = 0;
  totalSize.value = 0;
  uploadStartTime.value = null;
  estimatedTimeRemaining.value = 0;
  uploadCancelSource.value = null;
  isDragging.value = false;
};

// Close modal
const closeModal = () => {
  if (uploadCancelSource.value && uploadProgress.value > 0) {
    handleCancelUpload();
    return;
  }

  resetForm();
  emit("close");
};

// Handle download template
const handleDownloadTemplate = async () => {
  try {
    showDownloadProgress.value = true;
    downloadProgress.value = 0;
    downloadedSize.value = 0;
    downloadFileSize.value = 0;
    downloadStartTime.value = Date.now();

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
    link.download = downloadFileName.value;
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
      detail: "Template berhasil didownload",
      life: 3000,
    });

    setTimeout(() => {
      showDownloadProgress.value = false;
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
    }
    showDownloadProgress.value = false;
  } finally {
    downloadCancelSource.value = null;
  }
};

// Cancel download
const handleCancelDownload = () => {
  if (downloadCancelSource.value) {
    downloadCancelSource.value.cancel("Download dibatalkan oleh user");
    downloadCancelSource.value = null;
    showDownloadProgress.value = false;

    toast.add({
      severity: "info",
      summary: "Info",
      detail: "Download dibatalkan",
      life: 3000,
    });
  }
};
</script>

<template>
  <!-- Download Progress Bar -->
  <DownloadProgressBar
    v-if="showDownloadProgress"
    :fileName="downloadFileName"
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
    :class="{ 'pointer-events-none': isLoading || showDownloadProgress }"
    @click="!isLoading && !showDownloadProgress && closeModal()"
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
        {{ props.title }}
      </h2>
      <button
        @click="closeModal"
        class="text-gray-400 hover:text-gray-600 transition-colors"
        :disabled="isLoading || showDownloadProgress"
      >
        <XCircleIcon class="size-7 text-red-500 cursor-pointer"></XCircleIcon>
      </button>
    </div>

    <!-- Modal Body - Upload Form -->
    <div
      class="p-6 space-y-4"
      v-if="uploadProgress === 0"
    >
      <!-- File Input -->
      <div>
        <label
          class="block text-sm font-semibold text-gray-700 mb-2"
          for="excelUploadFile"
        >
          Pilih File Excel
        </label>
        <div
          class="border-dashed border-2 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
          :class="{
            'border-blue-500 bg-blue-50': isDragging,
            'border-gray-300': !isDragging,
          }"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
          @click.stop="fileInput.click()"
        >
          <input
            ref="fileInput"
            type="file"
            @change="handleFileChange"
            class="hidden"
            aria-label="Upload excel file"
            id="excelUploadFile"
            accept=".xlsx,.xls,.csv"
          />
          <div class="pointer-events-none">
            <svg
              v-if="!formData.file"
              class="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v24a4 4 0 004 4h24a4 4 0 004-4V20m-6-8v10m0 0l3-3m-3 3l-3-3"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <p class="text-gray-600 text-sm font-semibold mt-2">
              {{
                formData.file
                  ? formData.file.name
                  : "Drag atau click untuk pilih file"
              }}
            </p>
            <p class="text-gray-400 text-xs mt-1">
              {{
                formData.file
                  ? `${formatBytes(formData.file.size)}`
                  : "Format: .xlsx, .xls, .csv (Max 100MB)"
              }}
            </p>
          </div>

          <!-- Clear file button -->
          <button
            v-if="formData.file"
            @click.stop="clearFile"
            class="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
            type="button"
            title="Batalkan file"
          >
            <XCircleIcon class="size-4" />
            Batalkan File
          </button>
        </div>
      </div>

      <!-- Filename Input -->
      <!-- <div>
        <span class="flex gap-x-2">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Nama File
          </label>
          <p class="text-xs font-semibold text-gray-500 mt-0.5">(opsional)</p>
        </span>
        <input
          v-model="formData.filename"
          type="text"
          placeholder="Masukkan nama file (tanpa extension)"
          class="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="isLoading"
        />
        <p class="text-xs text-gray-500 mt-1">
          Jika kosong, nama file asli akan digunakan
        </p>
      </div> -->
      <div class="bg-blue-50 border border-blue-200 py-3 px-3 rounded-lg">
        <p class="text-blue-400 text-sm">💡File excel akan diupload untuk proses import data. Pastikan format data sudah sesuai dengan template yang ditentukan</p>
      </div>
    </div>

    <!-- Modal Body - Upload Progress -->
    <div class="p-6 space-y-4" v-if="uploadProgress > 0">
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-sm font-semibold text-gray-700">
            Mengupload: {{ formData.file?.name }}
          </span>
          <span class="text-sm font-semibold text-gray-600">
            {{ uploadProgress }}%
          </span>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div
            class="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            :style="{ width: uploadProgress + '%' }"
          ></div>
        </div>

        <!-- Upload Info -->
        <div class="grid grid-cols-3 gap-2 text-xs pt-2">
          <div class="bg-gray-50 p-2 rounded">
            <p class="text-gray-500">Uploaded</p>
            <p class="font-semibold text-gray-700">
              {{ formatBytes(uploadedSize) }}
            </p>
          </div>
          <div class="bg-gray-50 p-2 rounded">
            <p class="text-gray-500">Total</p>
            <p class="font-semibold text-gray-700">
              {{ formatBytes(totalSize) }}
            </p>
          </div>
          <div class="bg-gray-50 p-2 rounded">
            <p class="text-gray-500">Remaining</p>
            <p class="font-semibold text-gray-700">
              {{ formatTimeRemaining(estimatedTimeRemaining) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Footer -->
    <div class="flex w-full gap-3 p-6 border-t border-gray-200 bg-gray-50">
      <!-- <button
        v-if="uploadProgress === 0"
        @click="closeModal"
        class="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
        :disabled="isLoading || showDownloadProgress"
      >
        Batal
      </button> -->
      
      <!-- Button Download -->
      <button 
          v-if="uploadProgress === 0"
          @click="handleDownloadTemplate"
          class=" px-4 py-2 ml-auto bg-amber-600 hover:bg-amber-700 rounded-lg font-semibold transition-colors text-white flex items-center justify-center gap-2"
          :disabled="showDownloadProgress"
        >
            <ArrowDownOnSquareIcon class="size-4"></ArrowDownOnSquareIcon>
            <span>Download template</span> 
        </button>
      <button
        v-if="uploadProgress === 0"
        @click="handleUpload"
        class=" px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        :disabled="!formData.file || isLoading || showDownloadProgress"
      >
        {{ isLoading ? "Uploading..." : "Upload" }}
      </button>

      <button
        v-if="uploadProgress > 0"
        @click="handleCancelUpload"
        class="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
        :disabled="!isLoading"
      >
        Cancel Upload
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Smooth transitions */
:deep(.fade-enter-active),
:deep(.fade-leave-active) {
  transition: opacity 0.3s ease;
}

:deep(.fade-enter-from),
:deep(.fade-leave-to) {
  opacity: 0;
}
</style>
