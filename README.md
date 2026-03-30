# 📚 Knowledge Management System - Frontend

Platform manajemen pengetahuan modern berbasis web untuk mengelola, mengorganisir, dan berbagi dokumen dengan efisien.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- npm atau yarn

### Installation

```bash
# Clone repository
git clone <repository-url>

# Navigate ke project
cd fe-knm

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Server akan berjalan di `http://localhost:5173`

---

## 📦 Tech Stack

| Technology       | Version | Purpose                          |
| ---------------- | ------- | -------------------------------- |
| **Vue 3**        | ^3.5.24 | Progressive JavaScript Framework |
| **Vite**         | 7.2.5   | Next Generation Frontend Tooling |
| **Vue Router**   | ^4.6.4  | Client-side routing              |
| **Pinia**        | ^3.0.4  | State Management                 |
| **Tailwind CSS** | ^4.1.18 | Utility-first CSS Framework      |
| **PrimeVue**     | ^4.5.4  | UI Component Library             |
| **Axios**        | ^1.13.4 | HTTP Client                      |
| **Zod**          | ^4.3.6  | Schema Validation                |

---

## 🏗️ Project Structure

```
fe-knm/
├── src/
│   ├── assets/              # Images, fonts, static files
│   ├── components/          # Reusable Vue components
│   │   ├── Button.vue
│   │   ├── Modal.vue
│   │   ├── FormLogin.vue
│   │   ├── Sidebar.vue
│   │   ├── Toast.vue
│   │   └── ...
│   ├── layouts/             # Layout components
│   │   ├── AuthLayout.vue   # Layout untuk halaman login
│   │   └── MainLayout.vue   # Layout untuk dashboard
│   ├── pages/               # Page/View components
│   │   ├── Login.vue        # 🆕 Login page (Composition API)
│   │   ├── Dashboard.vue
│   │   ├── Document.vue
│   │   ├── Chat.vue
│   │   ├── Tags.vue
│   │   ├── User.vue
│   │   └── Profile.vue
│   ├── router/
│   │   └── route.js         # Vue Router configuration
│   ├── services/            # API services
│   │   ├── Api.js
│   │   ├── AuthServices.js
│   │   ├── FileServices.js
│   │   ├── User.js
│   │   └── Tags.js
│   ├── stores/              # Pinia state management
│   │   └── Auth.js
│   ├── utils/               # Helper utilities
│   │   ├── MessageError.js
│   │   └── PasswordValidator.js
│   ├── helpers/
│   │   └── helper.js
│   ├── icon/
│   │   └── beakerIcon.js
│   ├── App.vue              # Root component
│   ├── main.js              # Application entry point
│   └── style.css            # Global styles
├── public/                  # Static assets
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## 📖 Available Scripts

### Development

```bash
npm run dev
```

Menjalankan development server dengan hot module replacement (HMR).

### Build

```bash
npm run build
```

Membuat production build yang optimized.

### Preview

```bash
npm run preview
```

Preview build production secara lokal sebelum deployment.

---

## 🔐 Authentication & Routing

### Login Flow

- **Route**: `/login`
- **Layout**: `AuthLayout`
- **Component**: `Login.vue` (Composition API)
- State: Email, Password, Loading, Error handling
- Redirect ke Dashboard setelah berhasil login

### Protected Routes

Semua routes kecuali `/login` memerlukan authentication token:

- `/dashboard` - Dashboard utama
- `/document` - Manajemen dokumen
- `/chat` - Chat/Komunikasi
- `/tags` - Tag management
- `/user` - User management
- `/profile` - Profile pengguna

### Route Guard

Navigation guard di `router/route.js` mengecek keberadaan token. User yang tidak authenticated akan diredirect ke `/login`.

---

## 🎨 UI Components

### Reusable Components

- **Button.vue** - Button component dengan berbagai variant
- **Modal.vue** - General modal dialog
- **Toast.vue** - Notification toast
- **Sidebar.vue** - Navigation sidebar
- **LoadingSpinner.vue** - Loading indicator
- **CustomMultiSelect.vue** - Multi-select dropdown
- **InputSearch.vue** - Search input field
- **Card Components** (CardDashboard, CardIndeks, CardStatus)

### Component Locations

- Components → `src/components/`
- Pages/Views → `src/pages/`
- Layouts → `src/layouts/`

---

## 🔄 State Management (Pinia)

### Auth Store

Located: `src/stores/Auth.js`

```javascript
// Usage
import { useAuthStores } from "@/stores/Auth";

const authStore = useAuthStores();
authStore.message = "Your message";
```

---

## 🌐 API Services

### Main Services

- **AuthServices.js** - Login, logout, authentication
- **FileServices.js** - Document/file management
- **User.js** - User-related API calls
- **Tags.js** - Tag management
- **Api.js** - Base API configuration

### Usage Example

```javascript
import { Login } from "@/services/AuthServices";

const response = await Login({
  email: "user@email.com",
  password: "password",
});
```

---

## ✨ Recent Updates

### Refactor Login (Composition API)

- ✅ Login form dipindahkan dari component ke halaman terpisah (`pages/Login.vue`)
- ✅ Menggunakan Composition API dengan `ref()` dan `reactive` state
- ✅ Route baru: `/login`
- ✅ Automatic redirect dari root `/` ke `/login`
- ✅ Protected routes redirect ke `/login` jika tidak authenticated

---

## 📝 Component Usage Guidelines

### Composition API Style

Gunakan `<script setup>` untuk component baru:

```vue
<script setup>
import { ref } from "vue";

const count = ref(0);
</script>

<template>
  <div>{{ count }}</div>
</template>
```

### Form Validation

Validasi menggunakan Zod atau password validator bawaan:

```javascript
import { validatePassword } from "@/utils/PasswordValidator";

const isValid = validatePassword(password);
```

---

## 📚 Resources & Documentation

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Vue Router Guide](https://router.vuejs.org/)
- [Pinia State Management](https://pinia.vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [PrimeVue Components](https://primevue.org/)

---

## 🤝 Development Tips

1. **Component Development**: Collocate styles, scripts, dan template dalam satu file `.vue`
2. **State Management**: Gunakan Pinia stores untuk state yang di-share antar components
3. **API Calls**: Gunakan services di `src/services/` untuk semua API requests
4. **Styling**: Gunakan Tailwind CSS classes untuk styling, hindari inline styles
5. **Error Handling**: Implement proper error boundaries dan user feedback via Toast

---

## 📋 Project Checklist

- [x] Vue 3 + Vite setup
- [x] Routing dengan Vue Router
- [x] State management dengan Pinia
- [x] Authentication flow
- [x] Protected routes
- [x] UI components library
- [x] Login page refactored (Composition API)
- [ ] Unit tests
- [ ] E2E tests
- [ ] Deployment guide

---

## 📧 Support

Untuk pertanyaan atau issue, silahkan buat issue di repository atau hubungi tim development.

---

**Last Updated**: March 30, 2026 | **Version**: 0.0.0
