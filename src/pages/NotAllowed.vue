<script setup>
const goBack = () => {
  window.history.back();
};
</script>


<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-mainblue/20 to-mainblue/5"
  >
    <!-- 404 Icon -->
    <div class="mb-4">
      <img src="./../image/not-allowed.jpg" alt="" width="280" />
    </div>

    <!-- 404 Text
    <h1 class="text-6xl font-bold text-gray-800 mb-4">404</h1> -->

    <!-- Title -->
    <h2 class="text-4xl font-bold text-gray-700 mb-2">
      403
    </h2>

    <!-- Description -->
    <p class="text-gray-500 text-center mb-8 max-w-md">
      Maaf, anda tidak memiliki akses untuk halaman terkait!
    </p>
  </div>
</template>


<style scoped></style>
