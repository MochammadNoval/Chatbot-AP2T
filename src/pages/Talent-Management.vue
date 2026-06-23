<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { 
  PlusCircleIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  AdjustmentsVerticalIcon
} from "@heroicons/vue/24/outline";
import ExcelUploadModal from "../components/ExcelUploadModal.vue";
import Pagination from "../components/Pagination.vue";
import CustomMultiSelect from "../components/CustomMultiSelect.vue";
import { usePermission } from "../composables/usePermissions";
import { uploadSertifikasiExcel, getSertifikasiList } from "../services/Sertifikasi";

// can: Fungsi helper dari usePermission untuk memeriksa hak akses pengguna (misal: tombol upload).
const { can } = usePermission();

// searchQuery: Menyimpan kata kunci pencarian global (NIP, nama, atau sertifikasi).
const searchQuery = ref("");
// placeholder: Menyimpan teks placeholder untuk kolom pencarian global.
const placeholder = ref("Masukkan NIP, nama, atau sertifikasi...");
// showExcelUploadModal: Menyimpan status visibilitas modal untuk upload Excel (true untuk tampil).
const showExcelUploadModal = ref(false);

// State Management
// masterTalents: Menyimpan seluruh data dari database untuk mengambil daftar unik opsi filter (NIP, Nama, dll.).
const masterTalents = ref([]);
// allTalents: Menyimpan seluruh data hasil pencarian global saat ini (sebelum difilter oleh 5 filter advanced).
const allTalents = ref([]);
// currentPage: Menyimpan nomor halaman data tabel yang sedang aktif.
const currentPage = ref(1);
// itemsPerPage: Menyimpan jumlah baris data yang ditampilkan dalam satu halaman.
const itemsPerPage = ref(10);
// itemsPerPageOptions: Menyimpan pilihan jumlah baris data per halaman (5, 10, 20, 50, 100).
const itemsPerPageOptions = [5, 10, 20, 50, 100];
// isLoading: Menyimpan status loading saat aplikasi sedang memproses pemanggilan API (true untuk loading).
const isLoading = ref(false);

// Filter Selections
// isShowAdvanceFilter: Menyimpan status visibilitas panel filter advanced (true untuk tampil).
const isShowAdvanceFilter = ref(false);
// selectedNips: Menyimpan daftar NIP yang dipilih dalam bentuk array untuk filter pencarian.
const selectedNips = ref([]);
// selectedNames: Menyimpan daftar nama pegawai yang dipilih dalam bentuk array untuk filter pencarian.
const selectedNames = ref([]);
// selectedPohonProfesis: Menyimpan daftar Pohon Profesi yang dipilih dalam bentuk array untuk filter pencarian.
const selectedPohonProfesis = ref([]);
// selectedKodeSchemas: Menyimpan daftar Kode Skema yang dipilih dalam bentuk array untuk filter pencarian.
const selectedKodeSchemas = ref([]);
// startDate: Menyimpan tanggal awal (dari) untuk pencarian rentang kadaluarsa sertifikat.
const startDate = ref("");
// endDate: Menyimpan tanggal akhir (sampai) untuk pencarian rentang kadaluarsa sertifikat.
const endDate = ref("");

const fetchTalents = async () => {
  isLoading.value = true;
  try {
    const limit = 100;
    const initialData = await getSertifikasiList(1, limit, searchQuery.value);
    const items = [...(initialData.items || [])];
    const total = initialData.total || 0;

    // Fetch remaining pages in parallel if there are more than 100 items
    if (total > limit) {
      const pageCount = Math.ceil(total / limit);
      const promises = [];
      for (let p = 2; p <= pageCount; p++) {
        promises.push(getSertifikasiList(p, limit, searchQuery.value));
      }
      const responses = await Promise.all(promises);
      responses.forEach((res) => {
        if (res && res.items) {
          items.push(...res.items);
        }
      });
    }

    allTalents.value = items;

    // If search is empty or masterTalents is not yet populated, set masterTalents to provide all unique options
    if (!searchQuery.value || masterTalents.value.length === 0) {
      masterTalents.value = items;
    }
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
});

// Watch filters to reset page to 1 when search parameters change
watch(
  [selectedNips, selectedNames, selectedPohonProfesis, selectedKodeSchemas, startDate, endDate],
  () => {
    currentPage.value = 1;
  }
);

// Compute unique options for CustomMultiSelect dropdowns
const nipOptions = computed(() => {
  const unique = [...new Set(masterTalents.value.map((t) => t.nip).filter(Boolean))];
  return unique.map((nip) => ({ label: nip, value: nip }));
});

