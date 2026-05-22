<script setup>
import InputSearch from "../components/InputSearch.vue";
import DocumentModal from "../components/DocumentModal.vue";
import PreviewDocumentModal from "../components/PreviewDocumentModal.vue";
import ShareLinkModal from "../components/ShareLinkModal.vue";
import TagSearchFilter from "../components/TagSearchFilter.vue";
import DownloadProgressBar from "../components/DownloadProgressBar.vue";
import { useToast } from "primevue/usetoast";
import Menu from "primevue/menu";
import Button from "primevue/button";
import { usePreviewModal } from "../composables/usePreviewModal";
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
  EllipsisVerticalIcon,
  ArrowDownOnSquareStackIcon
} from "@heroicons/vue/24/outline";

import { onMounted, ref, computed, watch } from "vue";
import {
  deleteFile,
  getFiles,
  downloadFile,
  getFilesByTags
} from "../services/FileServices";
import { useAuthStores } from "../stores/Auth";
import { getTagGroups, getTags } from "../services/Tags";
import Pagination from "../components/Pagination.vue";

// PERMISSION ///
import {usePermission} from "../composables/usePermissions"
const {can} = usePermission()

const useAuth = useAuthStores();
const toast = useToast();
const {
  isOpen: isPreviewOpen,
  isLoading: isPreviewLoading,
  error: previewError,
  previewUrl,
  selectedDocument: previewDocument,
  openModal: openPreviewModal,
  closeModal: closePreviewModal,
} = usePreviewModal();

const showModal = ref(false);
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
const itemsPerPageOptions = [5, 10, 20, 50, 100]; // Opsi jumlah items per halaman
let itemsPerPage = ref(10); // Items per halaman

// Download state management
const isDownloading = ref(false);
const downloadProgress = ref(0);
const downloadFileName = ref("");
const downloadFileSize = ref(0);
const downloadedSize = ref(0);
const downloadStartTime = ref(0);
let abortController = null;

// Menu references for action dropdown
const menuRefs = ref({});

// Share Modal state
const showShareModal = ref(false);
const selectedDocumentForShare = ref(null);


// Computed untuk paginated documents
const paginatedDocuments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
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

/**
 * Handle preview dokumen dengan modal
 * @param {Object} doc - Dokumen yang akan di-preview
 */
const handlePreviewDocument = async (doc) => {
  try {
    await openPreviewModal(doc);
  } catch (error) {
    console.error("Preview error:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Gagal membuka preview dokumen",
      life: 3000,
    });
  }
};

// Function untuk edit dokumen
const editDocument = async (id) => {
  modalType.value = "editDocument";
  idDocument.value = id;
  showModal.value = true;
};

// Function untuk open share modal
const openShareModal = (document) => {
  selectedDocumentForShare.value = document;
  showShareModal.value = true;
};

// Function untuk close share modal
const closeShareModal = () => {
  showShareModal.value = false;
  selectedDocumentForShare.value = null;
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
  try {
    // Find document to get file info
    const document = allDocuments.value.find(doc => doc.id === id) || documents.value.find(doc => doc.id === id);
    if (!document) {
      throw new Error("Dokumen tidak ditemukan");
    }

    // Initialize download state
    isDownloading.value = true;
    downloadProgress.value = 0;
    downloadFileName.value = document.filename;
    downloadFileSize.value = document.filesize;
    downloadedSize.value = 0;
    downloadStartTime.value = Date.now();

    // Create progress handler
    const onProgress = (progressEvent) => {
      downloadProgress.value = progressEvent.percent;
      downloadedSize.value = progressEvent.loaded;
    };

    // Get download result BEFORE await - abortController available IMMEDIATELY
    const downloadResult = downloadFile(id, onProgress);
    abortController = downloadResult.abortController;  // NOW abortController ready!

    // Await the promise
    await downloadResult.promise;

    // Success state - only if not canceled
    if (!downloadResult.isCanceled()) {
      isDownloading.value = false;
      toast.add({
        severity: "success",
        summary: "Berhasil",
        detail: "File berhasil didownload",
        life: 3000,
      });

      // Reset state after delay
      setTimeout(() => {
        downloadProgress.value = 0;
        downloadFileName.value = "";
        downloadFileSize.value = 0;
        downloadedSize.value = 0;
      }, 1000);
    }

  } catch (error) {
    isDownloading.value = false;
    downloadProgress.value = 0;
    downloadFileName.value = "";
    downloadFileSize.value = 0;
    downloadedSize.value = 0;

    // Check if error is user cancel or actual error
    if (error.message !== "Download dibatalkan oleh user") {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: error.message || "Gagal mengunduh dokumen",
        life: 3000,
      });
    }
  }
};

const handleCancelDownloadRequest = async () => {
  // Show SweetAlert confirmation dialog
  const result = await Swal.fire({
    title: "Batalkan Download?",
    text: "Apakah Anda yakin ingin membatalkan download file ini?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Ya, Batalkan",
    cancelButtonText: "Batal",
  });

  // Jika user confirm, baru batalkan download
  if (result.isConfirmed) {
    handleCancelDownload();
  }
};

