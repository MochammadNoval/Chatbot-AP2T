<script setup>
import { onMounted, ref, watch, computed } from "vue";
import { PlusCircleIcon, XCircleIcon } from "@heroicons/vue/24/outline";
import { ProgressSpinner, Toast, useToast } from "primevue";
import {
  getFilesById,
  updateFiles,
  uploadFileAxios,
} from "../services/FileServices";
import { useRouter } from "vue-router";
import CustomMultiSelect from "./CustomMultiSelect.vue";
import { getTagGroups, getTags } from "../services/Tags";
import { useAuthStores } from "../stores/Auth";
import Swal from "sweetalert2";
import axios from "axios";

const useAuth = useAuthStores();

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  idDocument: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});

const groupTag = ref([])
const tag = ref([]);
const selectedTag = ref([]);
const selectedGroupTag = ref([]);

// Computed property untuk filter tags berdasarkan selectedGroupTag
const filteredTags = computed(() => {
  if (selectedGroupTag.value.length === 0) {
    return [];
  }
  
  return tag.value.filter((t) =>
    selectedGroupTag.value.includes(t.tag_group_id)
  );
});

// Watch untuk membersihkan selectedTag ketika selectedGroupTag berubah
watch(selectedGroupTag, () => {

  if (selectedGroupTag.value.length === 0) {
    // Jika tidak ada group tags yang dipilih, clear selectedTag
    selectedTag.value = [];
  } else {
    console.log("group tag dipilih", selectedGroupTag.value)
    // Jika ada group tags yang dipilih, hapus selectedTag yang tidak sesuai
    selectedTag.value = selectedTag.value.filter((tagId) => {
      const tagObj = tag.value.find((t) => t.id === tagId);
      return tagObj && selectedGroupTag.value.includes(tagObj.tag_group_id);
    });
  }
}, {immediate : true});

const nameFileForPlaceholder = ref("");
const fileById = ref("");
const listTagInFile = ref([]);
const isLoading = ref(false);
const toast = useToast();
const isDragging = ref(false);
const fileInput = ref(null);
const aiIndexStatus = ref(false);
const emit = defineEmits(["close", "upload", "completed"]);

// Progress tracking states
const uploadProgress = ref(0);
const uploadedSize = ref(0);
const totalSize = ref(0);
const uploadStartTime = ref(null);
const estimatedTimeRemaining = ref(0);
const uploadCancelSource = ref(null);

