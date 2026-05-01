<script setup>
import { onMounted, ref, reactive } from "vue";
import CardDashboard from "../components/CardDashboard.vue";
import CardIndeks from "../components/CardIndeks.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import {
  DocumentTextIcon,
  UserGroupIcon,
  ChatBubbleBottomCenterIcon,
  BoltIcon,
} from "@heroicons/vue/16/solid";

import { CheckCircleIcon, XCircleIcon } from "@heroicons/vue/24/outline";
import { getDataDashboard } from "../services/AuthServices";
import { useToast } from "primevue/usetoast";
import { useAuthStores } from "../stores/Auth";

// State management
const useAuth = useAuthStores();
const error = ref(null);
const toast = useToast();

const dashboard = reactive({
  documents: {
    total: 0,
    indexed_faiss: 0,
    not_indexed: 0
  },
  users: {
    total_users: 0
  },
  chat: {
    total_chat: 0
  },
  ai: {
    response_time_ms: 0,
    good_responses: 0,
    failed_responses: 0,
    used_token: 0,
    average_token_per_chat: 0
  }
});

onMounted(async () => {
  try {
    useAuth.setLoading(true);
    error.value = null;
    const data = await getDataDashboard();
    // Assign data dengan Object.assign untuk lebih clean
    Object.assign(dashboard, data);
  } catch (err) {
    error.value = err.message || "Gagal memuat data dashboard";
    console.error(err);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.value,
      life: 3000,
    });
  } finally {
    useAuth.setLoading(false);
  }
});

</script>

<template>
  <LoadingSpinner />
  <div>
    <!-- Loading State - Handled by LoadingSpinner component reading from authStore -->

    <!-- Error State -->
    <div v-if="error" class="p-4">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 class="text-red-800 font-semibold mb-2">Terjadi Kesalahan</h2>
        <p class="text-red-700 text-sm">{{ error }}</p>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="p-4">
      <header>
        <h1 class="font-bold text-black text-xl">Dashboard</h1>
        <p class="text-slate-500/90 font-normal">
          Ringkasan aktivitas dan statistik sistem
        </p>
      </header>

      <div class="mt-4 grid grid-cols-4 gap-x-4">
        <CardDashboard
          title="Total Dokumen"
          :value="dashboard.documents.total"
          :desc="`${dashboard.documents.indexed_faiss} aktif, ${dashboard.documents.not_indexed} dihapus`"
          :icon="DocumentTextIcon"
        />
        <CardDashboard
          title="Total Pengguna"
          :value="dashboard.users.total_users"
          desc="Pengguna Terdaftar"
          :icon="UserGroupIcon"
        />
        <CardDashboard
          title="Total Chat"
          :value="dashboard.chat.total_chat"
          desc="Sesi Percakapan"
          :icon="ChatBubbleBottomCenterIcon"
        />
        <CardDashboard
          title="Respon AI"
          :value="`${dashboard.ai.response_time_ms} ms`"
          :desc="`${dashboard.ai.good_responses} Berhasil, ${dashboard.ai.failed_responses} gagal`"
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
              title="Dokumen Aktif"
              :value="dashboard.documents.indexed_faiss"
              desc="Tersedia untuk diakses"
              :icon="CheckCircleIcon"
            />
            <CardIndeks
              category="hapus"
              :value="dashboard.documents.not_indexed"
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
              :value="dashboard.ai.good_responses"
              title="Respon berhasil"
              desc="AI merespon dengan baik"
              :icon="CheckCircleIcon"
            />
            <CardIndeks
              category="hapus"
              :value="dashboard.ai.failed_responses"
              title="Respon Gagal"
              desc="Perlu perhatian"
              :icon="XCircleIcon"
            />
            <CardIndeks
              category="rata"
              :value="`${dashboard.ai.response_time_ms} ms`"
              title="Rata Rata Waktu Respon"
              desc="Kecepatan waktu merespon"
              :icon="BoltIcon"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
