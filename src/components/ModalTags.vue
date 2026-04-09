<script setup>
import {
  PlusCircleIcon,
  XCircleIcon,
  PencilIcon,
  PlusIcon,
} from "@heroicons/vue/24/outline";
import { useToast } from "primevue";
import { ref, watch } from "vue";
import {
  addGroupTags,
  addTags,
  updateGroupTags,
  updateTag,
} from "../services/Tags";
import { useAuthStores } from "../stores/Auth";
const useAuth = useAuthStores();

const toast = useToast();

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  id: {
    type: [String, Number],
    required: false,
  },
  currentName: {
    type: String,
    required: false,
  },
});

const form = ref({
  name: "",
  selection_type: "",
});

const isLoading = ref(false);

const emit = defineEmits(["close", "add", "isSubmit"]);

// Watcher untuk mengisi form ketika modal dibuka di mode updateTags
watch(
  () => [props.isOpen, props.type, props.currentName],
  ([isOpen, type, currentName]) => {
    if (isOpen && type === "updateTags" && currentName) {
      form.value.name = currentName;
    }
  },
);

const closeModal = () => {
  form.value = {
    name: "",
    groupTags: "",
  };
  emit("close");
};

/**
 * Handle update tag
 */
const handleUpdateTag = async () => {
  if (!form.value.name.trim()) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Nama tag tidak boleh kosong",
      life: 3000,
    });
    return;
  }

  try {
    isLoading.value = true;
    await updateTag(props.id, {
      name: form.value.name,
    });
    toast.add({
      severity: "success",
      summary: "Success",
      detail: "Tag berhasil diupdate",
      life: 3000,
    });
    emit("isSubmit");
    closeModal();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.message || "Gagal mengupdate tag",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
};

const handleAddTags = async () => {
  try {
    const res = await addTags(props.id, form.value.name);
    toast.add({
      severity: "success",
      summary: "Success",
      detail: "tags berhasil ditambahkan",
      life: 3000,
    });
    emit("isSubmit");
    closeModal();
  } catch (error) {
    console.error(error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.message,
      life: 3000,
    });
  }
};

const handleAddGroupTags = async () => {
  try {
    const res = await addGroupTags({
      name: form.value.name,
      selection_type: "MULTIPLE",
    });
    toast.add({
      severity: "success",
      summary: "Success",
      detail: "Group tags berhasil ditambahkan",
      life: 3000,
    });
    emit("isSubmit");
    closeModal();
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: err.message || "Gagal menambahkan group tags",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
};

const handleUpdateGroupTags = async () => {
  console.log(props.id);
  if (!form.value.name.trim()) {
    toast.add({
      severity: "Error",
      summary: "Error",
      detail: "Nama group tags tidak boleh kosong",
      life: 3000,
    });
    return;
  }
  try {
    isLoading.value = true;
    const res = await updateGroupTags(
      {
        name: form.value.name,
        selection_type: "MULTIPLE",
      },
      props.id,
    );
    toast.add({
      severity: "success",
      summary: "Success",
      detail: "Group tags berhasil diupdate",
      life: 3000,
    });
    emit("isSubmit");
    closeModal();
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: err.message || "Gagal mengupdate group tags",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
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
    v-if="isOpen && props.type === 'tambahGroupsTags'"
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-lg overflow-y-scroll"
  >
    <!-- Modal Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-200">
      <span>
        <h2 class="text-xl font-bold text-gray-900">Tambah Group Tags</h2>
        <p class="text-gray-500 text-xs mt-1">Masukkan nama group tags</p>
      </span>
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
          Nama Group Tags
        </label>
        <input
          v-model="form.name"
          type="text"
          placeholder="Masukkan nama kategori"
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
        @click="handleAddGroupTags"
        :disabled="isLoading"
        class="px-4 py-2 flex gap-x-2 items-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        <PlusCircleIcon class="size-5 text-white"></PlusCircleIcon>
        {{ isLoading ? "Tambah..." : "Tambah" }}
      </button>
    </div>
  </div>

  <div
    v-if="isOpen && props.type === 'updateGroupsTags'"
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-lg overflow-y-scroll"
  >
    <!-- Modal Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-200">
      <span>
        <h2 class="text-xl font-bold text-gray-900">Edit Group Tags</h2>
        <p class="text-gray-500 text-xs mt-1">Masukkan nama group tags</p>
      </span>
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
          Nama Group Tags
        </label>
        <input
          v-model="form.name"
          type="text"
          placeholder="Masukkan nama group tags baru"
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
        @click="handleUpdateGroupTags"
        :disabled="isLoading"
        class="px-4 py-2 flex gap-x-2 items-center bg-green-600/80 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
      >
        <PencilIcon class="size-5 text-white"></PencilIcon>
        {{ isLoading ? "Edit..." : "Simpan" }}
      </button>
    </div>
  </div>

  <div
    v-if="isOpen && props.type === 'addTags'"
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-lg overflow-y-scroll"
  >
    <!-- Modal Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-200">
      <span>
        <h2 class="text-xl font-bold text-gray-900">Tambah Tags</h2>
        <p class="text-gray-500 text-xs mt-1">Masukkan nama tags</p>
      </span>
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
          Nama Tags
        </label>
        <input
          v-model="form.name"
          type="text"
          placeholder="Masukkan nama tags baru"
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
        @click="handleAddTags"
        :disabled="isLoading"
        class="px-4 py-2 flex gap-x-2 items-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
      >
        <PlusIcon class="size-5 text-white"></PlusIcon>
        {{ isLoading ? "Tambah..." : "Tambah" }}
      </button>
    </div>
  </div>

  <!-- Modal Update Tags -->
  <div
    v-if="isOpen && props.type === 'updateTags'"
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-lg overflow-y-scroll"
  >
    <!-- Modal Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-200">
      <span>
        <h2 class="text-xl font-bold text-gray-900">Edit Tag</h2>
        <p class="text-gray-500 text-xs mt-1">Ubah nama tag</p>
      </span>
      <button
        @click="closeModal"
        class="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
      >
        <XCircleIcon class="size-7 text-red-500"></XCircleIcon>
      </button>
    </div>

    <!-- Modal Body -->
    <div class="p-6 space-y-4">
      <!-- Tag Name -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Nama Tag
        </label>
        <input
          v-model="form.name"
          type="text"
          placeholder="Masukkan nama tag"
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
        @click="handleUpdateTag"
        :disabled="isLoading"
        class="px-4 py-2 flex gap-x-2 items-center bg-green-600/80 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
      >
        <PencilIcon class="size-5 text-white"></PencilIcon>
        {{ isLoading ? "Edit..." : "Edit" }}
      </button>
    </div>
  </div>
</template>
