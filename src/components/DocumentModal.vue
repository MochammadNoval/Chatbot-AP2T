<script setup>
import { onMounted, ref, watch, computed } from "vue";
import { XCircleIcon } from "@heroicons/vue/24/outline";
import { Toast, useToast } from "primevue";
import { getFilesById, updateFiles, uploadFileAxios } from "../services/FileServices";
import { uploadExcelFile } from "../services/ExcelServices";
import { useRouter } from "vue-router";
import { getTagGroups, getTags } from "../services/Tags";
import { useAuthStores } from "../stores/Auth";
import { useDocumentUploadConfig } from "../composables/useDocumentUploadConfig";
import Swal from "sweetalert2";
import axios from "axios";

// Sub-components
import PDFUploadSection from "./modals/PDFUploadSection.vue";
import ExcelUploadSection from "./modals/ExcelUploadSection.vue";

const useAuth = useAuthStores();
const toast = useToast();
const router = useRouter();

/**
 * ============================================
 * PROPS & EMITS
 * ============================================
 * 
 * mode: 'pdf' | 'excel' (NEW - untuk support multiple file types)
 * action: 'create' | 'edit' | 'view' (NEW - replace type prop)
 * 
 * Backward compatibility:
 * - Jika menggunakan 'type' prop, akan auto-convert ke mode='pdf'
 */

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  idDocument: {
    type: Number,
    default: null,
  },
  // NEW Props
  mode: {
    type: String,
    default: 'pdf', // 'pdf' | 'excel'
  },
  action: {
    type: String,
    default: 'create', // 'create' | 'edit' | 'view'
  },
  
  // OLD Props (backward compat)
  type: {
    type: String,
    default: 'UploadDocument', // 'UploadDocument' | 'editDocument'
  },
  
  // For old API
  idDocument: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(["close", "upload", "completed"]);

// ============================================
// CONFIG & STATE
// ============================================

const { config: uploadConfig, validateFile, formatBytes } = useDocumentUploadConfig(props.mode);

// PDF-specific state
const groupTag = ref([]);
const tag = ref([]);
const selectedTag = ref([]);
const selectedGroupTag = ref([]);
const nameFileForPlaceholder = ref("");
const fileById = ref("");
const listTagInFile = ref([]);

// General upload state
const formData = ref({
  filename: "",
  tag_ids: "",
  file: null,
  is_index: false,
});

const isLoading = ref(false);
const isDragging = ref(false);
const fileInput = ref(null);

// Progress tracking states
const uploadProgress = ref(0);
const uploadedSize = ref(0);
const totalSize = ref(0);
const uploadStartTime = ref(null);
const estimatedTimeRemaining = ref(0);
const uploadCancelSource = ref(null);

// ============================================
// COMPUTED
// ============================================

// Computed property untuk filter tags berdasarkan selectedGroupTag (PDF only)
const filteredTags = computed(() => {
  if (selectedGroupTag.value.length === 0) {
    return [];
  }
  
  return tag.value.filter((t) =>
    selectedGroupTag.value.includes(t.tag_group_id)
  );
});

// Determine modal title berdasarkan mode & action
const modalTitle = computed(() => {
  if (props.mode === 'excel') {
    return 'Upload File Excel';
  }
  
  if (props.action === 'edit' || props.type === 'editDocument') {
    return 'Edit Document';
  }
  
  return 'Upload Document';
});

// ============================================
// WATCHERS
// ============================================

// Watch untuk membersihkan selectedTag ketika selectedGroupTag berubah (PDF only)
watch(selectedGroupTag, () => {
  if (selectedGroupTag.value.length === 0) {
    selectedTag.value = [];
  } else {
    selectedTag.value = selectedTag.value.filter((tagId) => {
      const tagObj = tag.value.find((t) => t.id === tagId);
      return tagObj && selectedGroupTag.value.includes(tagObj.tag_group_id);
    });
  }
}, { immediate: true });

// Watch untuk load file ketika modal dibuka (PDF edit mode only)
watch([() => props.isOpen, () => props.idDocument], async ([isOpen, id]) => {
  if (isOpen !== true || !id) return;

  // Hanya untuk PDF edit mode
  if (props.mode !== 'pdf') return;

  try {
    useAuth.setLoading(true);
    fileById.value = await getFilesById(id);
    nameFileForPlaceholder.value = fileById.value.filename;
    tag.value = await getTags();
    listTagInFile.value = fileById.value.tags;
    useAuth.setLoading(false);
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.message || "Gagal memuat dokumen",
      life: 3000,
    });
  }
});

