# Guide AI - Panduan Pengembangan FE-KNM

File ini berisi panduan khusus yang harus diikuti oleh AI sebelum menjawab atau membuat perubahan pada proyek ini.

---

## 📋 Aturan Utama

### 1. **Jangan Generate Code Langsung**
- ❌ **DILARANG**: Langsung memberikan kode complete dan siap pakai
- ✅ **YANG BENAR**: 
  - Jelaskan rencana perubahan dengan **detail** terlebih dahulu
  - Breakdown fitur/perubahan menjadi langkah-langkah yang jelas
  - Jelaskan **alasan** di balik setiap keputusan
  - Minta konfirmasi dari user sebelum implementasi
  - Setelah mendapat persetujuan, baru buat kode

**Format yang ideal:**
```
## Rencana Perubahan: [Nama Fitur]

### Analisis Kebutuhan
- Apa yang perlu diubah
- Alasan (performa, maintainability, user experience, dll)

### Breakdown Implementasi
1. **Step 1**: [Deskripsi]
   - File yang akan diubah: x, y, z
   - Alasan: ...
   
2. **Step 2**: [Deskripsi]
   - File yang akan diubah: a, b, c
   - Alasan: ...

### Pertimbangan Penting
- Risk atau hal yang perlu diperhatikan
- Dependency atau dampak ke komponen lain

Setujukah dengan rencana ini? Ada yang ingin dimodifikasi?
```

---

### 2. **Tidak Merubah Struktur Data yang Asli**
- ❌ **DILARANG**: Mengubah nama property, tipe data, atau struktur state/store
- ❌ **DILARANG**: Menghapus atau mengganti field yang sudah ada
- ✅ **YANG BENAR**:
  - Menambahkan property **baru** jika diperlukan (dengan penjelasan)
  - Menjaga **backward compatibility**
  - Jika ada perubahan structure, **jelaskan impact**-nya terhadap komponen lain
  - Lakukan refactoring secara **incremental** dan hati-hati

**Contoh Struktur Data yang Harus Dijaga:**
- State di `stores/Auth.js`
- Data models dari API
- Format response dari backend
- Struktur component props

**Jika perubahan structure benar-benar diperlukan:**
1. Jelaskan alasan mengapa harus diubah
2. Mapping lama → baru untuk setiap field
3. Daftar semua komponen yang akan terpengaruh
4. Plan untuk update semua komponen yang terdampak

---

### 3. **Dokumentasi File di Folder Khusus**
- ✅ Semua file dokumentasi (`.md`) harus disimpan di folder `/docs`
- ✅ Struktur folder dokumentasi:
  ```
  docs/
  ├── guide-ai.md (panduan ini)
  ├── API.md
  ├── ARCHITECTURE.md
  ├── SETUP.md
  ├── FEATURES.md
  └── [file dokumentasi lainnya].md
  ```
- ❌ Jangan membuat file MD di berbagai tempat
- ❌ Jangan membuat file MD di root folder

---

### 4. **Jelaskan dengan Detail Rencana Perubahan Code**

Setiap rencana perubahan harus mencakup:

#### A. **Konteks & Alasan**
```
- Masalah yang ingin diselesaikan
- User story atau requirement
- Alasan mengapa perubahan ini diperlukan
```

#### B. **Analisis Dampak**
```
- Komponen mana saja yang akan terpengaruh
- API/Service mana saja yang perlu diubah
- State/Store yang akan berubah
- Potensi breaking changes
```

#### C. **Breakdown Implementasi Step-by-Step**
```
Setiap step harus mencakup:
1. Deskripsi jelas apa yang akan dilakukan
2. File-file yang akan dimodifikasi
3. Type perubahan (create/update/delete)
4. Alasan/justifikasi
5. Dependencies terhadap step lainnya
```

#### D. **Testing Plan**
```
- Bagian mana yang perlu ditest
- Cara testing secara manual
- Edge cases yang perlu diperhatikan
```

#### E. **Rollback Plan (jika diperlukan)**
```
- Apa yang perlu dikembalikan jika ada issue
- Cara restore ke state sebelumnya
```

---

## 🗂️ Struktur Proyek (JANGAN DIUBAH)

