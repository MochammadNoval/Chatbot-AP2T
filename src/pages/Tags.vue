<script setup>
import { PlusIcon, TagIcon, TrashIcon } from "@heroicons/vue/24/outline";
import { PencilIcon, BookmarkIcon } from "@heroicons/vue/24/solid";
import InputSearch from "../components/InputSearch.vue";
import { onMounted, ref, computed } from "vue";
import ModalTags from "../components/ModalTags.vue";
import {
  deleteGroupTags,
  getTagGroups,
  getTags,
  deleteTag,
} from "../services/Tags";
import { useToast } from "primevue";
import { useAuthStores } from "../stores/Auth";
import Swal from "sweetalert2";

const showModal = ref(false);
const modalType = ref("");
const groupTags = ref([]);
const allTags = ref([]);
const useAuth = useAuthStores();
const idTags = ref(null);
const idTagsGroups = ref(null);
const searchQuery = ref(""); // State untuk tracking search query
const currentTagName = ref(""); // State untuk menyimpan nama tag yang akan diupdate

const toast = useToast();

/**
 * Mengelompokkan tags berdasarkan tag_group_id dan filter berdasarkan search query
 * @returns {Object} Object dengan key = tag_group_id dan value = array of filtered tags
 */
const groupedTags = computed(() => {
  const grouped = {};

  // Filter allTags berdasarkan search query
  const filteredTags = searchQuery.value.trim()
    ? allTags.value.filter((tag) =>
        tag.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
      )
    : allTags.value;

  // Kelompokkan filtered tags berdasarkan group_id
  filteredTags.forEach((tag) => {
    const groupId = tag.tag_group_id;
    if (!grouped[groupId]) {
      grouped[groupId] = [];
    }
    grouped[groupId].push(tag);
  });

  return grouped;
});

/**
 * Mendapatkan jumlah tags untuk sebuah group
 */
const getTagCountByGroup = (groupId) => {
  return groupId in groupedTags.value ? groupedTags.value[groupId].length : 0;
};

onMounted(() => {
  initialize();
});

const initialize = async () => {
  try {
    useAuth.setLoading(true);
    const [resTagGroups, resTags] = await Promise.all([
      getTagGroups(),
      getTags(),
    ]);
    useAuth.setLoading(false);
    groupTags.value = resTagGroups;
    allTags.value = resTags;
    searchQuery.value = ""; // Reset search query saat data di-initialize
  } catch (error) {
    useAuth.setLoading(false);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Gagal memuat data tags",
      life: 3000,
    });
  }
};

const closeModal = () => {
  initialize();
  showModal.value = false;
};

/**
 * Perform live search berdasarkan nama tag
 * @param {string} query - Search query
 */
const performSearch = (query) => {
  searchQuery.value = query.toLowerCase(); // Simpan search query dalam lowercase
  // groupedTags computed property akan otomatis update
};

const handleAddTags = (id) => {
  showModal.value = true;
  idTagsGroups.value = id;
  modalType.value = "addTags";
  idTags.value = null;
  console.log(idTagsGroups.value);
};

const handleUpdateGroupTags = (id) => {
  showModal.value = true;
  console.log(id);
  modalType.value = "updateGroupsTags";
  idTags.value = null;
  idTagsGroups.value = id;
};

const handleUpdateTag = (tagId) => {
  // Cari nama tag dari allTags berdasarkan tagId
  const tag = allTags.value.find((t) => t.id === tagId);
  currentTagName.value = tag ? tag.name : "";

  showModal.value = true;
  modalType.value = "updateTags";
  idTags.value = tagId;
  idTagsGroups.value = null;
};