// ============================================
// LIFECYCLE
// ============================================

onMounted(async () => {
  try {
    tag.value = await getTags();
    groupTag.value = await getTagGroups();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.message || "Gagal memuat data",
      life: 3000,
    });
  }
});

// ============================================
// PDF-SPECIFIC METHODS
// ============================================

const removeTag = (tagId) => {
  const target = selectedTag;
  target.value = target.value.filter((id) => id !== tagId);
};

const clearAllTags = () => {
  selectedTag.value = [];
  listTagInFile.value = [];
};

const clearAllGroupTags = () => {
  selectedGroupTag.value = [];
  selectedTag.value = [];
  listTagInFile.value = [];
};

// ============================================
// FILE HANDLING
// ============================================

const clearFile = () => {
  formData.value.file = null;
  formData.value.filename = "";
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

// ============================================
// UPDATE DOCUMENT (PDF edit mode only)
// ============================================

const handleUpdate = async () => {
  try {
    const result = await Swal.fire({
      title: "Update Dokumen?",
      text: "Apakah anda yakin ingin update dokumen?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Batal",
      confirmButtonText: "Ya, Update!",
    });

    if (result.isConfirmed) {
      const tagIds = listTagInFile.value
        .map((tag) => (typeof tag === "object" ? tag.id : tag))
        .filter((id) => id !== null && id !== undefined)
        .map(Number);

      await updateFiles(props.idDocument, {
        filename: formData.value.filename
          ? formData.value.filename
          : nameFileForPlaceholder.value,
        tag_ids: tagIds,
      });

      Swal.fire({
        title: "Berhasil!",
        text: "Dokumen berhasil di update!",
        icon: "success",
      });

      emit("completed");
    }
  } catch (error) {
    useAuth.setLoading(false);

    Swal.fire({
      title: "Gagal!",
      text: error.message,
      icon: "error",
    });
  }
};

// ============================================
// UPLOAD HANDLING
// ============================================

const handleUpload = () => {
  // Validation
  const validation = validateFile(formData.value.file);
  if (!validation.isValid) {
    toast.add({
      severity: "error",
      summary: "Validasi Error",
      detail: validation.error,
      life: 3000,
    });
    return;
  }

  isLoading.value = true;
  uploadToServer();
};

const uploadToServer = async () => {
  try {
    const dataFile = new FormData();
    dataFile.append("file", formData.value.file);
    dataFile.append("filename", formData.value.filename);

    // Mode-specific append
    if (props.mode === 'pdf') {
      dataFile.append("tag_ids", JSON.stringify(selectedTag.value || []));
      dataFile.append("is_index", formData.value.is_index);
    }

    // Initialize cancel token
    uploadCancelSource.value = axios.CancelToken.source();

    // Initialize progress tracking
    uploadStartTime.value = Date.now();
    totalSize.value = formData.value.file.size;

    // Choose upload service based on mode
    let uploadService;
    if (props.mode === 'excel') {
      uploadService = uploadExcelFile;
    } else {
      uploadService = uploadFileAxios;
    }

    const res = await uploadService(dataFile, (progressEvent) => {
      uploadProgress.value = progressEvent.percent;
      uploadedSize.value = progressEvent.loaded;
      estimatedTimeRemaining.value = calculateTimeRemaining(
        progressEvent.loaded,
        progressEvent.total
      );
    }, uploadCancelSource.value.token);

    toast.add({
      severity: "success",
      summary: "Success",
      detail: `File ${props.mode.toUpperCase()} berhasil diupload`,
      life: 3000,
    });

    isLoading.value = false;
    
    // Reset
    if (fileInput.value) {
      fileInput.value.value = "";
    }
    formData.value.file = null;
    formData.value.filename = "";
    
    setTimeout(() => {
      emit("completed");
      closeModal();
    }, 2000);
  } catch (err) {
    if (err.message !== "Upload dibatalkan") {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: err.message || "Upload gagal",
        life: 3000,
      });
    }
  } finally {
    isLoading.value = false;
    uploadCancelSource.value = null;
  }
};

// ============================================
// PROGRESS TRACKING
// ============================================

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

const calculateTimeRemaining = (loaded, total) => {
  if (!uploadStartTime.value) return 0;
  
  const elapsedTime = (Date.now() - uploadStartTime.value) / 1000;
  const uploadSpeed = loaded / elapsedTime;
  
  if (uploadSpeed === 0) return 0;
  
  const remainingBytes = total - loaded;
  const remainingTime = remainingBytes / uploadSpeed;
  
  return remainingTime;
};

