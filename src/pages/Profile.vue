<script setup></script>

<template>
  <div class="p-4">
    <Modal :isOpen="showModal" @close="showModal = false" :type="modalType" />
    <section>
      <h1 class="text-black font-bold">Profile</h1>
      <p class="text-gray-400 text-xs mt-1 font-semibold">
        Kelola informasi profil anda
      </p>
    </section>

    <section class="mt-4 grid grid-cols-2">
      <div class="bg-mainblue p-4">
        <h1 class="text-black font-semibold">Informasi Pribadi</h1>
        <p class="text-gray-400 text-xs font-semibold">
          Perbarui informasi pribadi anda
        </p>
      </div>
      <div></div>
    </section>
  </div>
</template>

<style scoped></style>