const namaOptions = computed(() => {
  const unique = [...new Set(masterTalents.value.map((t) => t.nama_pegawai).filter(Boolean))];
  return unique.map((nama) => ({ label: nama, value: nama }));
});

const pohonProfesiOptions = computed(() => {
  const unique = [...new Set(masterTalents.value.map((t) => t.pohon_profesi_dd).filter(Boolean))];
  return unique.map((pohon) => ({ label: pohon, value: pohon }));
});

const kodeSkemaOptions = computed(() => {
  const unique = [...new Set(masterTalents.value.map((t) => t.kode_skema).filter(Boolean))];
  return unique.map((kode) => ({ label: kode, value: kode }));
});

// Combined clientside filtering logic
const filteredTalents = computed(() => {
  let result = allTalents.value;

  if (selectedNips.value && selectedNips.value.length > 0) {
    result = result.filter((talent) => selectedNips.value.includes(talent.nip));
  }

  if (selectedNames.value && selectedNames.value.length > 0) {
    result = result.filter((talent) => selectedNames.value.includes(talent.nama_pegawai));
  }

  if (selectedPohonProfesis.value && selectedPohonProfesis.value.length > 0) {
    result = result.filter((talent) => selectedPohonProfesis.value.includes(talent.pohon_profesi_dd));
  }

  if (selectedKodeSchemas.value && selectedKodeSchemas.value.length > 0) {
    result = result.filter((talent) => selectedKodeSchemas.value.includes(talent.kode_skema));
  }

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

// Total count of filtered items
const totalItems = computed(() => filteredTalents.value.length);

// Paginated slice of the filtered list
const paginatedTalents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredTalents.value.slice(start, end);
});

const handleShowAdvanceFilter = ()=> {
  isShowAdvanceFilter.value = !isShowAdvanceFilter.value  
}

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
  // Auto-scroll ke atas table
  document
    .querySelector(".overflow-x-auto")
    ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
};

// Filter chip removals and helpers
const removeNip = (nip) => {
  selectedNips.value = selectedNips.value.filter((item) => item !== nip);
};

const removeName = (name) => {
  selectedNames.value = selectedNames.value.filter((item) => item !== name);
};

const removePohon = (pohon) => {
  selectedPohonProfesis.value = selectedPohonProfesis.value.filter((item) => item !== pohon);
};

const removeKode = (kode) => {
  selectedKodeSchemas.value = selectedKodeSchemas.value.filter((item) => item !== kode);
};

const clearDateRange = () => {
  startDate.value = "";
  endDate.value = "";
};

const hasActiveFilters = computed(() => {
  return (
    selectedNips.value.length > 0 ||
    selectedNames.value.length > 0 ||
    selectedPohonProfesis.value.length > 0 ||
    selectedKodeSchemas.value.length > 0 ||
    startDate.value ||
    endDate.value
  );
});

const clearAllFilters = () => {
  selectedNips.value = [];
  selectedNames.value = [];
  selectedPohonProfesis.value = [];
  selectedKodeSchemas.value = [];
  startDate.value = "";
  endDate.value = "";
};

