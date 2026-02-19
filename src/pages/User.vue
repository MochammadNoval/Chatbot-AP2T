<script setup>
import { UserPlusIcon, PencilIcon, TrashIcon } from "@heroicons/vue/24/outline";
import InputSearch from "../components/InputSearch.vue";
import Modal from "../components/Modal.vue";
import { ref } from "vue";

const showModal = ref(false);
const modalType = ref("");
const users = [
  {
    Id: 1,
    Nama: "Noval",
    Role: "Admin",
    Status: "Ea",
    Tanggal: "12/03/2026",
  },
  {
    Id: 2,
    Nama: "Arip",
    Role: "Admin",
    Status: "Ea",
    Tanggal: "12/03/2026",
  },
  {
    Id: 3,
    Nama: "Andru",
    Role: "Admin",
    Status: "Ea",
    Tanggal: "12/03/2026",
  },
  {
    Id: 3,
    Nama: "Andru",
    Role: "Admin",
    Status: "Ea",
    Tanggal: "12/03/2026",
  },
  {
    Id: 3,
    Nama: "Andru",
    Role: "Admin",
    Status: "Ea",
    Tanggal: "12/03/2026",
  },
  {
    Id: 3,
    Nama: "Andru",
    Role: "Admin",
    Status: "Ea",
    Tanggal: "12/03/2026",
  },
];
</script>

<template>
  <div class="p-4">
    <Modal :isOpen="showModal" @close="showModal = false" :type="modalType" />
    <section class="flex justify-between mb-6">
      <span>
        <h1 class="text-black font-bold">Manajemen Pengguna</h1>
        <p class="text-gray-500 text-xs">Kelola pengguna dan hak akses</p>
      </span>
      <button
        @click="
          showModal = true;
          modalType = 'manajemenUser';
        "
        class="flex bg-blue-500 px-4 shadow-lg rounded-lg items-center hover:bg-blue-600 transition-colors cursor-pointer"
      >
        <UserPlusIcon class="size-5 text-white"></UserPlusIcon>
        <p class="text-white font-semibold p-2 text-sm">Tambah Pengguna</p>
      </button>
    </section>

    <InputSearch class="bg-[#F5FAFF] mt-8" />

    <!-- Datatable Dokumen -->
    <section class="mt-4">
      <div class="overflow-x-auto shadow-md rounded-lg">
        <table class="w-full bg-white">
          <thead class="bg-mainblue text-white">
            <tr class="text-slate-500">
              <th class="px-6 py-3 text-left text-sm font-semibold">
                Nama Lengkap
              </th>

              <th class="px-6 py-3 text-left text-sm font-semibold">Role</th>
              <th class="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th class="px-6 py-3 text-left text-sm font-semibold">
                Tanggal Bergabung
              </th>
              <th class="px-6 py-3 text-center text-sm font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="(user, index) in users"
              :key="user.Id"
              class="hover:bg-gray-50 transition-colors"
              :class="
                index % 2 === 0
                  ? 'bg-gradient-to-br from-[#F0FAFF] to-[#DBF2FD]'
                  : 'bg-gray-50'
              "
            >
              <td class="px-4 py-2 text-xs font-medium text-gray-900">
                {{ user.Nama }}
              </td>

              <td class="px-4 py-2 text-xs font-medium text-gray-900">
                {{ user.Role }}
              </td>
              <td class="px-6 py-2 text-sm text-gray-700">
                {{ user.Status }}
              </td>
              <td class="px-6 py-2 text-sm text-gray-700">
                {{ user.Tanggal }}
              </td>
              <td class="px-6 py-2 text-center">
                <div class="flex justify-center gap-2">
                  <!-- Button Edit -->
                  <button
                    @click="editDocument(document.id)"
                    class="p-2 cursor-pointer text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <PencilIcon class="size-5"></PencilIcon>
                  </button>

                  <!-- Button Hapus -->
                  <button
                    @click="deleteDocument(document.id)"
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