const removeTag = (tagId) => {
  const target =
    props.type === "UploadDocument"
      ? selectedTag
      : props.type === "editDocument"
        ? listTagInFile
        : null;

  if (!target) return;

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

// Clear/cancel selected file
const clearFile = () => {
  formData.value.file = null;
  formData.value.filename = "";
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const formData = ref({
  filename: "",
  tag_ids: "",
  file: null,
});

watch([() => props.isOpen, () => props.idDocument], async ([isOpen, id]) => {
  if (isOpen !== true || !id) return;

  try {
    useAuth.setLoading(true);
    fileById.value = await getFilesById(id);
    nameFileForPlaceholder.value = fileById.value.filename;
    tag.value = await getTags();
    listTagInFile.value = fileById.value.tags;
    aiIndexStatus.value = fileById.value.ai_index || false;
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

onMounted(async () => {
  try {
    tag.value = await getTags();
    groupTag.value = await getTagGroups()

  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.message || "Gagal memuat dokumen",
      life: 3000,
    });
  }
});

const onDragOver = (event) => {
  event.preventDefault(); // WAJIB agar drop bisa jalan
  isDragging.value = true;
};

const onDragLeave = (event) => {
  if (event.currentTarget.contains(event.relatedTarget)) return;
  isDragging.value = false;
};

const onDrop = (event) => {
  event.preventDefault();
  isDragging.value = false;

  const files = Array.from(event.dataTransfer.files);
  if (!files.length) return;

  if(files && files[0]){
    formData.value.file = files[0]; // ambil file perta ma
    formData.value.filename = "";
    // Reset input value
    event.target.value = null;
  }

};

// Handle file selection
const handleFileChange = (event) => {
  const files = event.target.files;
  if (files && files[0]) {
    formData.value.file = files[0];
    formData.value.filename = "";
    // Reset input value so user can select the same file again if needed
    event.target.value = "";
  }
};

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

const handleToggleAiIndex = async () => {
  try {
    isLoading.value = true;
    await updateFiles(props.idDocument, {
      ai_index: aiIndexStatus.value,
    });

    toast.add({
      severity: "success",
      summary: "Sukses",
      detail: `AI Index berhasil diubah menjadi ${aiIndexStatus.value ? "enable" : "disable"}`,
      life: 3000,
    });
  } catch (error) {
    aiIndexStatus.value = !aiIndexStatus.value;
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.message || "Gagal mengubah AI Index",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
};

const getDocumentById = async (id) => {
  try {
    const res = await getFilesById(id);
    nameFileForPlaceholder.value = res.filename;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.message || "Gagal memuat dokumen",
      life: 3000,
    });
  }
};

const handleUpload = () => {
  if (!formData.value.file) {
    toast.add({
      severity: "warn",
      summary: "Peringatan",
      detail: "Silakan pilih file terlebih dahulu",
      life: 3000,
    });
    return; // ⬅️ PENTING: hentikan function
  }

  if (formData.value.file.size > 100 * 1024 * 1024) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "file maksimal 100 MB",
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
    dataFile.append("tag_ids", JSON.stringify(selectedTag.value || []));
    dataFile.append("ai_index", aiIndexStatus.value);

    // Initialize cancel token for this upload
    uploadCancelSource.value = axios.CancelToken.source();

    // Initialize progress tracking
    uploadStartTime.value = Date.now();
    totalSize.value = formData.value.file.size;

    const res = await uploadFileAxios(dataFile, (progressEvent) => {
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
      detail: "File berhasil diupload",
      life: 3000,
    });

    isLoading.value = false;
    
    // Reset file input element dan formData secara langsung
    if (fileInput.value) {
      fileInput.value.value = "";
    }
    
    // Reset formData.file agar UI tidak menampilkan file lagi
    formData.value.file = null;
    formData.value.filename = "";
    
    setTimeout(() => {
      emit("completed");
      closeModal();
    }, 2000);
  } catch (err) {
    // Don't show toast if upload was cancelled (already shown in handleCancelUpload)
    if (err.message !== "Upload dibatalkan") {
      console.log(err.message)
      toast.add({
        severity: "error",
        summary: "Error",
        detail: err.message || "Upload gagal",
        life: 3000,
      });
    }
  } finally{
    isLoading.value = false;
    uploadCancelSource.value = null;
  }
};

// Format bytes to readable format (KB, MB, GB)
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Format seconds to human-readable time
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

// Calculate estimated time remaining
const calculateTimeRemaining = (loaded, total) => {
  if (!uploadStartTime.value) return 0;
  
  const elapsedTime = (Date.now() - uploadStartTime.value) / 1000; // in seconds
  const uploadSpeed = loaded / elapsedTime; // bytes per second
  
  if (uploadSpeed === 0) return 0;
  
  const remainingBytes = total - loaded;
  const remainingTime = remainingBytes / uploadSpeed;
  
  return remainingTime;
};

// Handle cancel upload
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
    
    // Reset file ketika upload dibatalkan
    if (fileInput.value) {
      fileInput.value.value = "";
    }
    formData.value.file = null;
    formData.value.filename = "";
    
    toast.add({
      severity: "info",
      summary: "Info",
      detail: "Upload dibatalkan cui",
      life: 3000,
    });
  }
};

