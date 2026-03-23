<script setup>
import InputSearch from "../components/InputSearch.vue";
import DocumentModal from "../components/DocumentModal.vue";
import { useToast } from "primevue/usetoast";
import Swal from "sweetalert2";

import {
  FunnelIcon,
  PlusCircleIcon,
  EyeIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  FolderIcon,
} from "@heroicons/vue/24/outline";

import { onMounted, ref } from "vue";
import {
  deleteFile,
  getFiles,
  updateFiles,
  downloadFile,
} from "../services/FileServices";
import { useAuthStores } from "../stores/Auth";
const useAuth = useAuthStores();

// Modal state
const showModal = ref(false);
const toast = useToast();
const modalType = ref("category");
const idDocument = ref(0);

const items = ref([]);

const search = (event) => {
  let _items = [...Array(10).keys()];

  items.value = event.query
    ? [...Array(10).keys()].map((item) => event.query + "-" + item)
    : _items;
};

let documents = ref([]);
let tags = ref([]);

const initialize = async () => {
  showModal.value = false;
  try {
    useAuth.setLoading(true);
    const res = await getFiles();
    documents.value = res.files;
    useAuth.setLoading(false);
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.message || "Gagal memuat dokumen",
      life: 3000,
    });
  }
};

onMounted(async () => {
  initialize();
});

// Function untuk preview dokumen
const previewDocument = (doc) => {
  alert(`Preview: ${doc.fileName}`);
};

// Function untuk edit dokumen
const editDocument = async (id) => {
  modalType.value = "editDocument";
  idDocument.value = id;
  showModal.value = true;
};

// Function untuk hapus dokumen
const handleDeleteFile = async (id) => {
  try {
    const result = await Swal.fire({
      title: "Hapus Data?",
      text: "Apakah anda yakin ingin hapus dokumen?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Batal",
      confirmButtonText: "Ya, Hapus!",
    });

    if (result.isConfirmed) {
      await deleteFile(id);
      await initialize();
      Swal.fire({
        title: "Berhasil!",
        text: "Dokumen berhasil dihapus!",
        icon: "success",
      });
    }
  } catch (error) {
    useAuth.setLoading(false);
    Swal.fire({
      title: "Gagal!",
      text: error,
      icon: "error",
    });
  }
};

const handledownloadFile = async (id) => {
  console.log(id);
  try {
    const res = await downloadFile(id);
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.message || "Gagal memuat dokumen",
      life: 3000,
    });
  }
};
</script>

<template>
  <div class="p-4">
    <!-- Upload Document Modal -->
    <DocumentModal
      @close="showModal = false"
      @completed="initialize"
      :isOpen="showModal"
      :type="modalType"
      :idDocument="idDocument"
    />

    <section class="flex">
      <span>
        <h1 class="text-black font-bold">Manajemen Dokumen</h1>
        <p class="text-gray-500 text-xs">Kelola dokumen dengan format PDF</p>
      </span>

      <router-link
        to="/tags"
        @click="
          showModal = true;
          modalType = 'addCategory';
        "
        class="flex bg-white ms-auto me-2 gap-x-2 px-2 shadow-lg rounded-lg items-center cursor-pointer"
      >
        <FolderIcon class="size-5 text-black"></FolderIcon>
        <p class="text-black font-semibold p-2 text-sm">
          Kelola group tags dan tags
        </p>
      </router-link>
      <button
        @click="
          showModal = true;
          modalType = 'UploadDocument';
        "
        class="flex bg-blue-500 gap-x-2 px-2 shadow-lg rounded-lg items-center hover:bg-blue-600 transition-colors cursor-pointer"
      >
        <PlusCircleIcon class="size-5 text-white"></PlusCircleIcon>

        <p class="text-white font-semibold p-2 text-sm">Upload Document</p>
      </button>
    </section>

    <InputSearch class="bg-[#F5FAFF] mt-8" />
    <section class="flex items-center">
      <FunnelIcon class="size-6 text-slate-500"></FunnelIcon>
      <p class="font-semibold text-black ms-2">Filter :</p>
      <form class="max-w-sm ms-2 flex gap-x-2">
        <select
          id="countries"
          class="block w-full px-3 py-2.5 bg-[#F5FAFF] border border-default-medium text-heading text-xs rounded-base focus:ring-brand focus:border-brand font-semibold shadow-xs placeholder:text-body"
        >
          <option selected disabled="">Semua kategori</option>
        </select>
        <select
          id="countries"
          class="block w-full px-3 py-2.5 bg-[#F5FAFF] border border-default-medium text-heading text-xs rounded-base focus:ring-brand focus:border-brand font-semibold shadow-xs placeholder:text-body"
        >
          <option selected disabled="">Semua tags</option>
        </select>
      </form>
    </section>

    <!-- Datatable Dokumen -->
    <section class="mt-4">
      <div class="overflow-x-auto shadow-md rounded-lg">
        <table class="w-full bg-white">
          <thead class="bg-blue-600 text-white">
            <tr>
              <th class="px-6 py-3 text-left text-sm font-semibold">
                Nama File
              </th>

              <th class="px-6 py-3 text-left text-sm font-semibold">Tags</th>
              <th class="px-6 py-3 text-left text-sm font-semibold">Ukuran</th>
              <th class="px-6 py-3 text-left text-sm font-semibold">Tanggal</th>
              <th class="px-6 py-3 text-center text-sm font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="(document, index) in documents"
              :key="document.id"
              class="hover:bg-gray-50 transition-colors"
              :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
            >
              <td class="px-4 py-2 text-xs font-medium text-gray-900">
                {{ document.filename }}
              </td>

              <td class="px-6 py-2 text-sm text-gray-700">
                <div class="flex gap-2">
                  <span
                    v-for="tag in document.tags"
                    :key="tag"
                    class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                  >
                    {{ tag.name }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-2 text-sm text-gray-700">
                {{ (document.size / 1024 / 1024).toFixed(2) }} Mb
              </td>
              <td class="px-6 py-2 text-sm text-gray-700">
                {{ new Date(document.created_at).toLocaleDateString("id-ID") }}
              </td>
              <td class="px-6 py-2 text-center">
                <div class="flex justify-center gap-2">
                  <!-- Button Preview -->
                  <button
                    @click="previewDocument(document)"
                    class="p-2 cursor-pointer text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Preview"
                  >
                    <EyeIcon class="size-5"></EyeIcon>
                  </button>

                  <!-- Button Edit -->
                  <button
                    @click="editDocument(document.id)"
                    class="p-2 cursor-pointer text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <PencilIcon class="size-5"></PencilIcon>
                  </button>

                  <!-- Button Download -->
                  <button
                    @click="handledownloadFile(document.id)"
                    class="p-2 cursor-pointer text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                    title="Download"
                  >
                    <ArrowDownTrayIcon class="size-5"></ArrowDownTrayIcon>
                  </button>

                  <!-- Button Hapus -->
                  <button
                    @click="handleDeleteFile(document.id)"
                    class="p-2 cursor-pointer text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <TrashIcon class="size-5"></TrashIcon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="documents.length === 0" class="text-center py-8 mt-4">
        <p class="text-gray-500 text-sm">Tidak ada dokumen yang ditemukan</p>
      </div>
    </section>
  </div>
</template>
