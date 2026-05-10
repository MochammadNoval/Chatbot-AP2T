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

  <header class="flex justify-between mb-4 ">
    <section>
      <h1 class="text-black font-bold">Dashboard Training</h1>
      <p class="text-gray-400 text-xs mt-1 font-semibold">
        Dashboard Sertifikasi dan Training Pegawai
      </p>
    </section>

      <button 
        v-if = "can('admin : view')"
        @click="openUpdateModal"
        class="flex bg-blue-500 gap-x-2 px-3 shadow-lg rounded-lg items-center hover:bg-blue-600 transition-colors cursor-pointer"
      >
          <PlusCircleIcon class="size-4 text-white"></PlusCircleIcon>
          <p class="text-xs font-semibold">Update Dashboard</p> 
      </button>
  </header>
  
    <div class="w-full">
      <div
      class="w-full h-full"
      id="viz1777964139718">
          <object class="tableauViz">
        <param name="host_url" value="https%3A%2F%2Fpublic.tableau.com%2F" />
        <param name="embed_code_version" value="3" />
        <param name="site_root" value="" />
        <param name="name" value="deploy_17779467286860/Dashboard1" />
        <param name="tabs" value="no" />
        <param name="toolbar" value="yes" />
        <param
          name="static_image"
          value="https://public.tableau.com/static/images/de/deploy_17779467286860/Dashboard1/1.png"
        />
        <param name="animate_transition" value="yes" />
        <param name="display_static_image" value="yes" />
        <param name="display_spinner" value="yes" />
        <param name="display_overlay" value="yes" />
        <param name="display_count" value="yes" />
        <param name="language" value="en-US" />
      </object>
    </div>
  </div>

</div>
 
</template>

<script setup>
import { ref } from "vue";
import DocumentModal from "../components/DocumentModal.vue";
import DownloadProgressBar from "../components/DownloadProgressBar.vue";
import { PlusCircleIcon, ArrowDownOnSquareIcon } from "@heroicons/vue/24/outline";
import { downloadExcelFile } from "../services/ExcelServices";

// PERMISSION ///
import {usePermission} from "../composables/usePermissions"
const {can} = usePermission()

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

import { onMounted } from "vue";

onMounted(() => {
  initTableau();
});

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


const initTableau = () => {
  const divElement = document.getElementById("viz1777964139718");
  if (!divElement) return;

  const vizElement = divElement.getElementsByTagName("object")[0];

  // Fullscreen
  vizElement.style.width = "100%";
  vizElement.style.height = "100vh";

  const scriptElement = document.createElement("script");
  scriptElement.src =
    "https://public.tableau.com/javascripts/api/viz_v1.js";

  vizElement.parentNode.insertBefore(scriptElement, vizElement);
};
</script>

<style scoped>


.tableauViz {
  width: 100%;
  height: 100%;
}
</style>