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

  <header class="flex justify-between mb-4">
    <section>
      <h1 class="text-black font-bold">Dashboard Training</h1>
      <p class="text-gray-400 text-xs mt-1 font-semibold">
        Dashboard Sertifikasi dan Training Pegawai
      </p>
    </section>

    <div class="flex gap-3">
      <button
        v-if="can('admin : view')"
        @click="showExcelUploadModal = true"
        class="flex bg-green-600 gap-x-2 px-3 shadow-lg rounded-lg items-center hover:bg-green-700 transition-colors cursor-pointer"
      >
        <PlusCircleIcon class="size-4 text-white" />
        <p class="text-xs font-semibold">Upload Data</p>
      </button>
    </div>
  </header>

  <div class="w-full">
    <div
      class="tableauPlaceholder"
      id="viz1781063612941"
      style="position: relative"
    >
      <noscript>
        <a href="#">
          <img
            alt="Dashboard 1"
            src="https://public.tableau.com/static/images/da/dash_KMS/Dashboard1/1_rss.png"
            style="border: none"
          />
        </a>
      </noscript>

      <object class="tableauViz" style="display: none">
        <param name="host_url" value="https%3A%2F%2Fpublic.tableau.com%2F" />
        <param name="embed_code_version" value="3" />
        <param name="site_root" value="" />
        <param name="name" value="dash_KMS&#47;Dashboard1" />
        <param name="tabs" value="no" />
        <param name="toolbar" value="yes" />
        <param
          name="static_image"
          value="https://public.tableau.com/static/images/da/dash_KMS/Dashboard1/1.png"
        />
        <param name="animate_transition" value="yes" />
        <param name="display_static_image" value="yes" />
        <param name="display_spinner" value="yes" />
        <param name="display_overlay" value="yes" />
        <param name="display_count" value="yes" />
        <param name="language" value="en-US" />
        <param name="filter" value="publish=yes" />
      </object>
    </div>
  </div>

</div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import DocumentModal from "../components/DocumentModal.vue";
import ExcelUploadModal from "../components/ExcelUploadModal.vue";
import ExcelDownloadModal from "../components/ExcelDownloadModal.vue";
import { PlusCircleIcon } from "@heroicons/vue/24/outline";

import { usePermission } from "../composables/usePermissions";
const { can } = usePermission();

// Modal state
const showModal = ref(false);
const modalType = ref("");
const idDocument = ref(0);
const showExcelUploadModal = ref(false);
const showExcelDownloadModal = ref(false);
const downloadFileName = ref("template-dashboard-sertifikasi.xlsx");

onMounted(() => {
  initTableau();
});

const initTableau = () => {
  const divElement = document.getElementById("viz1781063612941");
  if (!divElement) return;

  const vizElement = divElement.getElementsByTagName("object")[0];

  // Responsive sizing — sama persis dengan script HTML referensi
  if (divElement.offsetWidth > 800) {
    vizElement.style.minWidth = "1366px";
    vizElement.style.maxWidth = "1466px";
    vizElement.style.width = "100%";
    vizElement.style.minHeight = "795px";
    vizElement.style.maxHeight = "895px";
    vizElement.style.height = divElement.offsetWidth * 0.75 + "px";
  } else if (divElement.offsetWidth > 500) {
    vizElement.style.minWidth = "1366px";
    vizElement.style.maxWidth = "1466px";
    vizElement.style.width = "100%";
    vizElement.style.minHeight = "795px";
    vizElement.style.maxHeight = "895px";
    vizElement.style.height = divElement.offsetWidth * 0.75 + "px";
  } else {
    vizElement.style.width = "100%";
    vizElement.style.height = "3927px";
  }

  const scriptElement = document.createElement("script");
  scriptElement.src =
    "https://public.tableau.com/javascripts/api/viz_v1.js";
  vizElement.parentNode.insertBefore(scriptElement, vizElement);
};

const openUpdateModal = () => {
  modalType.value = "ModalSertifikasi";
  idDocument.value = 0;
  showModal.value = true;
};

const handleDownloadStart = () => console.log("Download dimulai...");
const handleDownloadSuccess = () => console.log("Download berhasil!");
const handleDownloadError = (error) => console.error("Download error:", error);
const handleModalCompleted = () => { showModal.value = false; };
const handleExcelUploadSuccess = (response) => console.log("Excel upload berhasil:", response);
const handleExcelUploadCompleted = () => { showExcelUploadModal.value = false; };
</script>

<style scoped>
.tableauPlaceholder {
  width: 100%;
}
</style>