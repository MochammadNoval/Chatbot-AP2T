<script setup>
import CardDashboard from "../components/CardDashboard.vue";
import CardIndeks from "../components/CardIndeks.vue";
import {
  DocumentTextIcon,
  UserGroupIcon,
  ChatBubbleBottomCenterIcon,
  BoltIcon,
} from "@heroicons/vue/16/solid";

import { CheckCircleIcon, XCircleIcon } from "@heroicons/vue/24/outline";
</script>

<template>
  <div>
    <!-- <Sidebar
      @toggle="isExpand = !isExpand"
      :class="[
        'transition-all duration-300 ease-in-out',
        isExpand ? 'w-[250px]' : 'w-[90px]',
      ]"
    /> -->
    <div class="p-4">
      <header>
        <h1 class="font-bold text-black text-xl">Dashboard</h1>
        <p class="text-slate-500/90 font-normal">
          Ringkasan aktivitas dan statistik sistem
        </p>
      </header>

      <div class="mt-4 grid grid-cols-4 gap-x-4">
        <CardDashboard
          title="Total Dokumen"
          value="5"
          desc="5 aktif, 0 dihapus"
          :icon="DocumentTextIcon"
        />
        <CardDashboard
          title="Total Pengguna"
          value="2"
          desc="Pengguna Terdaftar"
          :icon="UserGroupIcon"
        />
        <CardDashboard
          title="Total Chat"
          value="7"
          desc="Sesi Percakapan"
          :icon="ChatBubbleBottomCenterIcon"
        />
        <CardDashboard
          title="Respon AI"
          value="1643ms"
          desc="4 Berhasil, 0 gagal"
          :icon="BoltIcon"
        />
      </div>
      <div class="mt-4 grid grid-cols-2 gap-x-4">
        <div class="bg-mainblue rounded-xl p-5 shadow-md shadow-gray-200/90">
          <div class="w-full">
            <h1 class="text-xl text-black font-semibold mb-2">
              Status Dokumen
            </h1>
            <CardIndeks
              category="active"
              value="5"
              title="Dokumen Aktif"
              desc="Tersedia untuk diakses"
              :icon="CheckCircleIcon"
            />
            <CardIndeks
              category="hapus"
              value="0"
              title="Dokumen Dihapus"
              desc="Dapat dipulihkan"
              :icon="XCircleIcon"
            />
          </div>
        </div>

        <div class="bg-mainblue rounded-xl p-5 shadow-md shadow-gray-200/90">
          <div class="w-full">
            <h1 class="text-xl text-black font-semibold mb-2">Statistik AI</h1>
            <CardIndeks
              category="active"
              value="4"
              title="Respon berhasil"
              desc="AI merespon dengan baik"
              :icon="CheckCircleIcon"
            />
            <CardIndeks
              category="hapus"
              value="0"
              title="Respon Gagal"
              desc="Perlu perhatian"
              :icon="XCircleIcon"
            />
            <CardIndeks
              category="rata"
              value="1643ms"
              title="Rata Rata Waktu Respom"
              desc="Kecepatan waktu merespon"
              :icon="BoltIcon"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style></style>
