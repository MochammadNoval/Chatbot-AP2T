<script setup>
import { ref } from "vue";
import logoIconPlus from "./../image/logo-pln-plus.svg";
import logoPLN from "./../image/pln.svg";

const isExpand = ref(true);

const expandSidebarChat = () => {
  isExpand.value = !isExpand.value;
};
</script>

<template>
  <div
    :class="[
      'transition-all duration-300 ease-in-out',
      isExpand ? 'grid grid-cols-[250px_1fr]' : 'w-auto',
    ]"
  >
    <section
      class="py-4 px-2 border-r border-b border-gray-400/20 bg-mainblue/50 transition-all duration-300 ease-in-out"
      :class="[
        'transition-all duration-300 ease-in-out',
        isExpand ? 'inline-block' : 'hidden',
      ]"
    >
      <div class="border-b border-gray-400/20 w-full px-3">
        <button class="bg-blue-500 p-2 flex rounded-lg text-sm w-full mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>

          <p class="font-semibold ms-2">Chat Baru</p>
        </button>
      </div>

      <form action="" method="POST" class="w-full mt-2 mb-4">
        <label
          for="searchChat"
          class="border border-gray-400/60 rounded-lg px-2 w-full flex gap-x-1 items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-5 text-gray-500 font-semibold"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            name=""
            id=""
            class="text-sm text-black py-1 px-1 focus:outline-none focus:ring-0 focus:border-transparent"
            placeholder="Cari chat..."
          />
        </label>
      </form>

      <!-- Chat History -->
      <div
        class="rounded-lg bg-blue-300/20 py-2 px-3 flex gap-x-2 items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-5 text-blue-500"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
          />
        </svg>

        <div>
          <p class="text-blue-500 font-semibold">Chat Baru</p>
          <p class="text-gray-600 text-xs font-normal">3 Menit yang lalu</p>
        </div>
      </div>
    </section>

    <div class="flex flex-col min-h-screen">
      <!-- Navbar -->
      <div class="relative bg-mainblue flex items-center p-2">
        <!-- button minimize chat history bar -->
        <button
          @click="expandSidebarChat"
          class="absolute -left-2 rounded-full p-2 border border-gray-400/30 shadow-xl bg-mainblue cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-3 text-gray-500"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5"
            />
          </svg>
        </button>
        <h1 class="text-black text-lg font-semibold ms-4">Chat Baru</h1>
      </div>

      <!-- Content -->
      <section class="flex flex-col justify-center items-center mt-24">
        <img :src="logoPLN" alt="" />
        <p class="text-black font-semibold mt-4">Tanya AI Kami</p>
        <p class="text-slate-500 mt-1">Saran pertanyaan untuk AI</p>
      </section>

      <section class="flex gap-x-2 mt-6 justify-center">
        <p
          class="bg-mainblue/70 rounded-lg p-2 text-black font-semibold text-md"
        >
          Apa yang bisa kamu bantu?
        </p>
        <p
          class="bg-mainblue/70 rounded-lg p-2 text-black font-semibold text-md"
        >
          Bagaimana kerja AI ini?
        </p>
        <p
          class="bg-mainblue/70 rounded-lg p-2 text-black font-semibold text-md"
        >
          Beritahu saya tentang fitur fitur yang tersedia?
        </p>
      </section>

      <footer
        class="flex py-5 px-4 bg-mainblue/40 relative mt-auto items-center"
      >
        <form method="POST" class="flex w-full gap-x-4">
          <input
            type="text"
            placeholder="Tanyakan sesuatu kepada AI.."
            name=""
            id=""
            class="border border-slate-300 bg-mainblue/60 rounded-lg py-1.5 px-4 w-full text-black text-sm focus:border focus:border-mainblue/60 focus:ring-0"
          />
          <button class="py-2 px-3 bg-blue-400 rounded-lg ml-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-5 -rotate-45"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  </div>
</template>

<style scoped></style>
