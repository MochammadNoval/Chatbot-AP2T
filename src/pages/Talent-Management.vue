<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { 
  PlusCircleIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  UserIcon
} from "@heroicons/vue/24/outline";
import ExcelUploadModal from "../components/ExcelUploadModal.vue";
import Pagination from "../components/Pagination.vue";
import { usePermission } from "../composables/usePermissions";
import { uploadSertifikasiExcel, getSertifikasiList } from "../services/Sertifikasi";

const { can } = usePermission();

const searchQuery = ref("");
const placeholder = ref("Masukkan NIP, nama, atau sertifikasi...");
const showExcelUploadModal = ref(false);
const startDate = ref("");
const endDate = ref("");

// State Management
const talents = ref([]);
const totalItems = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const itemsPerPageOptions = [5, 10, 20, 50, 100];
const isLoading = ref(false);

const fetchTalents = async () => {
  isLoading.value = true;
  try {
    const data = await getSertifikasiList(
      currentPage.value,
      itemsPerPage.value,
      searchQuery.value
    );
    talents.value = data.items || [];
    totalItems.value = data.total || 0;
  } catch (error) {
    console.error("Gagal memuat data talent:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchTalents();
});

// Watcher for itemsPerPage
watch(itemsPerPage, () => {
  currentPage.value = 1;
  fetchTalents();
});

const filteredTalents = computed(() => {
  let result = talents.value;

  // Filter tanggal dilakukan di client-side atas data halaman saat ini
  if (startDate.value) {
    result = result.filter((talent) => {
      if (!talent.tanggal_berakhir) return false;
      return talent.tanggal_berakhir >= startDate.value;
    });
  }
  if (endDate.value) {
    result = result.filter((talent) => {
      if (!talent.tanggal_berakhir) return false;
      return talent.tanggal_berakhir <= endDate.value;
    });
  }

  return result;
});

const handleExcelUploadSuccess = (response) => {
  fetchTalents();
};

const handleExcelUploadCompleted = () => {
  showExcelUploadModal.value = false;
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchTalents();
};

const clearSearch = () => {
  searchQuery.value = "";
  currentPage.value = 1;
  fetchTalents();
};

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchTalents();
  // Auto-scroll ke atas table
  document
    .querySelector(".overflow-x-auto")
    ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
};

const clearDateRange = () => {
  startDate.value = "";
  endDate.value = "";
};
</script>

