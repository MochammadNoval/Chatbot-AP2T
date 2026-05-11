<template>
<div class="p-4">


  <!-- Document Modal -->
  <DocumentModal
    @close="showModal = false"
    @completed="handleModalCompleted"
    :isOpen="showModal"
    :type="modalType"
    :mode="'excel'"
    :idDocument="idDocument"
  />

  <!-- Excel Upload Modal -->
  <ExcelUploadModal
    :isOpen="showExcelUploadModal"
    title="Upload Data Dashboard Training"
    @close="showExcelUploadModal = false"
    @upload-success="handleExcelUploadSuccess"
    @completed="handleExcelUploadCompleted"
  />

  <!-- Excel Download Modal -->
  <ExcelDownloadModal
    :isOpen="showExcelDownloadModal"
    :fileName="downloadFileName"
    @close="showExcelDownloadModal = false"
    @download-start="handleDownloadStart"
    @download-success="handleDownloadSuccess"
    @download-error="handleDownloadError"
  />

  <header class="flex justify-between mb-4 ">
    <section>
      <h1 class="text-black font-bold">Dashboard Training</h1>
      <p class="text-gray-400 text-xs mt-1 font-semibold">
        Dashboard Sertifikasi dan Training Pegawai
      </p>
    </section>

      <div class="flex gap-3">

        <button 
          v-if = "can('admin : view')"
          @click="showExcelUploadModal = true"
          class="flex bg-green-600 gap-x-2 px-3 shadow-lg rounded-lg items-center hover:bg-green-700 transition-colors cursor-pointer"
        >
            <PlusCircleIcon class="size-4 text-white"></PlusCircleIcon>
            <p class="text-xs font-semibold">Upload Data</p> 
        </button>
        <!-- <button 
          v-if = "can('admin : view')"
          @click="openUpdateModal"
          class="flex bg-blue-500 gap-x-2 px-3 shadow-lg rounded-lg items-center hover:bg-blue-600 transition-colors cursor-pointer"
        >
            <PlusCircleIcon class="size-4 text-white"></PlusCircleIcon>
            <p class="text-xs font-semibold">Update Dashboard</p> 
        </button> -->
      </div>
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
import ExcelUploadModal from "../components/ExcelUploadModal.vue";
import ExcelDownloadModal from "../components/ExcelDownloadModal.vue";
import { PlusCircleIcon, ArrowDownOnSquareIcon } from "@heroicons/vue/24/outline";

// PERMISSION ///
import {usePermission} from "../composables/usePermissions"
const {can} = usePermission()

const tableauUrl =
  "https://id.wikipedia.org/wiki/Main_Page";

// Modal state
const showModal = ref(false);
const modalType = ref("");
const idDocument = ref(0);
const showExcelUploadModal = ref(false);
const showExcelDownloadModal = ref(false);
const downloadFileName = ref('template-dashboard-sertifikasi.xlsx');

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

// Handlers untuk download modal
const handleDownloadStart = () => {
  console.log('Download dimulai...');
};

const handleDownloadSuccess = () => {
  console.log('Download berhasil!');
};

const handleDownloadError = (error) => {
  console.error('Download error:', error);
};

// Handler ketika modal selesai (upload/edit berhasil)
const handleModalCompleted = () => {
  showModal.value = false;
  // Tambahkan logika refresh atau update dashboard di sini jika diperlukan
};

// Handler untuk Excel upload success
const handleExcelUploadSuccess = (response) => {
  console.log('Excel upload berhasil:', response);
  // Tambahkan logika refresh dashboard atau update UI di sini
};

// Handler ketika Excel upload modal selesai
const handleExcelUploadCompleted = () => {
  showExcelUploadModal.value = false;
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