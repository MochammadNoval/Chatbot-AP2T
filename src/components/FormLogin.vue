<template>
  <div class="flex min-h-screen items-center justify-center p-4">
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
        <h2 class="text-2xl font-semibold">Selamat Datang</h2>
        <p class="text-sm text-muted-foreground text-slate-500">
          Masuk ke akun Anda untuk melanjutkan
        </p>
      </div>

      <!-- Content -->
      <div class="p-6">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-2">
            <label for="email">Email</label>
            <div
              class="w-full rounded-xl bg-blue-100/40 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 border border-slate-300 mt-2 px-3 py-2 flex gap-x-2 p-2 items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-6"
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
                v-model="email"
                required
                class="w-full rounded-xl bg-blue-100/40 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 border border-slate-300 mt-2 px-3 py-2"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              v-model="password"
              required
              class="w-full rounded-xl bg-blue-100/40 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 border border-slate-300 mt-2 px-3 py-2"
            />
          </div>

          <button
            type="submit"
            class="w-full bg-blue-400 text-white py-2 rounded-xl flex items-center justify-center cursor-pointer"
            :disabled="isLoading"
          >
            <template v-if="isLoading">
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              Memproses...
            </template>
            <template v-else> Masuk </template>
          </button>
        </form>

        <p class="mt-4 text-center text-sm text-slate-500">
          Silahkan menghubungi admin untuk buat akun baru
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useToast } from "primevue/usetoast";
import { z } from "zod";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { Button } from "primevue";
const toast = useToast();

const show = () => {
  toast.add({
    severity: "info",
    summary: "Info Message",
    detail: "Message Content",
    life: 3000,
  });
};

const initialValues = ref({
  username: "",
  email: "",
});

const resolver = ref(
  zodResolver(
    z.object({
      username: z.string().min(1, { message: "Username is required." }),
      email: z
        .string()
        .min(1, { message: "Email is required." })
        .email({ message: "Invalid email address." }),
    }),
  ),
);

const onFormSubmit = ({ valid }) => {
  if (valid) {
    toast.add({
      severity: "success",
      summary: "Form is submitted.",
      life: 3000,
    });
  }
};
</script>
