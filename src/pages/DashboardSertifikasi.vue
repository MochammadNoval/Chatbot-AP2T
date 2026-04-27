<template>
<div class="p-4">
  <!-- Document Modal -->
  <DocumentModal
    @close="showModal = false"
    @completed="handleModalCompleted"
    :isOpen="showModal"
    :type="modalType"
    :idDocument="idDocument"
  />

  <header class="flex justify-between">
    <section>
      <h1 class="text-black font-bold">Dashboard Training</h1>
      <p class="text-gray-400 text-xs mt-1 font-semibold">
        Dashboard Sertifikasi dan Training Pegawai
      </p>
    </section>

    <button 
      @click="openUpdateModal"
      class="bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 transition-colors"
    >
        <p class="text-xs font-semibold">Update Dashboard</p> 
    </button>
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

const tableauUrl =
  "https://id.wikipedia.org/wiki/Main_Page";

// Modal state
const showModal = ref(false);
const modalType = ref("UploadDocument");
const idDocument = ref(0);

// Handler untuk membuka modal update
const openUpdateModal = () => {
  modalType.value = "ModalSertifikasi";
  idDocument.value = 0;
  showModal.value = true;
};

// Handler ketika modal selesai (upload/edit berhasil)
const handleModalCompleted = () => {
  showModal.value = false;
  // Tambahkan logika refresh atau update dashboard di sini jika diperlukan
};
</script>