// ============================================
// UPLOAD CANCEL
// ============================================

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

// ============================================
// MODAL CONTROL
// ============================================

const closeModal = () => {
  // Auto-cancel upload jika ada ongoing upload
  if (uploadCancelSource.value && uploadProgress.value > 0) {
    handleCancelUpload();
    return;
  }

  // Reset
  if (fileInput.value) {
    fileInput.value.value = "";
  }

  formData.value = {
    filename: "",
    file: null,
  };
  selectedTag.value = [];
  selectedGroupTag.value = [];

  uploadProgress.value = 0;
  uploadedSize.value = 0;
  totalSize.value = 0;
  uploadStartTime.value = null;
  estimatedTimeRemaining.value = 0;
  uploadCancelSource.value = null;
  
  emit("close");
};
</script>

<template>
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
        {{ modalTitle }}
      </h2>
      <button
        @click="closeModal"
        class="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <XCircleIcon class="size-7 text-red-500 cursor-pointer"></XCircleIcon>
      </button>
    </div>

    <!-- Modal Body -->
    <div class="p-6 space-y-4">
      <!-- PDF Upload Section -->
      <PDFUploadSection
        v-if="props.mode === 'pdf' && uploadProgress === 0"
        v-model="formData"
        :selectedTags="selectedTag"
        :selectedGroupTags="selectedGroupTag"
        :filteredTags="filteredTags"
        :groupTags="groupTag"
        :tags="tag"
        :listTagInFile="listTagInFile"
        :isDragging="isDragging"
      />

      <!-- Excel Upload Section -->
      <ExcelUploadSection
        v-if="props.mode === 'excel' && uploadProgress === 0"
        v-model="formData"
        :isDragging="isDragging"
      />

      <!-- PDF Edit Section -->
      <div v-if="props.mode === 'pdf' && (props.action === 'edit' || props.type === 'editDocument')">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Nama File
          </label>
          <input
            v-model="formData.filename"
            type="text"
            :placeholder="`Nama saat ini: ${nameFileForPlaceholder}`"
            class="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Tags Section untuk Edit -->
        <div>
          <div class="mb-4">
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Tags File Saat Inia
            </label>
            <div
              v-if="listTagInFile && listTagInFile.length > 0"
              class="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div
                v-for="listTag in listTagInFile"
                :key="listTag.id || listTag"
                class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
              >
                {{ typeof listTag === 'object' ? listTag.name : listTag }}
              </div>
            </div>
            <p v-else class="text-xs text-gray-500">Tidak ada tag pada file ini</p>
          </div>
        </div>
      </div>

      <!-- Progress Bar (appears during upload) -->
      <div v-if="uploadProgress > 0" class="space-y-3">
        <div class="bg-gray-100 rounded-lg p-4">
          <div class="flex justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Upload Progress</span>
            <span class="text-sm font-medium text-gray-700">{{ uploadProgress }}%</span>
          </div>
          <div class="w-full bg-gray-300 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: uploadProgress + '%' }"
            ></div>
          </div>
          
          <div class="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-600">
            <div>
              <p class="font-semibold">{{ formatBytes(uploadedSize) }} / {{ formatBytes(totalSize) }}</p>
            </div>
            <div class="text-right">
              <p v-if="estimatedTimeRemaining > 0" class="font-semibold">
                {{ formatTimeRemaining(estimatedTimeRemaining) }} remaining
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Footer / Actions -->
    <div class="flex items-center justify-between gap-2 p-6 border-t border-gray-200 bg-gray-50">
      <button
        @click="closeModal"
        :disabled="isLoading"
        class="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium text-sm disabled:opacity-50"
      >
        Batal
      </button>

      <div class="flex gap-2">
        <button
          v-if="uploadProgress > 0"
          @click="handleCancelUpload"
          class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium text-sm rounded-lg transition-colors"
        >
          Batalkan Upload
        </button>

        <!-- Edit Button (PDF edit mode only) -->
        <button
          v-if="props.mode === 'pdf' && (props.action === 'edit' || props.type === 'editDocument') && uploadProgress === 0"
          @click="handleUpdate"
          :disabled="isLoading"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {{ isLoading ? "Loading..." : "Update" }}
        </button>

        <!-- Upload Button (create mode only) -->
        <button
          v-if="(props.action === 'create' || (props.type === 'UploadDocument' || props.type === 'ModalSertifikasi')) && uploadProgress === 0"
          @click="handleUpload"
          :disabled="isLoading || !formData.file"
          class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {{ isLoading ? "Loading..." : "Upload" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* No additional styles needed */
</style>
