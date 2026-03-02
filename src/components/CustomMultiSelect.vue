<script setup>
import { ref, computed } from "vue";
import { ChevronDownIcon } from "@heroicons/vue/24/outline";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  options: {
    type: Array,
    required: true,
  },
  optionLabel: {
    type: String,
    default: "label",
  },
  optionValue: {
    type: String,
    default: "value",
  },
  placeholder: {
    type: String,
    default: "Pilih opsi...",
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  hideSelectedItems: {
    type: Boolean,
    default: false,
  },
});

const safeModelValue = computed(() =>
  Array.isArray(props.modelValue) ? props.modelValue : [],
);

const emit = defineEmits(["update:modelValue", "change"]);

const isOpen = ref(false);
const searchQuery = ref("");

const filteredOptions = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.options;
  }
  return props.options.filter((option) =>
    String(option[props.optionLabel])
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase()),
  );
});

const displayLabel = computed(() => {
  if (!props.modelValue || props.modelValue.length === 0) {
    return props.placeholder;
  }
  if (props.multiple) {
    return `${props.modelValue.length} item dipilih`;
  }
  const selected = props.options.find(
    (opt) => opt[props.optionValue] === safeModelValue.value[0],
  );
  return selected ? selected[props.optionLabel] : props.placeholder;
});

const toggleOption = (optionValue) => {
  let newValue;
  const current = safeModelValue.value;
  if (props.multiple) {
    if (current.includes(optionValue)) {
      newValue = current.filter((v) => v !== optionValue);
    } else {
      newValue = [...current, optionValue];
    }
  } else {
    newValue = current[0] === optionValue ? [] : [optionValue];
    isOpen.value = false;
  }
  emit("update:modelValue", newValue);
  emit("change");
};

const isSelected = (optionValue) => {
  return safeModelValue.value.includes(optionValue);
};

const removeOption = (optionValue, event) => {
  event.stopPropagation();
  const newValue = safeModelValue.filter((v) => v !== optionValue);
  emit("update:modelValue", newValue);
  emit("change");
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = "";
  }
};

const closeDropdown = () => {
  isOpen.value = false;
};
</script>

<template>
  <div class="relative w-full">
    <!-- Dropdown trigger button -->
    <div
      @click="toggleDropdown"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
      :class="{ 'border-blue-500 ring-2 ring-blue-500/10': isOpen }"
      tabindex="0"
    >
      <span
        :class="{
          'text-gray-400': !modelValue || modelValue.length === 0,
          'text-black': modelValue && modelValue.length > 0,
        }"
      >
        {{ displayLabel }}
      </span>
      <ChevronDownIcon
        class="size-5 text-gray-400 transition-transform"
        :class="{ 'rotate-180': isOpen }"
      />
    </div>

    <!-- Dropdown menu -->
    <div
      v-show="isOpen"
      class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 overflow-hidden"
    >
      <!-- Search input -->
      <div class="p-2 border-b border-gray-200">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          @click.stop
        />
      </div>

      <!-- Options list -->
      <div class="max-h-60 overflow-y-auto">
        <div
          v-if="filteredOptions.length === 0"
          class="px-3 py-2 text-gray-400 text-sm"
        >
          Tidak ada opsi
        </div>
        <div
          v-for="option in filteredOptions"
          :key="option[optionValue]"
          @click="toggleOption(option[optionValue])"
          class="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2 transition-colors text-sm"
          :class="{
            'bg-blue-50 text-blue-600': isSelected(option[optionValue]),
          }"
        >
          <input
            type="checkbox"
            :checked="isSelected(option[optionValue])"
            class="w-4 h-4 cursor-pointer"
            @click.stop="toggleOption(option[optionValue])"
          />
          <span class="text-black">{{ option[optionLabel] }}</span>
        </div>
      </div>
    </div>

    <!-- Selected items display (below dropdown) -->
    <div
      v-if="!hideSelectedItems && modelValue && modelValue.length > 0"
      class="flex flex-wrap gap-2 mt-3"
    >
      <div
        v-for="selectedValue in modelValue"
        :key="selectedValue"
        class="px-3 py-1 border border-gray-300 text-black rounded-full text-sm font-medium flex items-center gap-2 bg-gray-50"
      >
        {{
          options.find((opt) => opt[optionValue] === selectedValue)?.[
            optionLabel
          ]
        }}
        <button
          @click="removeOption(selectedValue, $event)"
          class="hover:bg-red-500 cursor-pointer rounded-full p-0.5 transition-colors bg-red-500/80"
          type="button"
        >
          <svg
            class="size-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(input[type="checkbox"]) {
  accent-color: #3b82f6;
}
</style>
