# Create User Feature - Quick Reference Guide

## 📁 Files Overview

| File                                 | Type      | Status     | Purpose                      |
| ------------------------------------ | --------- | ---------- | ---------------------------- |
| `src/utils/PasswordValidator.js`     | Utility   | ✅ NEW     | Password validation logic    |
| `src/services/User.js`               | Service   | ✅ UPDATED | API integration              |
| `src/components/UserCreateModal.vue` | Component | ✅ NEW     | Modal form untuk create user |
| `src/pages/User.vue`                 | Page      | ✅ UPDATED | Manajemen user page          |

---

## 🚀 Quick Start

### Import dan Gunakan Modal di Component:

```vue
<script setup>
import UserCreateModal from "@/components/UserCreateModal.vue";
import { ref } from "vue";

const showModal = ref(false);

const handleUserCreated = () => {
  // Refresh your data here
  console.log("User berhasil dibuat!");
};
</script>

<template>
  <UserCreateModal
    :isOpen="showModal"
    @close="showModal = false"
    @success="handleUserCreated"
  />

  <button @click="showModal = true">Buat User</button>
</template>
```

---

## 🔐 Password Validation Rules

Semua criteria harus dipenuhi:

| No  | Criteria                       | Example                        |
| --- | ------------------------------ | ------------------------------ |
| 1   | Minimal 8 karakter             | ✅ `MyPassword123!` (14 chars) |
| 2   | Mengandung huruf kapital (A-Z) | ✅ `MyPassword123!` (M, P)     |
| 3   | Mengandung angka (0-9)         | ✅ `MyPassword123!` (1,2,3)    |
| 4   | Mengandung simbol khusus       | ✅ `MyPassword123!` (!)        |

**Contoh valid password**:

- `SecureP@ss123`
- `MyPassword#2024`
- `Admin@123`

**Contoh invalid password**:

- `password123` ❌ (tidak ada huruf kapital)
- `Password` ❌ (tidak ada angka, tidak ada simbol)
- `Pass1!` ❌ (kurang dari 8 karakter)

---

## 🛠️ Validation Architecture

### 3-Layer Validation:

```
Validation Layer
    ↓
1. Form Level (UserCreateModal)
   - Empty field checks
   - Format checks (email)
   - Name length checks
    ↓
2. Business Logic (PasswordValidator)
   - Password strength validation
   - Multi-criteria validation
    ↓
3. API Level (Backend)
   - Duplicate email check
   - Additional business rules
   - Data persistence
```

---

## 📤 Form Submission Flow

```
User Input
    ↓
[Submit Button Clicked]
    ↓
validateForm()
    ├─ Check empty fields → Show Error Toast ❌
    ├─ Check email format → Show Error Toast ❌
    ├─ Check name length → Show Error Toast ❌
    └─ PasswordValidator.validate() → Show Error Toast ❌
    ↓
[All Validations Passed ✅]
    ↓
isLoading = true
[Button Disabled, Loading State]
    ↓
API Call: User.createUser()
    ├─ Success → Show Success Toast ✅
    │           → Reset Form
    │           → Close Modal after 1.5s
    │           → Emit @success event
    │
    └─ Error → Show Error Toast ❌
               → Keep Modal Open
               → Keep Form Data
               → Enable Button
    ↓
isLoading = false
[Button Enabled Again]
```

---

## 🎯 Component Props & Events

### UserCreateModal Props

```typescript
interface UserCreateModalProps {
  isOpen: boolean; // Controls modal visibility
}
```

### UserCreateModal Events

```typescript
@close: void      // When modal is closed
@success: (data: User) => void  // When user created successfully
```

---

## 🔌 API Endpoints

### Create User

```
POST /api/users
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecureP@ss123"
}

Response (201):
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-03-24T10:30:00Z"
}

Error (400/409):
{
  "message": "Email sudah terdaftar"
}
```

---

## 💾 State Management

### User.vue State:

