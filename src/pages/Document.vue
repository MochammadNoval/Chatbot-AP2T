<script setup>
import InputSearch from "../components/InputSearch.vue";
import Modal from "../components/Modal.vue";
import UploadDocumentModal from "../components/UploadDocumentModal.vue";
import { useToast } from "primevue/usetoast";
import { Toast } from "primevue";

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
import { getFiles, updateFiles } from "../services/FileServices";
import { useAuthStores } from "../stores/Auth";
const useAuth = useAuthStores();

// Modal state
const showUploadModal = ref(false);
const showModal = ref(false);
const toast = useToast();
const modalType = ref("category");

const items = ref([]);

const search = (event) => {
  let _items = [...Array(10).keys()];

  items.value = event.query
    ? [...Array(10).keys()].map((item) => event.query + "-" + item)
    : _items;
};

let documents = ref([]);

onMounted(async () => {
  try {
    const res = await getFiles();
    documents.value = res;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.message,
      life: 3000,
    });
  }
});

// Data untuk datatable dokumen
// const documents = ref([
//   {
//     id: 1,
//     fileName: "Proposal Proyek 2026.pdf",
//     category: "Proposal",
//     tags: ["Proyek", "Important"],
//     size: "2.4 MB",
//     date: "2026-02-08",
//   },
//   {
//     id: 2,
//     fileName: "Laporan Kuartalan Q1.docx",
//     category: "Laporan",
//     tags: ["Laporan", "Finance"],
//     size: "1.8 MB",
//     date: "2026-02-07",
//   },
//   {
//     id: 3,
//     fileName: "Kontrak Kerjasama.pdf",
//     category: "Kontrak",
//     tags: ["Legal", "Important"],
//     size: "945 KB",
//     date: "2026-02-05",
//   },
//   {
//     id: 4,
//     fileName: "Data Analisis Pasar.xlsx",
//     category: "Analisis",
//     tags: ["Market", "Data"],
//     size: "3.2 MB",
//     date: "2026-02-03",
//   },
//   {
//     id: 5,
//     fileName: "Panduan Pengguna Aplikasi.pdf",
//     category: "Dokumentasi",
//     tags: ["Guide", "Help"],
//     size: "5.6 MB",
//     date: "2026-01-30",
//   },
//   {
//     id: 6,
//     fileName: "Rencana Strategis 2026.pdf",
//     category: "Strategi",
//     tags: ["Planning", "Management"],
//     size: "2.1 MB",
//     date: "2026-02-09",
//   },
//   {
//     id: 7,
//     fileName: "Budget Allocation Q2.xlsx",
//     category: "Budget",
//     tags: ["Finance", "Planning"],
//     size: "1.5 MB",
//     date: "2026-02-08",
//   },
//   {
//     id: 8,
//     fileName: "Meeting Minutes Feb 2026.docx",
//     category: "Meeting",
//     tags: ["Minutes", "Important"],
//     size: "856 KB",
//     date: "2026-02-10",
//   },
// ]);

// Function untuk preview dokumen
const previewDocument = (doc) => {
  alert(`Preview: ${doc.fileName}`);
};

// Function untuk edit dokumen
const editDocument = async (id) => {
  modalType.value = "editModal";
  showModal.value = true;

  const res = await updateFiles(id);
};

// Function untuk download dokumen
const downloadDocument = (doc) => {
  alert(`Download: ${doc.fileName}`);
};

// Function untuk hapus dokumen
const deleteDocument = (id) => {
  if (confirm("Apakah Anda yakin ingin menghapus dokumen ini?")) {
    documents.value = documents.value.filter((doc) => doc.id !== id);
    alert("Dokumen berhasil dihapus");
  }
};

// Function untuk handle upload dokumen
const handleUploadDocument = async () => {
  try {
    const res = await getFiles();
    documents.value = res;
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
    <UploadDocumentModal
      :isOpen="showUploadModal"
      @close="showUploadModal = false"
      @upload="handleUploadDocument"
    />

    <Modal :isOpen="showModal" @close="showModal = false" :type="modalType" />
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
        @click="showUploadModal = true"
        class="flex bg-blue-500 gap-x-2 px-2 shadow-lg rounded-lg items-center hover:bg-blue-600 transition-colors cursor-pointer"
      >
        <PlusCircleIcon class="size-5 text-white"></PlusCircleIcon>

        <p class="text-white font-semibold p-2 text-sm">Upload Dokumen</p>
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
                    {{ tag }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-2 text-sm text-gray-700">
                {{ (document.filesize / 1024 / 1024).toFixed(2) }} Mb
              </td>
              <td class="px-6 py-2 text-sm text-gray-700">
                {{ new Date(document.upload_time).toLocaleDateString("id-ID") }}
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
                    @click="downloadDocument(document)"
                    class="p-2 cursor-pointer text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                    title="Download"
                  >
                    <ArrowDownTrayIcon class="size-5"></ArrowDownTrayIcon>
                  </button>

                  <!-- Button Hapus -->
                  <button
                    @click="deleteDocument(document.id)"
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
