<script setup>
import { ref } from "vue";
import {
  PlusCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";
import { ProgressSpinner, Toast, useToast } from "primevue";
import { uploadFileAxios } from "../services/FileServices";
import { useRouter } from "vue-router";

defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
});

const router = useRouter();
const toast = useToast();
const isDragging = ref(false);
const fileInput = ref(null);
const emit = defineEmits(["close", "upload"]);

const formData = ref({
  filename: "",
  tag_ids: "",
  file: null,
});

const onDragOver = (event) => {
  event.preventDefault(); // WAJIB agar drop bisa jalan
  isDragging.value = true;
};

const onDragLeave = (event) => {
  // supaya tidak false ketika pindah ke child element
  if (event.currentTarget.contains(event.relatedTarget)) return;
  isDragging.value = false;
};

const onDrop = (event) => {
  event.preventDefault();
  isDragging.value = false;

  const files = Array.from(event.dataTransfer.files);
  if (!files.length) return;

  formData.value.file = files[0]; // ambil file pertama
};

const file = formData.value.file;

// Handle file selection
const handleFileChange = (event) => {
  formData.value.file = event.target.files[0];
};

const handleUpload = () => {
  isLoading.value = true;
  if (!formData.value.file) {
    toast.add({
      severity: "warn",
      summary: "Peringatan",
      detail: "Silakan pilih file terlebih dahulu",
      life: 3000,
    });
    return; // ⬅️ PENTING: hentikan function
  }

  if (formData.value.file.size > 5 * 1024 * 1024) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "file maksimal 5 MB",
      life: 3000,
    });
    return;
  }
  uploadToServer();
};

const uploadToServer = async () => {
  try {
    const dataFile = new FormData();
    dataFile.append("file", formData.value.file);
    dataFile.append("filename", formData.value.filename);
    dataFile.append("tag_ids", JSON.stringify([1]));

    const res = await uploadFileAxios(dataFile);
    toast.add({
      severity: "success",
      summary: "Success",
      detail: "File berhasil diupload",
      life: 3000,
    });

    isLoading.value = false;
    setTimeout(() => {
      emit("upload");
      closeModal();
    }, 2000);
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: err.message || "Upload gagal",
      life: 3000,
    });
    isLoading.value = false;
  }
};

const isLoading = ref(false);

// Reset and close modal

const closeModal = () => {
  formData.value = {
    fileName: "",
    category: "",
    tags: "",
    file: null,
  };
  emit("close");
};
</script>

<template>
  <!-- Modal Backdrop -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/30 bg-opacity-10 z-40 transition-opacity"
    @click="closeModal"
  ></div>

  <!-- Modal -->
  <div
    v-if="isOpen"
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-lg overflow-y-scroll"
  >
    <Toast />
    <!-- Modal Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-200">
      <h2 class="text-xl font-bold text-gray-900">Upload Dokumen</h2>
      <button
        @click="closeModal"
        class="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <XCircleIcon class="size-7 text-red-500 cursor-pointer"></XCircleIcon>
      </button>
    </div>

    <!-- Modal Body -->
    <div class="p-6 space-y-4">
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
          @click="fileInput.click()"
        >
          <input
            ref="fileInput"
            type="file"
            @change="handleFileChange"
            class="w-full opacity-0 absolute cursor-pointer"
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
                  : "Max size 5MB & format PDF"
              }}
            </p>
          </div>
        </div>
      </div>

      <!-- File Name -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Nama File
        </label>
        <input
          v-model="formData.filename"
          type="text"
          placeholder="Masukkan nama file"
          class="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Tags -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Tags (pisahkan dengan koma)
        </label>
        <input
          v-model="formData.tags"
          type="text"
          placeholder="Contoh: penting, finance, project"
          class="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <!-- Modal Footer -->
    <div class="flex gap-3 justify-end p-6 border-t border-gray-200">
      <button
        @click="closeModal"
        class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
      >
        Batal
      </button>
      <button
        @click="handleUpload()"
        :disabled="isLoading"
        class="px-4 py-2 flex gap-x-2 items-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
      >
        <ProgressSpinner
          v-if="isLoading"
          style="width: 25px; height: 25px"
          strokeWidth="8"
          fill="transparent"
          aria-label="Custom ProgressSpinner"
        />
        <div v-else class="flex gap-x-2 items-center">
          <PlusCircleIcon class="size-5 text-white"></PlusCircleIcon>
          <p>Upload</p>
        </div>
      </button>
    </div>
  </div>
</template>
