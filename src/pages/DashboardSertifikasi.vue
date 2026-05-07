<template>
<div class="p-4">
  <!-- Download Progress Bar -->
  <DownloadProgressBar
    v-if="showDownloadProgress"
    :fileName="downloadFileName"
    :progress="downloadProgress"
    :fileSize="downloadFileSize"
    :downloadedSize="downloadedSize"
    :startTime="downloadStartTime"
    @cancel-request="handleCancelDownload"
  />

  <!-- Document Modal -->
  <DocumentModal
    @close="showModal = false"
    @completed="handleModalCompleted"
    :isOpen="showModal"
    :type="modalType"
    :mode="'excel'"
    :idDocument="idDocument"
  />

  <header class="flex justify-between">
    <section>
      <h1 class="text-black font-bold">Dashboard Training</h1>
      <p class="text-gray-400 text-xs mt-1 font-semibold">
        Dashboard Sertifikasi dan Training Pegawai
      </p>
    </section>

    <div class="flex gap-x-2">
      <button 
        @click="openUpdateModal"
        class="flex bg-blue-500 gap-x-2 px-3 shadow-lg rounded-lg items-center hover:bg-blue-600 transition-colors cursor-pointer"
      >
          <PlusCircleIcon class="size-5 text-white"></PlusCircleIcon>
          <p class="text-sm font-semibold">Update Dashboard</p> 
      </button>
  
      <button 
        @click="handleDownloadTemplate"
        class="flex bg-green-500 gap-x-2 px-3 shadow-lg rounded-lg items-center hover:bg-green-600 transition-colors cursor-pointer"
      >
          <ArrowDownOnSquareIcon class="size-5 text-white"></ArrowDownOnSquareIcon>
          <p class="text-sm font-semibold">Download Template</p> 
      </button>
    </div>

  </header>
  <div
      class="rounded-xl mt-5 shadow-md shadow-gray-200/90 border border-slate-300/40"
    >
        <iframe
          :src="tableauUrl"
          width="100%"
          height="600"
          frameborder="0"
        ></iframe>
        
      <component :is="icon" class="text-blue-500 w-9 mx-auto" />
    </div>
</div>
 
</template>

<script setup>
import { ref } from "vue";
import DocumentModal from "../components/DocumentModal.vue";
import DownloadProgressBar from "../components/DownloadProgressBar.vue";
import { PlusCircleIcon, ArrowDownOnSquareIcon } from "@heroicons/vue/24/outline";
import { downloadExcelFile } from "../services/ExcelServices";

const tableauUrl =
  "https://id.wikipedia.org/wiki/Main_Page";

// Modal state
const showModal = ref(false);
const modalType = ref("");
const idDocument = ref(0);

// Download progress state
const showDownloadProgress = ref(false);
const downloadProgress = ref(0);
const downloadFileSize = ref(0);
const downloadedSize = ref(0);
const downloadStartTime = ref(0);
const downloadFileName = ref('template-dashboard-sertifikasi.xlsx');
let cancelTokenSource = null;

// Handler untuk membuka modal update
const openUpdateModal = () => {
  modalType.value = "ModalSertifikasi";
  idDocument.value = 0;
  showModal.value = true;
};

const handleDownloadTemplate = async () => {
  try {
    showDownloadProgress.value = true;
    downloadProgress.value = 0;
    downloadedSize.value = 0;
    downloadStartTime.value = Date.now();
    
    const blob = await downloadExcelFile((progressEvent) => {
      const total = progressEvent.total || 1;
      const loaded = progressEvent.loaded || 0;
      
      downloadFileSize.value = total;
      downloadedSize.value = loaded;
      downloadProgress.value = Math.round((loaded / total) * 100);
    });
    
    // Create temporary URL for blob
    const url = window.URL.createObjectURL(blob);
    
    // Create anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFileName.value;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    // Set progress to 100% briefly before hiding
    downloadProgress.value = 100;
    setTimeout(() => {
      showDownloadProgress.value = false;
    }, 1000);
  } catch (error) {
    console.error('Download template gagal:', error);
    showDownloadProgress.value = false;
    alert('Gagal download template: ' + error.message);
  }
};

const handleCancelDownload = () => {
  // Cancel request logic here if needed
  showDownloadProgress.value = false;
};

// Handler ketika modal selesai (upload/edit berhasil)
const handleModalCompleted = () => {
  showModal.value = false;
  // Tambahkan logika refresh atau update dashboard di sini jika diperlukan
};
</script>