const formatDateRangeDisplay = () => {
  if (startDate.value && endDate.value) {
    return `${startDate.value} s/d ${endDate.value}`;
  }
  if (startDate.value) {
    return `Dari ${startDate.value}`;
  }
  if (endDate.value) {
    return `Sampai ${endDate.value}`;
  }
  return "";
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
        <h1 class="text-black font-bold text-xl">Sertifikat Kompetensi</h1>
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
          <h2 class="text-lg font-bold text-gray-900">Daftar Sertifikat Kempetensi Pegawai</h2>
          <!-- <p class="text-xs text-gray-500 mt-1">Daftar sertifikasi dan kompetensi pegawai</p> -->
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

      <!-- Search Global -->
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

          <button @click="handleShowAdvanceFilter" class=" hover:bg-blue-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg flex items-center gap-x-2 transition-colors shadow-sm shadow-blue-500/10 cursor-pointer"
          :class="isShowAdvanceFilter ? 'bg-blue-800 hover:bg-blue-900' : 'bg-blue-600'"
          >
            <AdjustmentsVerticalIcon class="size-5 text-white" />
            <span>Advance Filter</span>
          </button>
        
        </div>
      </div>

      <!-- Advanced Filters Section -->
      <div v-if="isShowAdvanceFilter" class="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
        <div class="flex items-center justify-between mb-4 border-b border-slate-200/60 pb-2">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Filter Pencarian
          </span>
          <button
            v-if="hasActiveFilters"
            @click="clearAllFilters"
            class="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <XMarkIcon class="size-3.5" />
            <span>Reset Semua Filter</span>
          </button>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <!-- NIP Filter -->
          <div class="flex flex-col">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">NIP</label>
            <CustomMultiSelect
              v-model="selectedNips"
              :options="nipOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Pilih NIP..."
              :multiple="true"
              :hideSelectedItems="true"
            />
          </div>

          <!-- Nama Filter -->
          <div class="flex flex-col">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Nama Pegawai</label>
            <CustomMultiSelect
              v-model="selectedNames"
              :options="namaOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Pilih Nama Pegawai..."
              :multiple="true"
              :hideSelectedItems="true"
            />
          </div>

          <!-- Pohon Profesi Filter -->
          <div class="flex flex-col">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Pohon Profesi</label>
            <CustomMultiSelect
              v-model="selectedPohonProfesis"
              :options="pohonProfesiOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Pilih Pohon Profesi..."
              :multiple="true"
              :hideSelectedItems="true"
            />
          </div>

          <!-- Kode Schema Filter -->
          <div class="flex flex-col">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Kode Skema</label>
            <CustomMultiSelect
              v-model="selectedKodeSchemas"
              :options="kodeSkemaOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Pilih Kode Skema..."
              :multiple="true"
              :hideSelectedItems="true"
            />
          </div>
        </div>

        <!-- Date Expired Range Filter -->
        <div class="border-t border-slate-200/60 pt-4">
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Date Expired Range
          </label>
          <div class="flex flex-col sm:flex-row gap-4 items-end">
            <div class="flex-1 w-full">
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">Dari (Start Date)</label>
              <input
                type="date"
                v-model="startDate"
                class="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              />
            </div>
            <div class="flex-1 w-full">
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">Sampai (End Date)</label>
              <input
                type="date"
                v-model="endDate"
                class="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>

        <!-- Filter Chips -->
        <div v-if="hasActiveFilters" class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200/40">
          <span class="text-xs font-semibold text-slate-400 flex items-center mr-1">Filter Aktif:</span>
          
          <!-- NIP Chips -->
          <div v-for="nip in selectedNips" :key="'chip-nip-'+nip" class="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium flex items-center gap-1.5">
            <span>NIP: {{ nip }}</span>
            <button @click="removeNip(nip)" class="hover:bg-blue-100 rounded-full p-0.5 text-blue-500 hover:text-blue-700 transition-colors">
              <XMarkIcon class="size-3" />
            </button>
          </div>

          <!-- Name Chips -->
          <div v-for="name in selectedNames" :key="'chip-name-'+name" class="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium flex items-center gap-1.5">
            <span>Nama: {{ name }}</span>
            <button @click="removeName(name)" class="hover:bg-emerald-100 rounded-full p-0.5 text-emerald-500 hover:text-emerald-700 transition-colors">
              <XMarkIcon class="size-3" />
            </button>
          </div>

          <!-- Pohon Profesi Chips -->
          <div v-for="pohon in selectedPohonProfesis" :key="'chip-pohon-'+pohon" class="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium flex items-center gap-1.5">
            <span>Profesi: {{ pohon }}</span>
            <button @click="removePohon(pohon)" class="hover:bg-amber-100 rounded-full p-0.5 text-amber-500 hover:text-amber-700 transition-colors">
              <XMarkIcon class="size-3" />
            </button>
          </div>

          <!-- Kode Skema Chips -->
          <div v-for="kode in selectedKodeSchemas" :key="'chip-kode-'+kode" class="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-medium flex items-center gap-1.5">
            <span>Skema: {{ kode }}</span>
            <button @click="removeKode(kode)" class="hover:bg-purple-100 rounded-full p-0.5 text-purple-500 hover:text-purple-700 transition-colors">
              <XMarkIcon class="size-3" />
            </button>
          </div>

          <!-- Date Chip -->
          <div v-if="startDate || endDate" class="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-medium flex items-center gap-1.5">
            <span>Expired: {{ formatDateRangeDisplay() }}</span>
            <button @click="clearDateRange" class="hover:bg-rose-100 rounded-full p-0.5 text-rose-500 hover:text-rose-700 transition-colors">
              <XMarkIcon class="size-3" />
            </button>
          </div>
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
              <!-- <th class="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Created At</th> -->
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(talent, index) in paginatedTalents"
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
              <!-- <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <div v-if="talent.created_at" class="flex items-center gap-2">
                  <CalendarIcon class="size-4.5 text-slate-400 shrink-0" />
                  <span>{{ new Date(talent.created_at).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
                </div>
                <span v-else>-</span>
              </td> -->
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