const handleDeleteTag = async (tagId, tagName) => {
  try {
    const result = await Swal.fire({
      title: "Hapus Tag?",
      text: `Apakah anda yakin ingin hapus tag "${tagName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Batal",
      confirmButtonText: "Ya, Hapus!",
    });

    if (result.isConfirmed) {
      useAuth.setLoading(true);
      await deleteTag(tagId);
      await initialize();
      useAuth.setLoading(false);

      Swal.fire({
        title: "Berhasil!",
        text: "Tag berhasil dihapus!",
        icon: "success",
      });
    }
  } catch (error) {
    useAuth.setLoading(false);
    Swal.fire({
      title: "Gagal!",
      text: error.message || "Terjadi kesalahan saat menghapus tag",
      icon: "error",
    });
  }
};

const handleDeleteGroupTags = async (id) => {
  idTags.value = null;
  idTagsGroups.value = id;
  console.log(idTagsGroups.value);

  try {
    const result = await Swal.fire({
      title: "Hapus Data?",
      text: "Apakah anda yakin ingin hapus tags group?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Batal",
      confirmButtonText: "Ya, Hapus!",
    });

    if (result.isConfirmed) {
      await deleteGroupTags(id);
      await initialize();

      Swal.fire({
        title: "Berhasil!",
        text: "Group tags berhasil dihapus!",
        icon: "success",
      });
    }
  } catch (error) {
    useAuth.setLoading(false);
    Swal.fire({
      title: "Gagal!",
      text: error,
      icon: "error",
    });
  }
};
</script>

<template>
  <div class="p-4">
    <ModalTags
      :isOpen="showModal"
      @close="showModal = false"
      :type="modalType"
      :id="idTagsGroups ? idTagsGroups : idTags"
      :currentName="currentTagName"
      @isSubmit="closeModal"
    />
    <section class="flex justify-between mb-6">
      <span>
        <h1 class="text-black font-bold">Kelola group Tags & Tags</h1>
        <p class="text-gray-500 text-xs">Atur group dan tags untuk dokumen</p>
      </span>
      <button
        @click="
          showModal = true;
          modalType = 'tambahGroupsTags';
        "
        class="flex bg-blue-500 px-4 shadow-lg rounded-lg items-center hover:bg-blue-600 transition-colors cursor-pointer"
      >
        <PlusIcon class="size-5 text-white"></PlusIcon>
        <p class="text-white font-semibold p-2 text-sm">Tambah Group Tags</p>
      </button>
    </section>

    <InputSearch
      class="mt-8"
      placeholder="Cari tag..."
      @search="performSearch"
    />

    <!-- Datatable Dokumen -->
    <section class="mt-4" v-for="groupTag in groupTags" :key="groupTag.id">
      <div class="overflow-x-auto shadow-md rounded-lg bg-mainblue p-4">
        <header class="flex w-full items-center">
          <div class="bg-blue-500/70 rounded-md p-2">
            <BookmarkIcon class="size-5 text-white" />
          </div>
          <span>
            <p class="text-black font-semibold ms-2">{{ groupTag.name }}</p>
            <p class="text-gray-500 ms-2">
              {{ getTagCountByGroup(groupTag.id) }} Tags
            </p>
          </span>

          <div class="flex items-center ms-auto gap-x-2">
            <div
              class="py-2 flex rounded-full p-2 shadow-lg w-full items-center gap-x-1 cursor-pointer"
              @click="handleAddTags(groupTag.id)"
            >
              <p class="text-xs text-black font-semibold ml-1">Tambah Tags</p>
              <PlusIcon class="text-black font-semibold size-5" />
            </div>

            <div
              class="rounded-full flex gap-x-1 p-2 shadow-lg bg-green-500/80 hover:bg-green-500/90 cursor-pointer"
              @click="handleUpdateGroupTags(groupTag.id)"
            >
              <p class="text-xs ml-1">Edit</p>
              <PencilIcon class="text-white cursor-pointer size-4" />
            </div>

            <div
              class="rounded-full flex gap-x-1 p-2 shadow-lg bg-red-500 hover:bg-red-600 cursor-pointer"
              @click="handleDeleteGroupTags(groupTag.id)"
            >
              <p class="text-xs ml-1">Hapus</p>
              <TrashIcon class="text-white size-4 cursor-pointer" />
            </div>
          </div>
        </header>

        <section
          v-if="getTagCountByGroup(groupTag.id) > 0"
          class="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs"
        >
          <TagIcon class="size-5 text-black" />
          <div
            v-for="tag in groupedTags[groupTag.id]"
            :key="tag.id"
            class="flex items-center gap-x-2 rounded-lg p-2 bg-slate-200/80 border border-gray-300/80 hover:bg-slate-300/80 transition-colors"
          >
            <p class="text-black font-medium">{{ tag.name }}</p>
            <PencilIcon
              class="size-4 text-green-500 cursor-pointer hover:text-green-700"
              @click="handleUpdateTag(tag.id)"
            />
            <TrashIcon
              class="size-4 text-red-500 cursor-pointer hover:text-red-700"
              @click="handleDeleteTag(tag.id, tag.name)"
            />
          </div>
        </section>

        <section v-else class="mt-4 text-center py-4">
          <p class="text-gray-500 text-sm">Belum ada tags untuk group ini</p>
        </section>
      </div>
    </section>
  </div>
</template>

<style scoped></style>