const handleCancelDownload = () => {
  if (abortController) {
    abortController.abort();
    isDownloading.value = false;
    downloadProgress.value = 0;
    downloadFileName.value = "";
    downloadFileSize.value = 0;
    downloadedSize.value = 0;
    abortController = null;

    toast.add({
      severity: "info",
      summary: "Download dibatalkan",
      detail: "Download dibatalkan oleh user",
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
      const res = await getFilesByTags(tagIds);
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

/**
 * Watcher untuk reset halaman ke 1 saat itemsPerPage berubah
 */
watch(itemsPerPage, () => {
  currentPage.value = 1; // Reset ke halaman pertama
});
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

    <!-- Preview Document Modal -->
    <PreviewDocumentModal
      :isOpen="isPreviewOpen"
      :document="previewDocument"
      :previewUrl="previewUrl"
      :isLoading="isPreviewLoading"
      :error="previewError"
      @close="closePreviewModal"
      @download="closePreviewModal"
    />

    <!-- Share Link Modal -->
    <ShareLinkModal
      v-if="selectedDocumentForShare"
      :isOpen="showShareModal"
      :documentId="selectedDocumentForShare.id"
      :documentName="selectedDocumentForShare.filename"
      @close="closeShareModal"
    />

    <!-- Download Progress Bar -->
    <DownloadProgressBar
      v-if="isDownloading"
      :fileName="downloadFileName"
      :progress="downloadProgress"
      :fileSize="downloadFileSize"
      :downloadedSize="downloadedSize"
      :startTime="downloadStartTime"
      @cancel-request="handleCancelDownloadRequest"
    />

    <section class="flex justify-between">
      <span>
        <h1 class="text-black font-bold">Manajemen Dokumen</h1>
        <p class="text-gray-500 text-xs">Kelola dokumen dengan format PDF</p>
      </span>

      <router-link
        v-if="can('admin : view')"
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
      v-if="can('admin : view')"
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
    <section class="flex items-center gap-4 mt-6">
      <FunnelIcon class="size-6 text-slate-500"></FunnelIcon>
      <p class="font-semibold text-black">Filter :</p>
      <div class="flex-1 max-w-md ">
        <TagSearchFilter
          :tags="tags"
          :selectedTags="selectedTagObjects"
          :isLoading="isFilterLoading"
          placeholder="Cari atau pilih tag..."
          @tag-selected="handleTagSelected"
          @tag-removed="handleTagRemoved"
        />
      </div>
      
      <!-- Dropdown Rows Per Page -->
      <div class="flex items-center gap-2 ms-auto">
        <label for="itemsPerPage" class="font-semibold text-black text-sm">Tampilkan:</label>
        <select
          id="itemsPerPage"
          v-model.number="itemsPerPage"
          class="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
            {{ option }} per halaman
          </option>
        </select>
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
                  

                  <!-- BUTTON SHOW IF ROLE === USER -->

                   <button
                    v-if="can('user : view')"
                    @click="handlePreviewDocument(document)"
                    class="p-2 cursor-pointer text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Preview"
                  >
                    <EyeIcon class="size-5"></EyeIcon>
                  </button>

                   <button
                    v-if="can('user : view')"
                    @click="handledownloadFile(document.id)"
                    class="p-2 cursor-pointer text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                    title="Download"
                  >
                    <ArrowDownOnSquareStackIcon class="size-5"></ArrowDownOnSquareStackIcon>
                  </button>

                  <!--  -->

                  <!-- Button Edit -->
                  <button
                    v-if="can('admin : view')"
                    @click="editDocument(document.id)"
                    class="p-2 cursor-pointer text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <PencilIcon class="size-5"></PencilIcon>
                  </button>

                  <!-- Button Hapus -->
                  <button
                    v-if="can('admin : view')"
                    @click="handleDeleteFile(document.id)"
                    class="p-2 cursor-pointer text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <TrashIcon class="size-5"></TrashIcon>
                  </button>

                  <!-- Menu Button (Three Dots) -->
                  <button
                    v-if = "can('admin : view')"
                    @click="(event) => menuRefs[document.id]?.toggle(event)"
                    class="p-2 cursor-pointer text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Lainnya"
                  >
                    <EllipsisVerticalIcon class="size-5"></EllipsisVerticalIcon>
                  </button>

                  <!-- Action Menu Dropdown -->
                  <Menu

                    :ref="(el) => menuRefs[document.id] = el"
                    :model="[
                      {
                        label: 'Preview',
                        icon: 'pi pi-eye',
                        command: () => handlePreviewDocument(document),
                      },
                      {
                        label: 'Download',
                        icon: 'pi pi-download',
                        command: () => handledownloadFile(document.id),
                      },
                      {
                        label: 'Share Link',
                        icon: 'pi pi-share-alt',
                        command: () => openShareModal(document),
                      },
                    ]"
                    :popup="true"
                    class="w-40"
                  />
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
        :itemsPerPage="itemsPerPage.value"
        :maxVisiblePages="5"
        @page-change="handlePageChange"
      />
    </section>
  </div>
</template>