```
fe-knm/
├── src/
│   ├── components/          (Vue components reusable)
│   ├── pages/              (Page components / views)
│   ├── layouts/            (Layout wrappers)
│   ├── router/             (Vue Router configuration)
│   ├── services/           (API calls & backend communication)
│   ├── stores/             (State management - Pinia/Vuex)
│   ├── composables/        (Reusable logic / hooks)
│   ├── helpers/            (Utility functions)
│   ├── utils/              (More utilities)
│   ├── icon/               (Icon definitions)
│   ├── image/              (Images & assets)
│   ├── style.css           (Global styles)
│   ├── App.vue             (Root component)
│   └── main.js             (Entry point)
├── public/                 (Static files)
├── docs/                   (Dokumentasi project)
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

**Setiap file/folder punya tujuan spesifik - jangan ubah semantik folder!**

---

## 💡 Contoh Pertanyaan yang BENAR

### User: "Saya mau add fitur export PDF untuk document"

**Jawaban SALAH:**
```
// Code langsung
import jsPDF from 'jspdf';
export const exportToPDF = (data) => { ... }
```

**Jawaban BENAR:**
```
## Rencana Fitur: Export Document ke PDF

### Analisis Kebutuhan
- User ingin download document dalam format PDF
- File harus include: title, content, timestamp
- Compatibility dengan Chrome, Firefox, Safari

### Breakdown Implementasi

1. **Install dependency**
   - Tambahkan library `jspdf` atau `pdfkit`
   - File: package.json
   - Alasan: Tidak ada library PDF native di JS

2. **Create service untuk PDF export**
   - Buat: `src/services/PdfExportService.js`
   - Function: `exportDocumentPDF(documentData)`
   - Return: Blob yang siap didownload
   - Alasan: Encapsulation, reusable logic

3. **Add button di DocumentModal**
   - File: `src/components/DocumentModal.vue`
   - Tambah button "Export PDF"
   - Trigger: call PdfExportService.exportDocumentPDF()
   - Alasan: User-friendly access point

4. **Testing Plan**
   - Test PDF generation dengan berbagai ukuran document
   - Verify formatting & layout di PDF
   - Test di berbagai browser

### Pertimbangan
- PDF size bisa besar jika ada images
- Memory usage untuk document yang sangat besar
- User permission/security untuk export

Setujukah? Ada yang mau dimodifikasi sebelum saya mulai implementasi?
```

---

## 🎯 Workflow yang Harus Diikuti

```
1. USER MEMBERIKAN REQUEST
   ↓
2. AI ANALISIS & BUAT RENCANA DETAIL
   ├─ Jangan code dulu!
   ├─ Explain thoroughly
   └─ Minta approval
   ↓
3. USER APPROVE / REQUEST PERUBAHAN
   ↓
4. AI IMPLEMENTASI SESUAI RENCANA
   ├─ Execute step-by-step
   ├─ Update file yang diperlukan
   └─ Verify changes
   ↓
5. AI CONFIRM COMPLETION
   ├─ Apa yang berhasil dilakukan
   ├─ Bagian yang perlu user testing
   └─ Next steps (jika ada)
```

---

## ❌ Hal-Hal yang DILARANG

- [ ] Generate code lengkap sebelum disetujui
- [ ] Mengubah nama property di state/store tanpa penjelasan mendalam
- [ ] Menghapus atau rename file/folder struktur project
- [ ] Membuat dokumentasi di folder random (selain `/docs`)
- [ ] Assume struktur data tanpa konsultasi
- [ ] Skip testing plan dalam rencana
- [ ] Membuat breaking changes tanpa warning explicit
- [ ] Skip analisis dampak terhadap komponen lain

---

## ✅ Hal-Hal yang HARUS Dilakukan

- [x] Jelaskan rencana sebelum code
- [x] Breakdown fitur jadi langkah-langkah jelas
- [x] Jelaskan alasan setiap keputusan
- [x] Identifikasi file yang akan diubah
- [x] Analisis dampak terhadap komponen lain
- [x] Minta approval sebelum implementasi
- [x] Document dalam folder `/docs` jika perlu
- [x] Keep struktur data tetap konsisten
- [x] Provide testing strategy
- [x] Confirm completion dengan detail

---

## 📚 Dokumentasi Terkait

- [API Documentation](./API.md) - Catatan tentang API endpoints
- [Architecture](./ARCHITECTURE.md) - Struktur & flow aplikasi
- [Setup Guide](./SETUP.md) - Cara setup development environment

---

**Last Updated:** April 2026  
**Applicable to:** Frontend KNM Project (fe-knm)
