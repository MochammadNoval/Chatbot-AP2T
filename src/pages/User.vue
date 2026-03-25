<script setup>
import Swal from "sweetalert2";
import { UserPlusIcon, PencilIcon, TrashIcon } from "@heroicons/vue/24/outline";
import InputSearch from "../components/InputSearch.vue";
import UserCreateModal from "../components/UserCreateModal.vue";
import Toast from "../components/Toast.vue";
import { ref, onMounted } from "vue";
import { getUsers, deleteUser } from "../services/User";
import { formatDate } from "../helpers/helper";

// State
const showModal = ref(false);
const isLoadingUsers = ref(false);
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("info");
const users = ref([]);
const isEditMode = ref(false);
const selectedUser = ref(null);

/**
 * Tampilkan toast notification
 */
const showNotification = (message, type = "info") => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
};

/**
 * Fetch daftar user dari API
 */
const fetchUsers = async () => {
  isLoadingUsers.value = true;
  try {
    users.value = await getUsers();
    console.log(users.value);
  } catch (error) {
    showNotification(
      error.response?.data?.message || "Gagal memuat data user",
      "error",
    );
    // Fallback dengan data mock jika API error
  } finally {
    isLoadingUsers.value = false;
  }
};

/**
 * Handle modal close
 */
const handleModalClose = () => {
  showModal.value = false;
  isEditMode.value = false;
  selectedUser.value = null;
};

/**
 * Handle successful user creation
 */
const handleUserCreated = () => {
  // Refresh daftar user
  fetchUsers();
};

/**
 * Handle delete user dengan SweetAlert2 confirmation
 */
const handleDeleteUser = async (userId) => {
  // Get user data untuk ditampilkan di dialog
  const user = users.value.find((u) => u.id === userId);
  const userName = user?.name || user?.Nama || "User";

  const result = await Swal.fire({
    title: "Hapus Pengguna?",
    html: `Apakah Anda yakin ingin menghapus pengguna <strong>${userName}</strong>? <br/><small class="text-gray-500">Tindakan ini tidak dapat dibatalkan.</small>`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Ya, Hapus",
    cancelButtonText: "Batal",
    reverseButtons: true,
  });

  // Jika user memilih "Ya, Hapus"
  if (result.isConfirmed) {
    try {
      // Tampilkan loading dialog
      Swal.fire({
        title: "Sedang menghapus...",
        html: "Mohon tunggu sebentar",
        icon: "info",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: async () => {
          Swal.showLoading();

          try {
            // Lakukan delete
            await deleteUser(userId);

            // Tampilkan success dialog
            Swal.fire({
              title: "Berhasil!",
              text: `${userName} berhasil dihapus`,
              icon: "success",
              confirmButtonColor: "#3b82f6",
            });

            // Refresh data
            fetchUsers();
            showNotification("User berhasil dihapus", "success");
          } catch (error) {
            // Tampilkan error dialog
            Swal.fire({
              title: "Gagal!",
              text:
                error.response?.data?.message ||
                `Gagal menghapus ${userName}. Silahkan coba lagi.`,
              icon: "error",
              confirmButtonColor: "#3b82f6",
            });

            showNotification(
              error.response?.data?.message || "Gagal menghapus user",
              "error",
            );
          }
        },
      });
    } catch (error) {
      console.error("Error:", error);
    }
  }
};

/**
 * Handle edit user
 */
const handleEditUser = (userId) => {
  const user = users.value.find((u) => u.id === userId);
  if (user) {
    selectedUser.value = user;
    isEditMode.value = true;
    showModal.value = true;
  }
};

// Load data user saat component mount
onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <div class="p-4">
    <!-- Toast Notification -->
    <Toast
      v-if="showToast"
      :message="toastMessage"
      :type="toastType"
      :duration="5000"
    />

    <!-- User Create Modal -->
    <UserCreateModal
      :isOpen="showModal"
      :isEditMode="isEditMode"
      :userData="selectedUser"
      @close="handleModalClose"
      @success="handleUserCreated"
    />

    <!-- Page Header -->
    <section class="flex justify-between mb-6">
      <span>
        <h1 class="text-black font-bold">Manajemen Pengguna</h1>
        <p class="text-gray-500 text-xs">Kelola pengguna dan hak akses</p>
      </span>
      <button
        @click="showModal = true"
        class="flex bg-blue-500 px-4 shadow-lg rounded-lg items-center hover:bg-blue-600 transition-colors cursor-pointer"
      >
        <UserPlusIcon class="size-5 text-white"></UserPlusIcon>
        <p class="text-white font-semibold p-2 text-sm">Tambah Pengguna</p>
      </button>
    </section>

    <InputSearch class="bg-[#F5FAFF] mt-8" />

    <!-- Users Table -->
    <section class="mt-4">
      <div class="overflow-x-auto shadow-md rounded-lg">
        <!-- Loading State -->
        <div v-if="isLoadingUsers" class="p-8 text-center">
          <p class="text-gray-500">Memuat data user...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="users.length === 0" class="p-8 text-center">
          <p class="text-gray-500">Tidak ada data user</p>
        </div>

        <!-- Table -->
        <table v-else class="w-full bg-white">
          <thead class="bg-blue-600 text-white">
            <tr>
              <th class="px-6 py-3 text-left text-sm font-semibold">
                Nama Lengkap
              </th>
              <th class="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th class="px-6 py-3 text-left text-sm font-semibold">Role</th>
              <th class="px-6 py-3 text-left text-sm font-semibold">
                Tanggal Bergabung
              </th>
              <th class="px-6 py-3 text-center text-sm font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="(user, index) in users"
              :key="user.id || index"
              class="hover:bg-gray-50 transition-colors"
              :class="
                index % 2 === 0
                  ? 'bg-gradient-to-br from-[#F0FAFF] to-[#DBF2FD]'
                  : 'bg-gray-50'
              "
            >
              <td class="px-6 py-3 text-sm font-medium text-gray-900">
                {{ user.name || user.Nama || "-" }}
              </td>
              <td class="px-6 py-3 text-sm text-gray-700">
                {{ user.email || user.Email || "-" }}
              </td>
              <td class="px-6 py-3 text-sm font-medium text-gray-900">
                {{ user.role || user.Role || "-" }}
              </td>

              <td class="px-6 py-3 text-sm text-gray-700">
                {{ formatDate(user.created_at) }}
              </td>
              <td class="px-6 py-3 text-center">
                <div class="flex justify-center gap-2">
                  <!-- Button Edit -->
                  <button
                    @click="handleEditUser(user.id)"
                    class="p-2 cursor-pointer text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <PencilIcon class="size-5"></PencilIcon>
                  </button>

                  <!-- Button Hapus -->
                  <button
                    @click="handleDeleteUser(user.id)"
                    class="p-2 cursor-pointer text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <TrashIcon class="size-5"></TrashIcon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped></style>
