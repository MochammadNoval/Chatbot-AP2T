<script setup>
import Swal from "sweetalert2";
import { UserPlusIcon, PencilIcon, TrashIcon } from "@heroicons/vue/24/outline";
import InputSearch from "../components/InputSearch.vue";
import UserFormModal from "../components/UserFormModal.vue";
import Pagination from "../components/Pagination.vue";
import { ref, onMounted, computed } from "vue";
import { getUsers, deleteUser } from "../services/User";
import { formatDate } from "../helpers/helper";
import { useAuthStores } from "../stores/Auth";


const useAuth = useAuthStores()
// State
const isUserFormModalOpen = ref(false);
const userFormMode = ref("create"); // 'create' | 'update'
const editingUser = ref(null);
const isLoadingUsers = ref(false);
const users = ref([]);
const allUsers = ref([]); // Menyimpan semua user original
const currentPage = ref(1); // Halaman saat ini
const itemsPerPage = 5; // Items per halaman
const searchQuery = ref(""); // State untuk tracking search query

// const initialize = () => {
//   try {
//     useAuth.setLoading(true);
//     const res = await getUsers();
//     useAuth.setLoading(false);
//   } catch (error) {
    
//   }
// }

// Computed untuk paginated users
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return users.value.slice(start, end);
});

/**
 * Fetch daftar user dari API
 */
const fetchUsers = async () => {
  useAuth.setLoading(true)
  isLoadingUsers.value = true;
  try {
    users.value = await getUsers();
    allUsers.value = users.value; // Simpan data original
    searchQuery.value = ""; // Reset search query
    currentPage.value = 1; // Reset pagination ke page 1
  } catch (error) {
    Swal.fire({
      title: "Gagal Memuat Data",
      text: error.response?.data?.message || "Gagal memuat data user",
      icon: "error",
      confirmButtonColor: "#3b82f6",
    });
  } finally {
    useAuth.setLoading(false)
  }
};

/**
 * Handle modal close
 */
const handleModalClose = () => {
  isUserFormModalOpen.value = false;
  userFormMode.value = "create";
  editingUser.value = null;
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
          }
        },
      });
    } catch (error) {
      console.error("Error:", error);
    }
  }
};

/**
 * Handle create user
 */
const handleCreateUser = () => {
  userFormMode.value = "create";
  editingUser.value = null;
  isUserFormModalOpen.value = true;
};

/**
 * Handle edit user
 */
const handleEditUser = (userId) => {
  const user = users.value.find((u) => u.id === userId);
  if (user) {
    editingUser.value = user;
    userFormMode.value = "update";
    isUserFormModalOpen.value = true;
  }
};

/**
 * Handle page change dari pagination component
 * @param {number} page - Halaman yang dipilih
 */
const handlePageChange = (page) => {
  currentPage.value = page;
  // Auto-scroll ke atas table
  document
    .querySelector(".mt-4")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

/**
 * Perform live search berdasarkan nama atau email user
 * @param {string} query - Search query
 */
const performSearch = (query) => {
  searchQuery.value = query.toLowerCase(); // Simpan search query dalam lowercase
  currentPage.value = 1; // Reset pagination ke page 1 saat search

  if (!searchQuery.value.trim()) {
    // Jika search kosong, tampilkan semua user dari allUsers
    users.value = [...allUsers.value];
  } else {
    // Filter user berdasarkan nama atau email
    users.value = allUsers.value.filter(
      (user) =>
        (user.name || user.Nama || "")
          .toLowerCase()
          .includes(searchQuery.value) ||
        (user.email || user.Email || "")
          .toLowerCase()
          .includes(searchQuery.value),
    );
  }
};

// Load data user saat component mount
onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <div class="p-4">
    <!-- User Form Modal -->
    <UserFormModal
      :is-open="isUserFormModalOpen"
      :mode="userFormMode"
      :user-data="editingUser"
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
        @click="handleCreateUser"
        class="flex bg-blue-500 px-4 shadow-lg rounded-lg items-center hover:bg-blue-600 transition-colors cursor-pointer"
      >
        <UserPlusIcon class="size-5 text-white"></UserPlusIcon>
        <p class="text-white font-semibold p-2 text-sm">Tambah Pengguna</p>
      </button>
    </section>

    <InputSearch
      class="bg-[#F5FAFF] mt-8"
      placeholder="Cari user..."
      @search="performSearch"
    />

    <!-- Users Table -->
    <section class="mt-4">
      <!-- Loading State -->
      <!-- <div v-if="isLoadingUsers" class="p-8 text-center">
        <p class="text-gray-500">Memuat data user...</p>
      </div> -->

      <!-- Empty State -->
      <div v-if="users.length === 0 " class="text-center py-8 mt-4">
        <p class="text-gray-500 text-sm">Tidak ada data user</p>
      </div>

      <!-- Table Container -->
      <div v-else class="overflow-x-auto shadow-md rounded-lg">
        <!-- Table -->
        <table class="w-full bg-white">
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
              v-for="(user, index) in paginatedUsers"
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

      <!-- Pagination Component -->
      <Pagination
        v-if="users.length > 0"
        :currentPage="currentPage"
        :totalItems="users.length"
        :itemsPerPage="itemsPerPage"
        :maxVisiblePages="5"
        @page-change="handlePageChange"
      />
    </section>
  </div>
</template>

<style scoped></style>
