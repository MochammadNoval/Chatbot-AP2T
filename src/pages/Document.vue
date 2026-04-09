<script setup>
import InputSearch from "../components/InputSearch.vue";
import DocumentModal from "../components/DocumentModal.vue";
import TagSearchFilter from "../components/TagSearchFilter.vue";
import { useToast } from "primevue/usetoast";
import Swal from "sweetalert2";
import api from "../services/Api";

import {
  FunnelIcon,
  PlusCircleIcon,
  EyeIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  FolderIcon,
} from "@heroicons/vue/24/outline";

import { onMounted, ref, computed } from "vue";
import {
  deleteFile,
  getFiles,
  downloadFile,
  getFilesById,
} from "../services/FileServices";
import { useAuthStores } from "../stores/Auth";
import { getTagGroups, getTags } from "../services/Tags";
import Pagination from "../components/Pagination.vue";
const useAuth = useAuthStores();

const showModal = ref(false);
const toast = useToast();
const modalType = ref("category");
const idDocument = ref(0);
const tagGroup = ref("");
const selectedGroupForFilter = ref(null);
const selectedTagObjects = ref([]); // Store selected tag objects
const isFilterLoading = ref(false); // Loading state for filter

const items = ref([]);
let documents = ref([]);
let allDocuments = ref([]); // Menyimpan semua dokumen original
let tags = ref([]);
let searchQuery = ref(""); // Menyimpan search query
let currentPage = ref(1); // Halaman saat ini
const itemsPerPage = 3; // Items per halaman

// Computed untuk paginated documents
const paginatedDocuments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return documents.value.slice(start, end);
});

const search = (event) => {
  let _items = [...Array(10).keys()];

  items.value = event.query
    ? [...Array(10).keys()].map((item) => event.query + "-" + item)
    : _items;
};

const initialize = async () => {
  showModal.value = false;
  try {
    useAuth.setLoading(true);
    const res = await getFiles();
    documents.value = res.files;
    allDocuments.value = res.files; // Simpan data original
    searchQuery.value = ""; // Reset search query
    currentPage.value = 1; // Reset pagination ke page 1
    useAuth.setLoading(false);
    console.log(documents.value);
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
  tagGroup.value = await getTagGroups();
  tags.value = await getTags();
});

// Function untuk preview dokumen di tab baru
const previewDocument = async (doc) => {
  try {
    const response = await api.get(`/files/${doc.id}/preview`, {
      responseType: "blob",
    });

    const fileURL = URL.createObjectURL(response.data);
    window.open(fileURL, "_blank");
  } catch (error) {
    console.error("Preview error:", error);
  }
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

/**
 * Perform live search based on filename
 * @param {string} query - Search query
 */
const performSearch = (query) => {
  searchQuery.value = query.toLowerCase(); // Simpan search query
  currentPage.value = 1; // Reset pagination ke page 1 saat search

  if (!searchQuery.value.trim()) {
    // Jika search kosong, tampilkan semua dokumen dari allDocuments
    documents.value = [...allDocuments.value];
  } else {
    // Filter dokumen berdasarkan filename
    documents.value = allDocuments.value.filter((doc) =>
      doc.filename.toLowerCase().includes(searchQuery.value),
    );
  }
};

const handleFilterByTags = async () => {
  try {
    isFilterLoading.value = true;

    // Reset search query dan pagination saat filter tag berubah
    searchQuery.value = "";
    currentPage.value = 1; // Reset pagination ke page 1

    // Jika tidak ada tag yang dipilih, ambil semua data
    if (selectedTagObjects.value.length === 0) {
      await initialize();
    } else {
      // Extract tag IDs dari selected tag objects
      const tagIds = selectedTagObjects.value.map((tag) => tag.id);
      const res = await getFilesById(tagIds);
      console.log(res.files);
      documents.value = res.files || [];
      allDocuments.value = res.files || []; // Simpan data filtered ke allDocuments
    }

    isFilterLoading.value = false;
  } catch (error) {
    isFilterLoading.value = false;
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.message || "Gagal memfilter dokumen",
      life: 3000,
    });
  }
};

/**
 * Handle ketika tag dipilih dari dropdown search
 * @param {Object} tag - Tag object yang dipilih
 */
const handleTagSelected = async (tag) => {
  selectedTagObjects.value = [...selectedTagObjects.value, tag];
  await handleFilterByTags();
};

/**
 * Handle ketika tag dihapus dari selected tags
 * @param {number} tagId - ID tag yang dihapus
 */
const handleTagRemoved = async (tagId) => {
  selectedTagObjects.value = selectedTagObjects.value.filter(
    (tag) => tag.id !== tagId,
  );
  await handleFilterByTags();
};

/**
 * Handle page change dari pagination component
 * @param {number} page - Halaman yang dipilih
 */
const handlePageChange = (page) => {
  currentPage.value = page;
  // Auto-scroll ke atas table
  document
    .querySelector(".mt-4")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
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

    <InputSearch
      class="bg-[#F5FAFF] mt-8"
      placeholder="Cari file..."
      @search="performSearch"
    />
    <section class="flex items-center gap-4">
      <FunnelIcon class="size-6 text-slate-500"></FunnelIcon>
      <p class="font-semibold text-black">Filter :</p>
      <div class="flex-1 max-w-md">
        <TagSearchFilter
          :tags="tags"
          :selectedTags="selectedTagObjects"
          :isLoading="isFilterLoading"
          placeholder="Cari atau pilih tag..."
          @tag-selected="handleTagSelected"
          @tag-removed="handleTagRemoved"
        />
      </div>
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
              v-for="(document, index) in paginatedDocuments"
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
                {{ (document.filesize / 1024 / 1024).toFixed(2) }} Mb
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

      <!-- Pagination Component -->
      <Pagination
        v-if="documents.length > 0"
        :currentPage="currentPage"
        :totalItems="documents.length"
        :itemsPerPage="itemsPerPage"
        :maxVisiblePages="5"
        @page-change="handlePageChange"
      />
    </section>
  </div>
</template>
