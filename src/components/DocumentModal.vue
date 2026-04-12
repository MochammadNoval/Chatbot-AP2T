<script setup>
import { onMounted, ref, watch } from "vue";
import { PlusCircleIcon, XCircleIcon } from "@heroicons/vue/24/outline";
import { ProgressSpinner, Toast, useToast } from "primevue";
import {
  getFilesById,
  updateFiles,
  uploadFileAxios,
} from "../services/FileServices";
import { useRouter } from "vue-router";
import CustomMultiSelect from "./CustomMultiSelect.vue";
import { getTags } from "../services/Tags";
import { useAuthStores } from "../stores/Auth";
import Swal from "sweetalert2";

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

const tag = ref([]);
const selectedTag = ref([]);
const nameFileForPlaceholder = ref("");
const fileById = ref("");
const listTagInFile = ref([]);
const isLoading = ref(false);
const toast = useToast();
const isDragging = ref(false);
const fileInput = ref(null);
const emit = defineEmits(["close", "upload", "completed"]);

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

  formData.value.file = files[0]; // ambil file pertama
};

// Handle file selection
const handleFileChange = (event) => {
  formData.value.file = event.target.files[0];
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

    const res = await uploadFileAxios(dataFile);
    toast.add({
      severity: "success",
      summary: "Success",
      detail: "File berhasil diupload",
      life: 3000,
    });

    isLoading.value = false;
    setTimeout(() => {
      emit("completed");
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

// Reset and close modal
const closeModal = () => {
  formData.value = {
    fileName: "",
    category: "",
    tags: "",
    file: null,
  };
  selectedTag.value = 0;
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
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-lg overflow-y-scroll"
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
        :disabled="isLoading"
        class="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <XCircleIcon
          class="size-7 text-red-500 cursor-pointer"
          :class="{ 'opacity-50': isLoading }"
        ></XCircleIcon>
      </button>
    </div>

    <!-- Modal Upload Document Body -->
    <div class="p-6 space-y-4" v-if="props.type === 'UploadDocument'">
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

      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Nama File
        </label>
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

      <!-- Tags -->
      <div>
        <!-- Selected tags display -->
        <div v-if="selectedTag.length > 0" class="mb-3">
          <div class="flex flex-wrap gap-2">
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
              class="ml-auto text-xs cursor-pointer text-gray-500 hover:text-gray-700 underline transition-colors"
              type="button"
            >
              Hapus Semua
            </button>
          </div>
        </div>

        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Pilih Tags
        </label>
        <CustomMultiSelect
          v-model="selectedTag"
          :options="tag"
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
              class="px-3 py-1.5 bg-green-100 border border-green-300 text-green-800 rounded-full text-sm font-medium flex items-center gap-2"
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

    <!-- Modal Footer -->
    <div class="flex gap-3 justify-end p-6 border-t border-gray-200">
      <button
        @click="closeModal"
        :disabled="isLoading"
        class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors font-medium"
      >
        Batal
      </button>
      <button
        @click="props.type === 'editDocument' ? handleUpdate() : handleUpload()"
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
          <p>{{ props.type === "editDocument" ? "Simpan" : "upload" }}</p>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped></style>