<template>
  <div class="p-4">
    <!-- Excel Upload Modal -->
    <ExcelUploadModal
      :isOpen="showExcelUploadModal"
      title="Upload Data Talent Pool"
      :uploadService="uploadSertifikasiExcel"
      @close="showExcelUploadModal = false"
      @upload-success="handleExcelUploadSuccess"
      @completed="handleExcelUploadCompleted"
    />

    <!-- Page Header -->
    <header class="flex justify-between mb-6">
      <span>
        <h1 class="text-black font-bold text-xl">Talent Manajemen</h1>
        <p class="text-gray-500 text-xs mt-1">Pengelolaan talent dan pengembangan</p>
      </span>
      <button
        v-if="can('admin : view')"
        @click="showExcelUploadModal = true"
        class="flex bg-blue-600 px-4 py-2 shadow-md rounded-lg items-center hover:bg-blue-700 transition-colors cursor-pointer text-white"
      >
        <PlusCircleIcon class="size-5 text-white mr-2" />
        <span class="font-semibold text-sm">Upload File Excel</span>
      </button>
    </header>

    <!-- Main Content -->
    <div class="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm mb-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-lg font-bold text-gray-900">Talent Pool Data</h2>
          <p class="text-xs text-gray-500 mt-1">Daftar sertifikasi dan kompetensi pegawai</p>
        </div>
        
        <!-- Dropdown Rows Per Page -->
        <div class="flex items-center gap-2 md:ms-auto">
          <label for="itemsPerPage" class="font-semibold text-gray-700 text-sm">Tampilkan:</label>
          <select
            id="itemsPerPage"
            v-model.number="itemsPerPage"
            class="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
              {{ option }} per halaman
            </option>
          </select>
        </div>
      </div>

      <!-- Search Section -->
      <div class="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Cari Data Berdasarkan NIP, Nama, atau Judul Sertifikasi
        </label>
        <div class="flex gap-x-2">
          <div class="relative flex-1">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon class="size-5 text-gray-400" />
            </span>
            <input
              type="text"
              v-model="searchQuery"
              @keyup.enter="handleSearch"
              class="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              :placeholder="placeholder"
            />
            <button
              v-if="searchQuery"
              @click="clearSearch"
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              <XMarkIcon class="size-5" />
            </button>
          </div>
          <button @click="handleSearch" class="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg flex items-center gap-x-2 transition-colors shadow-sm shadow-blue-500/10 cursor-pointer">
            <MagnifyingGlassIcon class="size-5 text-white" />
            <span>Cari</span>
          </button>
        </div>
      </div>

      <!-- Search by rentang waktu -->
      <div class="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Cari Data Berdasarkan Expired Sertifikat (Rentang Waktu)
        </label>
        <div class="flex flex-col sm:flex-row gap-4 items-end">
          <div class="flex-1 w-full">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal Mulai</label>
            <input
              type="date"
              v-model="startDate"
              class="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            />
          </div>
          <div class="flex-1 w-full">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal Akhir</label>
            <input
              type="date"
              v-model="endDate"
              class="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            />
          </div>
          <button
            v-if="startDate || endDate"
            @click="clearDateRange"
            type="button"
            class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-sm rounded-lg transition-colors cursor-pointer w-full sm:w-auto h-[38px] flex items-center justify-center gap-1"
            title="Reset filter tanggal"
          >
            <XMarkIcon class="size-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <div v-if="filteredTalents.length > 0" class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full text-left border-collapse bg-white">
          <thead class="bg-slate-50 text-slate-700 border-b border-slate-200">
            <tr>
              <th class="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">NIP</th>
              <th class="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Nama Pegawai</th>
              <th class="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Unit</th>
              <th class="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">No Sertifikat</th>
              <th class="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Kode Skema</th>
              <th class="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Nama Skema</th>
              <th class="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Tanggal Terbit</th>
              <th class="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Tanggal Berakhir</th>
              <th class="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">No Register</th>
              <th class="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">No Seri</th>
              <th class="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Lokasi</th>
              <th class="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Lembaga Penerbit</th>
              <th class="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Nama Profesi</th>
              <th class="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Pohon Profesi</th>
              <th class="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Evident</th>
              <th class="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Created At</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(talent, index) in filteredTalents"
              :key="talent.id || talent.nip"
              class="hover:bg-slate-50/50 transition-colors"
              :class="index % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'"
            >
              <!-- NIP -->
              <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                {{ talent.nip || '-' }}
              </td>

              <!-- Nama Pegawai -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                    <UserIcon class="size-5" />
                  </div>
                  <div class="text-sm font-semibold text-gray-900">{{ talent.nama_pegawai || '-' }}</div>
                </div>
              </td>
              
              <!-- Unit Kerja -->
              <td class="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                {{ talent.unit || '-' }}
              </td>
              
              <!-- No Sertifikat -->
              <td class="px-6 py-4 text-sm font-medium text-gray-800 whitespace-nowrap">
                {{ talent.no_sertifikat || '-' }}
              </td>
              
              <!-- Kode Skema -->
              <td class="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                {{ talent.kode_skema || '-' }}
              </td>
              
              <!-- Nama Skema -->
              <td class="px-6 py-4 text-sm text-gray-700 min-w-[200px]">
                {{ talent.nama_skema || '-' }}
              </td>
              
              <!-- Tanggal Terbit -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <div v-if="talent.tanggal_terbit" class="flex items-center gap-2">
                  <CalendarIcon class="size-4.5 text-slate-400 shrink-0" />
                  <span>{{ new Date(talent.tanggal_terbit).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
                </div>
                <span v-else>-</span>
              </td>
              
              <!-- Tanggal Berakhir -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <div v-if="talent.tanggal_berakhir" class="flex items-center gap-2">
                  <CalendarIcon class="size-4.5 text-slate-400 shrink-0" />
                  <span>{{ new Date(talent.tanggal_berakhir).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
                </div>
                <span v-else>-</span>
              </td>

              <!-- No Register -->
              <td class="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                {{ talent.no_register || '-' }}
              </td>

              <!-- No Seri -->
              <td class="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                {{ talent.no_seri || '-' }}
              </td>

              <!-- Lokasi -->
              <td class="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                {{ talent.lokasi || '-' }}
              </td>

              <!-- Lembaga Penerbit -->
              <td class="px-6 py-4 text-sm text-gray-700 min-w-[150px]">
                {{ talent.lembaga_penerbit || '-' }}
              </td>

              <!-- Nama Profesi -->
              <td class="px-6 py-4 text-sm text-gray-700 min-w-[150px]">
                {{ talent.nama_profesi || '-' }}
              </td>

              <!-- Pohon Profesi -->
              <td class="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                {{ talent.pohon_profesi_dd || '-' }}
              </td>

              <!-- Evident -->
              <td class="px-6 py-4 text-sm text-gray-700">
                {{ talent.evident || '-' }}
              </td>

              <!-- Created At -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <div v-if="talent.created_at" class="flex items-center gap-2">
                  <CalendarIcon class="size-4.5 text-slate-400 shrink-0" />
                  <span>{{ new Date(talent.created_at).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
                </div>
                <span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Component -->
      <Pagination
        v-if="filteredTalents.length > 0"
        :currentPage="currentPage"
        :totalItems="totalItems"
        :itemsPerPage="itemsPerPage"
        :maxVisiblePages="5"
        @page-change="handlePageChange"
      />

      <!-- Empty State -->
      <div v-else class="text-center py-12 bg-white rounded-xl border border-slate-200 mt-4">
        <svg
          class="mx-auto h-12 w-12 text-slate-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 class="mt-4 text-sm font-semibold text-gray-900">Data Tidak Ditemukan</h3>
        <p class="mt-1 text-sm text-gray-500">Tidak ada data talent yang cocok dengan kata kunci "{{ searchQuery }}".</p>
        <div class="mt-6">
          <button
            @click="clearSearch"
            type="button"
            class="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
          >
            Reset Pencarian
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>