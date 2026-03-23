<script setup>
import { PlusIcon, TagIcon, TrashIcon } from "@heroicons/vue/24/outline";
import { PencilIcon, BookmarkIcon } from "@heroicons/vue/24/solid";
import InputSearch from "../components/InputSearch.vue";
import { onMounted, ref } from "vue";
import ModalTags from "../components/ModalTags.vue";
import { deleteGroupTags, getTagGroups } from "../services/Tags";
import { useToast } from "primevue";
import { useAuthStores } from "../stores/Auth";
import Swal from "sweetalert2";

const showModal = ref(false);
const modalType = ref("");
const groupTags = ref([]);
const useAuth = useAuthStores();
const idTags = ref(null);
const idTagsGroups = ref(null);

const toast = useToast();
onMounted(() => {
  initialize();
});

const initialize = async () => {
  try {
    useAuth.setLoading(true);
    const resTagGroups = await getTagGroups();
    // const resTag = await getTag();
    useAuth.setLoading(false);
    groupTags.value = resTagGroups;
    // tags.value = resTag.value;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Gagal memuat dokumen",
      life: 3000,
    });
  }
};

const closeModal = () => {
  initialize();
  showModal.value = false;
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

    <InputSearch class="mt-8" />

    <!-- Datatable Dokumen -->
    <section class="mt-4" v-for="groupTag in groupTags" :key="groupTag.id">
      <div class="overflow-x-auto shadow-md rounded-lg bg-mainblue p-4">
        <header class="flex w-full items-center">
          <div class="bg-blue-500/70 rounded-md p-2">
            <BookmarkIcon class="size-5 text-white" />
          </div>
          <span>
            <p class="text-black font-semibold ms-2">{{ groupTag.name }}</p>
            <p class="text-gray-500 ms-2">3 Tags</p>
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

        <section class="mt-4 flex items-center gap-x-2 text-xs">
          <TagIcon class="size-5 text-black" />
          <div
            class="flex items-center gap-x-2 rounded-lg p-2 bg-slate-200/80 border border-gray-300/80"
          >
            <p class="text-black">2024</p>
            <PencilIcon class="size-4 text-green-500" />
            <TrashIcon class="size-4 text-red-500" />
          </div>
          <div
            class="flex items-center gap-x-2 rounded-lg p-2 bg-slate-200/80 border border-gray-300/80"
          >
            <p class="text-black">2024</p>
            <PencilIcon class="size-4 text-green-500" />
            <TrashIcon class="size-4 text-red-500" />
          </div>
          <div
            class="flex items-center gap-x-2 rounded-lg p-2 bg-slate-200/80 border border-gray-300/80"
          >
            <p class="text-black">2024</p>
            <PencilIcon class="size-4 text-green-500" />
            <TrashIcon class="size-4 text-red-500" />
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<style scoped></style>
