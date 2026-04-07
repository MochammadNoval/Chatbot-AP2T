<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-mainblue/20 to-mainblue/5"
  >
    <!-- 404 Icon -->
    <div class="mb-4">
      <img src="./../image/404.png" alt="" width="180" />
    </div>

    <!-- 404 Text
    <h1 class="text-6xl font-bold text-gray-800 mb-4">404</h1> -->

    <!-- Title -->
    <h2 class="text-2xl font-semibold text-gray-700 mb-2">
      Halaman Tidak Ditemukan
    </h2>

    <!-- Description -->
    <p class="text-gray-500 text-center mb-8 max-w-md">
      Maaf, halaman yang Anda cari tidak tersedia atau masih dalam pengembangan.
    </p>

    <!-- Buttons -->
    <div class="flex gap-4">
      <router-link
        to="/dashboard"
        class="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all"
      >
        Kembali ke Dashboard
      </router-link>
      <button
        @click="goBack"
        class="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-all"
      >
        Kembali
      </button>
    </div>
  </div>
</template>

<script setup>
const goBack = () => {
  window.history.back();
};
</script>

<style scoped></style>
