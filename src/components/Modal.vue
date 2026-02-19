<script setup>
import {
  PlusCircleIcon,
  XCircleIcon,
  PencilIcon,
} from "@heroicons/vue/24/outline";
import { ref } from "vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});

const formData = ref({
  namaTags: "",
  groupTags: "",
});

const emit = defineEmits(["close", "add"]);

const closeModal = () => {
  formData.value = {
    namaTags: "",
    groupTags: "",
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
    v-if="isOpen && props.type === 'addCategory'"
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-lg overflow-y-scroll"
  >
    <!-- Modal Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-200">
      <h2 class="text-xl font-bold text-gray-900">Tambah Kategori</h2>
      <button
        @click="closeModal"
        class="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
      >
        <XCircleIcon class="size-7 text-red-500"></XCircleIcon>
      </button>
    </div>

    <!-- Modal Body -->
    <div class="p-6 space-y-4">
      <!-- File Name -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Nama Kategori
        </label>
        <input
          v-model="formData.fileName"
          type="text"
          placeholder="Masukkan nama kategori"
          class="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Tags -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Tags
        </label>
        <input
          v-model="formData.tags"
          type="text"
          placeholder="Contoh:  finance, project"
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
        @click="handleUpload"
        :disabled="isLoading"
        class="px-4 py-2 flex gap-x-2 items-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        <PlusCircleIcon class="size-5 text-white"></PlusCircleIcon>
        {{ isLoading ? "Uploading..." : "Upload" }}
      </button>
    </div>
  </div>

  <!-- Modal -->
  <div
    v-else-if="isOpen && props.type === 'editModal'"
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-lg overflow-y-scroll"
  >
    <!-- Modal Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-200">
      <h2 class="text-xl font-bold text-gray-900">Edit Dokumen</h2>
      <button
        @click="closeModal"
        class="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
      >
        <XCircleIcon class="size-7 text-red-500"></XCircleIcon>
      </button>
    </div>

    <!-- Modal Body -->
    <div class="p-6 space-y-4">
      <!-- File Name -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Nama File
        </label>
        <input
          v-model="formData.fileName"
          type="text"
          placeholder="Masukkan nama file"
          class="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Tags -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Tags
        </label>
        <input
          v-model="formData.tags"
          type="text"
          placeholder="Contoh:  finance, project"
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
        @click="handleUpload"
        :disabled="isLoading"
        class="px-4 py-2 flex gap-x-2 items-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        <PencilIcon class="size-5 text-white"></PencilIcon>
        {{ isLoading ? "Proses..." : "Update" }}
      </button>
    </div>
  </div>

  <!-- Modal manajemen user -->
  <div
    v-else-if="isOpen && props.type === 'manajemenUser'"
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-lg overflow-y-scroll"
  >
    <!-- Modal Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-200">
      <h2 class="text-lg font-bold text-gray-900">Tambah Pengguna Baru</h2>
      <button
        @click="closeModal"
        class="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
      >
        <XCircleIcon class="size-7 text-red-500"></XCircleIcon>
      </button>
    </div>

    <!-- Modal Body -->
    <div class="p-6 space-y-4">
      <!-- File Name -->
      <div class="space-y-2">
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Nama Lengkap
        </label>
        <input
          v-model="formData.fileName"
          type="text"
          placeholder="Masukkan nama file"
          class="w-full px-4 py-1 text-black border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Username
        </label>
        <input
          v-model="formData.fileName"
          type="text"
          placeholder="Masukkan nama file"
          class="w-full px-4 py-1 text-black border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Email
        </label>
        <input
          v-model="formData.fileName"
          type="text"
          placeholder="Masukkan nama file"
          class="w-full px-4 py-1 text-black border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Password
        </label>
        <input
          v-model="formData.fileName"
          type="text"
          placeholder="Masukkan nama file"
          class="w-full px-4 py-1 text-black border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Role
        </label>
        <select
          name=""
          id=""
          class="w-full px-4 py-1 text-sm text-black border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Pilih Role Pengguna</option>
        </select>
      </div>
    </div>

    <!-- Modal Footer -->
    <div class="flex gap-3 justify-end p-6 border-t border-gray-200">
      <button
        @click="closeModal"
        class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-md cursor-pointer"
      >
        Batal
      </button>
      <button
        @click="handleUpload"
        :disabled="isLoading"
        class="px-4 py-2 flex gap-x-2 items-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-md cursor-pointer"
      >
        <PlusCircleIcon class="size-5 text-white"></PlusCircleIcon>
        {{ isLoading ? "Proses..." : "Tambah" }}
      </button>
    </div>
  </div>
</template>