```javascript
showModal; // boolean - Modal visibility
isLoadingUsers; // boolean - Loading state saat fetch users
users; // array - Daftar user
showToast; // boolean - Toast notification visibility
toastMessage; // string - Toast message content
toastType; // string - Toast type (success, error, warning, info)
```

### UserCreateModal State:

```javascript
formData; // object - Form input data
isLoading; // boolean - Submission loading state
showToast; // boolean - Toast notification visibility
toastMessage; // string - Toast message content
toastType; // string - Toast type
```

---

## 🎨 Styling Classes Used

- **TailwindCSS**: `px-`, `py-`, `bg-`, `text-`, `rounded-`, `hover:`, `disabled:`, `transition-`, etc.
- **DaisyUI**: `.toast`, `.toast-top`, `.toast-end`, `.alert`, `.alert-success`, `.alert-error`, `.alert-warning`, `.alert-info`
- **Modal Backdrop**: Fixed positioning, semi-transparent black overlay
- **Form Inputs**: Rounded corners, border, focus ring
- **Buttons**: Blue primary color with hover states

---

## ⚙️ Configuration & Customization

### Toast Duration

```javascript
// Default: 5000ms
<Toast
  :message="toastMessage"
  :type="toastType"
  :duration="5000"  // Customize here
/>
```

### Modal Close Delay

```javascript
// After successful creation, delay before closing
setTimeout(() => {
  emit("success", response);
  closeModal();
}, 1500); // Adjust this value if needed
```

### Password Requirements

Edit `src/utils/PasswordValidator.js` untuk mengubah kriteria:

```javascript
// Example: Change minimum length from 8 to 10
hasMinimumLength() {
  return this.password.length >= 10; // Changed from 8
}
```

---

## 🐛 Common Issues & Solutions

### Issue: Toast doesn't appear

**Solution**: Check if `showToast` ref is properly bound in template

### Issue: Modal doesn't close after success

**Solution**: Check if `emit("success")` is being called before `closeModal()`

### Issue: Form validation errors not displaying

**Solution**: Ensure `PasswordValidator` is imported correctly and `validateForm()` is called

### Issue: Password validation always fails

**Solution**: Check all 4 criteria are met - not just one:

- ✅ 8+ characters
- ✅ Uppercase letter
- ✅ Number
- ✅ Special character

### Issue: API error message not showing

**Solution**: Check backend returns error in format: `{ message: "Error description" }`

---

## 📦 Dependencies

```json
{
  "vue": "^3.5.24",
  "@heroicons/vue": "^2.2.0",
  "axios": "^1.13.4",
  "tailwindcss": "^4.1.18",
  "daisyui": "^5.5.18"
}
```

---

## ✅ Testing Checklist

Before deployment, verify:

- [ ] Profile page loads correctly
- [ ] Click "Tambah Pengguna" button opens modal
- [ ] All form fields render correctly
- [ ] Form validation works for all fields
- [ ] Error toast appears for invalid input
- [ ] Success toast appears after creating user
- [ ] Modal closes after success
- [ ] User list refreshes after creation
- [ ] Button states work correctly (enabled/disabled)
- [ ] Mobile responsive design works
- [ ] No console errors

---

## 📚 Related Files

- **Logo/Icons**: Heroicons Vue
- **Toast Component**: `src/components/Toast.vue`
- **Modal Layout**: Tailwind CSS + DaisyUI
- **HTTP Client**: `src/services/Api.js` (axios configured)
- **Auth Token**: Automatically injected by Api.js interceptor

---

## 🔄 Future Enhancements

- [ ] Add email verification step
- [ ] Add password strength meter in real-time
- [ ] Add role assignment during user creation
- [ ] Add bulk user import feature
- [ ] Add user edit functionality
- [ ] Add user deactivation (soft delete)
- [ ] Add audit logging

---

## 📞 Support

For issues or questions:

1. Check error message in toast notification
2. Check browser console for errors
3. Verify API endpoint is correct
4. Check network tab in DevTools
5. Ensure backend is running