// Reset and close modal
const closeModal = () => {
  // Auto-cancel upload if there's an ongoing upload
  if (uploadCancelSource.value && uploadProgress.value > 0) {
    handleCancelUpload();
    return;
  }

  // Reset file input element
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
    v-if="props.isOpen "
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-lg overflow-y-auto max-h-[90vh]"
  >
    <Toast />
    <!-- Modal Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-200">
      <h2 class="text-xl font-bold text-gray-900">
        {{
          props.type === "UploadDocument" ? "Upload Document" : "Edit Document"
        }}
      </h2>
      <button
        @click="closeModal"
        class="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <XCircleIcon
          class="size-7 text-red-500 cursor-pointer"
        ></XCircleIcon>
      </button>
    </div>

    <!-- Modal Upload Document Body -->
    <div class="p-6 space-y-4" v-if="props.type === 'UploadDocument' && uploadProgress === 0">
      <!-- File Input -->
      <div>
        <label
          class="block text-sm font-semibold text-gray-700 mb-2"
          for="uploadFile"
        >
          Pilih File
        </label>
        <div
          class="border-dashed border rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
          :class="{
            'border-blue-500': isDragging,
            'border-red-500': !isDragging,
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
            aria-label="Upload file"
            id="uploadFile"
          />
          <div class="pointer-events-none">
            <p class="text-gray-600 text-sm font-semibold">
              {{
                formData.file
                  ? formData.file.name
                  : "Drag atau click upilih file"
              }}
            </p>
            <p class="text-gray-400 text-xs mt-1">
              {{
                formData.file
                  ? `${(formData.file.size / 1024 / 1024).toFixed(2)} MB`
                  : "Max size 100MB & format PDF"
              }}
            </p>
          </div>
          
          <!-- Close button untuk membatalkan file -->
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

      <div>
        <span class="flex gap-x-2 ">  
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
        />
        <p class="text-xs text-gray-500 mt-1">
          Format: PDF akan ditambahkan otomatis
        </p>
      </div>

      <!-- Group Tags -->
      <div>
        <!-- Selected group tags display -->
        <div v-if="selectedGroupTag.length > 0" class="mb-3 ">
          <div class="flex flex-wrap gap-2">
            <div
              v-for="selected in selectedGroupTag"
              :key="selected"
              class="px-3 py-1.5 bg-blue-100 border border-blue-300 text-blue-800 rounded-full text-sm font-medium flex items-center gap-2 "
            >
              {{ groupTag.find((t) => t.id === selected)?.name || selected }}
              <button
                @click="removeTag(selected)"
                class="hover:bg-blue-300 cursor-pointer rounded-full p-0.5 transition-colors"
                type="button"
                title="Hapus tag"
              >
                <svg
                  class="size-4 text-blue-800"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <button
              @click="clearAllGroupTags"
              class="ml-auto text-xs cursor-pointer text-red-500 hover:text-gray-700 underline transition-colors"
              type="button"
            >
              Hapus Semua
            </button>
          </div>
        </div>

        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Pilih Group Tags
        </label>
        <CustomMultiSelect
          v-model="selectedGroupTag"
          :options="groupTag"
          optionLabel="name"
          optionValue="id"
          placeholder="Pilih tags untuk file ini..."
          :multiple="true"
          :hideSelectedItems="true"
        />

        <!-- section Tag -->
        <div v-if="selectedTag.length > 0" class="flex flex-wrap gap-2 mt-4 ">
            <div
              v-for="selected in selectedTag"
              :key="selected"
              class="px-3 py-1.5 bg-blue-100 border border-blue-300 text-blue-800 rounded-full text-sm font-medium flex items-center gap-2"
            >
              {{ tag.find((t) => t.id === selected)?.name || selected }}
              <button
                @click="removeTag(selected)"
                class="hover:bg-blue-300 cursor-pointer rounded-full p-0.5 transition-colors"
                type="button"
                title="Hapus tag"
              >
                <svg
                  class="size-4 text-blue-800"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              
            </div>
             <button
              @click="clearAllTags"
              class="ml-auto text-xs cursor-pointer text-red-500 hover:text-gray-700 underline transition-colors"
              type="button"
            >
              Hapus Semua
            </button>
          </div>

        <!-- Select Tags berdasarkan GroupTags yang dipilih -->
        <label class="block text-sm font-semibold text-gray-700 mb-2 mt-2">
          Pilih Tags
        </label>
        <CustomMultiSelect
          v-model="selectedTag"
          :options="filteredTags"
          optionLabel="name"
          optionValue="id"
          placeholder="Pilih tags untuk file ini..."
          :multiple="true"
          :hideSelectedItems="true"
        />
        <p class="text-xs text-gray-500 mt-1">
          {{ selectedTag.length }} tag dipilih
        </p>

      </div>
            <!-- AI Index Toggle -->
      <div class="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex flex-col">
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            AI Indexing
          </label>
          <p class="text-xs text-gray-600">
            {{ aiIndexStatus ? "Aktif" : "Non Aktif" }}
          </p>
        </div>
        <button
          @click="aiIndexStatus = !aiIndexStatus; "
          :disabled="isLoading"
          :class="{
            'bg-green-500 hover:bg-green-600': aiIndexStatus,
            'bg-gray-400 hover:bg-gray-500': !aiIndexStatus,
          }"
          class="relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          <span
            :class="{
              'translate-x-5': aiIndexStatus,
              'translate-x-0': !aiIndexStatus,
            }"
            class="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
          />
        </button>
      </div>
    </div>

    <!-- Modal Edit Document Body -->
    <div class="p-6 space-y-4" v-if="props.type === 'editDocument'">
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

      <!-- AI Index Toggle -->
      <div class="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex flex-col">
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            AI Indexing
          </label>
          <p class="text-xs text-gray-600">
            {{ aiIndexStatus ? "Diaktifkan" : "Dinonaktifkan" }}
          </p>
        </div>
        <button
          @click="aiIndexStatus = !aiIndexStatus; handleToggleAiIndex()"
          :disabled="isLoading"
          :class="{
            'bg-green-500 hover:bg-green-600': aiIndexStatus,
            'bg-gray-400 hover:bg-gray-500': !aiIndexStatus,
          }"
          class="relative inline-flex h-8 w-14 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          <span
            :class="{
              'translate-x-7': aiIndexStatus,
              'translate-x-1': !aiIndexStatus,
            }"
            class="inline-block h-6 w-6 transform rounded-full bg-white transition-transform"
          />
        </button>
      </div>

      <!-- Tags Section -->
      <div>
        <!-- Tags Sebelumnya -->
        <div class="mb-4">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Tags File Saat Ini
          </label>
          <div
            v-if="listTagInFile && listTagInFile.length > 0"
            class="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div
              v-for="listTag in listTagInFile"
              :key="listTag"
              class="px-3 py-1.5 bg-green-100  text-green-800 rounded-full text-sm font-medium flex items-center gap-2"
            >
              {{ tag.find((t) => t.id === listTag)?.name || listTag.name }}
              <button
                @click="removeTag(listTag)"
                class="hover:bg-green-300 cursor-pointer rounded-full p-0.5 transition-colors"
                type="button"
                title="Hapus tag"
              >
                <svg
                  class="size-4 text-green-800"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <button
              @click="clearAllTags"
              class="ml-auto text-xs cursor-pointer text-gray-500 hover:text-gray-700 underline transition-colors"
              type="button"
            >
              Hapus Semua
            </button>
          </div>
          <div
            v-else
            class="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            File ini belum memiliki tags
          </div>
        </div>

        <!-- Section untuk Tambah Tags Baru -->
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Tambahkan Tags Baru
        </label>
        <CustomMultiSelect
          @change="listTagInFile"
          v-model="listTagInFile"
          :options="tag"
          optionLabel="name"
          optionValue="id"
          placeholder="Pilih tags tambahan..."
          :multiple="true"
          :hideSelectedItems="true"
        />
      </div>
    </div>


    <!-- Modal untuk sertifikasi -->
    <div class="p-6 space-y-4" v-if="props.type === 'ModalSertifikasi' && uploadProgress === 0">
      <!-- File Input -->
      <div>
        <label
          class="block text-sm font-semibold text-gray-700 mb-2"
          for="uploadFile"
        >
          Pilih File
        </label>
        <div
          class="border-dashed border rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
          :class="{
            'border-blue-500': isDragging,
            'border-red-500': !isDragging,
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
            aria-label="Upload file"
            id="uploadFile"
          />
          <div class="pointer-events-none">
            <p class="text-gray-600 text-sm font-semibold">
              {{
                formData.file
                  ? formData.file.name
                  : "Drag atau click upilih file"
              }}
            </p>
            
            <p class="text-gray-400 text-xs mt-1">
  {{
    formData.file
      ? `${(formData.file.size / 1024 / 1024).toFixed(2)} MB`
      : props.type === "UploadDocument"
        ? "Max size 100MB & format PDF"
        : "Max size 100MB & format Excel"
  }}
