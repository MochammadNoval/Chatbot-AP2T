<script setup>
import {
  LockClosedIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { getPublicSharePreview } from "../services/FileServices";

const route = useRoute();

const metadataFile = reactive({
  isPassword: true,
});

const passwordFile = ref("");
const isLoading = ref(false);
const errorMessage = ref("");
const isFirstLoad = ref(true);

const handlePreviewDocument = async (password = null) => {
  isLoading.value = true;
  errorMessage.value = "";
  
  try {
    const token = route.params.token;
    if (!token) {
      throw new Error("Token share tidak ditemukan di URL");
    }

    const response = await getPublicSharePreview(token, password);
    
    // Buat URL blob dari response data
    const previewUrl = URL.createObjectURL(response.data);

    // Alihkan halaman secara langsung ke Blob URL PDF untuk menggunakan viewer bawaan browser
    window.location.href = previewUrl;
  } catch (error) {
    console.error("Public share preview error:", error);
    
    // Jika perlu password atau password salah
    metadataFile.isPassword = true;
    
    if (password) {
      errorMessage.value = error.message || "Password salah atau link kedaluwarsa";
    }
  } finally {
    isLoading.value = false;
    isFirstLoad.value = false;
  }
};

const handleSubmitPassword = async () => {
  if (!passwordFile.value) {
    errorMessage.value = "Password tidak boleh kosong";
    return;
  }
  await handlePreviewDocument(passwordFile.value);
};

onMounted(async () => {
  // Langsung coba ambil dokumen tanpa password pertama kali
  await handlePreviewDocument();
});
</script>

<template>
  <div class="min-h-screen bg-slate-900 flex flex-col font-sans text-white">
    <!-- First Load Loading State -->
    <div v-if="isFirstLoad" class="flex-1 flex flex-col items-center justify-center bg-slate-950">
      <div class="relative w-16 h-16 mb-4">
        <div class="absolute inset-0 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin"></div>
      </div>
      <p class="text-slate-400 font-medium">Memeriksa tautan...</p>
    </div>

    <!-- Password Input View -->
    <div v-else class="flex-1 flex items-center justify-center p-4 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950">
      <div class="w-full max-w-md bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="flex flex-col items-center text-center mb-8">
          <div class="p-4 bg-blue-500/10 rounded-2xl text-blue-400 mb-4 ring-8 ring-blue-500/5">
            <LockClosedIcon class="w-8 h-8 animate-pulse"></LockClosedIcon>
          </div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Dokumen Dilindungi</h2>
          <p class="text-slate-400 text-sm mt-2 px-4">Tautan ini dilindungi oleh sandi. Silakan masukkan sandi untuk mengakses dokumen.</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmitPassword" class="space-y-6">
          <div class="space-y-2">
            <label for="password" class="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Kata Sandi
            </label>
            <input
              id="password"
              v-model="passwordFile"
              type="password"
              placeholder="Masukkan kata sandi..."
              class="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-transparent transition-all"
              required
            />
          </div>

          <!-- Error Alert -->
          <div v-if="errorMessage" class="flex gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <ExclamationTriangleIcon class="w-5 h-5 flex-shrink-0"></ExclamationTriangleIcon>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Button Submit -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-slate-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/25 active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span v-if="isLoading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>{{ isLoading ? "Membuka..." : "Buka Dokumen" }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
