<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import ProgressSpinner from "primevue/progressspinner";
import { useToast } from "primevue/usetoast";
import { Toast } from "primevue";
import { useAuthStores } from "../stores/Auth";
import { Login } from "../services/AuthServices";

const router = useRouter();
const authStore = useAuthStores();
const toast = useToast();
const isSubmit = ref(false);

const showPassword = ref(false);
const form = ref({
  email: "",
  password: "",
});

const errorMessage = ref("");
const loading = ref(false);

const visiblePassword = () => {
  showPassword.value = !showPassword.value;
};

const handleSessionExpired = () => {
  // ✅ Hanya tampilkan toast sekali
  toast.add({
    severity: "error",
    summary: "Session habis",
    detail: "Silahkan untuk login kembali!",
    life: 2500,
  });
};



// Cleanup event listener saat component unmounted
onUnmounted(() => {
  window.removeEventListener("auth:expired", handleSessionExpired);
});


const handleLogin = async () => {
  errorMessage.value = "";
  loading.value = true;
  try {
    const res = await Login({
      email: form.value.email,
      password: form.value.password,
    });
    toast.add({
      severity: "success",
      summary: "Login berhasil!",
      detail: "Anda akan segera diarahkan ke dashboard",
      life: 2500,
    });
    authStore.message = null;
    setTimeout(() => {
      router.push("/dashboard");
    }, 3000);
    isSubmit.value = true;
  } catch (error) {
    if (error.response?.status === 400) {
      errorMessage.value = "username atau Password Salah!";
      toast.add({
        severity: "error",
        summary: "Error",
        detail: errorMessage.value,
        life: 5000,
      });
    } else if (error.response?.status === 422) {
      errorMessage.value = "Data tidak valid";
      toast.add({
        severity: "error",
        summary: "Error",
        detail: errorMessage.value,
        life: 5000,
      });
    } else {
      console.error(error);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <Toast />
    <div
      class="w-full max-w-md glass-effect border-border/50 rounded-xl bg-white text-black shadow"
    >
      <!-- Header -->
      <div class="text-center p-6 flex-col">
        <img
          src="./../image/logo-pln-plus.svg"
          alt=""
          class="text-center w-32 mx-auto mb-2"
        />
        <h2 class="text-[22px] font-bold">Selamat Datang</h2>
        <p class="text-sm text-muted-foreground text-slate-500">
          Masuk ke akun Anda untuk melanjutkan
        </p>
      </div>

      <!-- Content -->
      <div class="p-6">
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-2">
            <label for="username">Email</label>
            <div
              class="w-full rounded-xl bg-blue-100/40 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 border border-slate-300 mt-2 pl-2 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-6 text-slate-500"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>

              <input
                id="email"
                type="email"
                placeholder="nama@email.com"
                v-model="form.email"
                required
                class="w-full focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
              />
            </div>
          </div>

          <div class="space-y-2 flex flex-col">
            <label for="password">Password</label>
            <div
              class="w-full rounded-xl bg-blue-100/40 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 border border-slate-300 mt-2 pl-2 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-6 text-slate-600"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
                />
              </svg>

              <input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="********"
                v-model="form.password"
                required
                class="w-full focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
              />

              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="text-slate-500 size-6 me-2 cursor-pointer"
                v-if="showPassword"
                @click="visiblePassword"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
              <svg
                v-else
                @click="visiblePassword"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-6 text-slate-500 me-2 cursor-pointer"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            </div>
            <p class="text-sm text-slate-600 ms-auto">Lupa Password?</p>
          </div>

          <button
            v-if="!isSubmit"
            type="submit"
            class="w-full bg-blue-500 text-white py-2 rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition"
            :disabled="loading"
          >
            <ProgressSpinner
              v-if="loading"
              style="width: 25px; height: 25px"
              stroke-width="8"
              fill="transparent"
              aria-label="Custom ProgressSpinner"
            />

            <template
              v-else
              class="flex gap-x-5 items-center border border-red-300"
            >
              <p>Masuk</p>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-6 ms-1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25"
                />
              </svg>
            </template>
          </button>

          <button
            v-else
            class="w-full bg-blue-500 text-white py-2 rounded-xl flex items-center justify-center cursor-not-allowed hover:bg-blue-600 transition"
            disabled
          >
            <template class="flex items-center">
              <p>Masuk</p>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-6 ms-1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25"
                />
              </svg>
            </template>
          </button>
        </form>

        <p class="mt-4 text-center text-sm text-slate-500">
          Silahkan menghubungi admin untuk buat akun baru
        </p>
      </div>
    </div>
  </div>
</template>