</p>

          </div>
          
          <!-- Close button untuk membatalkan file -->
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

      <div>
        <span class="flex gap-x-2 ">  
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
        />
        <p class="text-xs text-gray-500 mt-1">
          Format: Excel akan ditambahkan otomatis
        </p>
      </div>

    </div>


    <!-- Modal Footer -->
    <div class="flex flex-col gap-3 p-6 border-t border-gray-200">
      <!-- Progress Section (visible during upload) -->
      <div v-if="isLoading && uploadProgress > 0" class="space-y-2 overflow-hidden">
        <!-- Progress Bar -->
        <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            class="bg-blue-600 h-full transition-all duration-300 ease-out"
            :style="{ width: uploadProgress + '%' }"
          ></div>
        </div>

        <!-- Progress Stats -->
        <div class="grid grid-cols-3 gap-2 text-xs text-gray-600">
          <div class="text-center">
            <p class="font-semibold text-lg text-gray-900">{{ uploadProgress }}%</p>
            <p>Progress</p>
          </div>
          <div class="text-center">
            <p class="font-semibold text-gray-900">
              {{ formatBytes(uploadedSize) }}/{{ formatBytes(totalSize) }}
            </p>
            <p>Uploaded</p>
          </div>
          <div class="text-center">
            <p class="font-semibold text-gray-900">
              {{ formatTimeRemaining(estimatedTimeRemaining) }}
            </p>
            <p>Remaining</p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 justify-end">
        <!-- Dynamic Cancel/Close Button --->
        <button
          @click="uploadProgress > 0 ? handleCancelUpload() : closeModal()"
          :class="{
            'text-red-700 border-red-300 hover:bg-red-50': uploadProgress > 0,
            'text-gray-700 border-gray-300 hover:bg-gray-50': uploadProgress === 0,
          }"
          class="px-4 py-2 border rounded-lg transition-colors font-medium"
        >
          {{ uploadProgress > 0 ? "Batalkan Upload" : "Batal" }}
        </button>

        <!-- Upload/Save Button -->
        <button
          @click="props.type === 'editDocument' ? handleUpdate() : handleUpload()"
          :disabled="isLoading && uploadProgress > 0"
          class="px-4 py-2 flex gap-x-2 items-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
        >
          <ProgressSpinner
            v-if="isLoading && uploadProgress === 0"
            style="width: 25px; height: 25px"
            strokeWidth="8"
            fill="transparent"
            aria-label="Custom ProgressSpinner"
          />
          <div v-else class="flex gap-x-2 items-center">
            <PlusCircleIcon class="size-5 text-white"></PlusCircleIcon>
            <p>{{ props.type === "editDocument" ? "Simpan" : "upload" }}</p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
  transition: background 0.2s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.8);
}

/* Firefox scrollbar */
html {
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
  scrollbar-width: thin;
}
</style>