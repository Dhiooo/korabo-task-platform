# Korabo - Platform Kolaborasi Tugas Mahasiswa 🍂☕️

**Korabo** adalah platform manajemen tugas kelompok mahasiswa berbasis web yang menggunakan pendekatan **Linear-Modern Kanban**. Sistem ini dirancang untuk meningkatkan transparansi, kedisiplinan, dan akuntabilitas dalam pengerjaan proyek kolaboratif di lingkungan akademik.

---

## 🚀 Live Demo & Akses Percobaan
Website: [http://korabo.great-site.net](http://korabo.great-site.net)

### **🔑 Akun Percobaan (Untuk Dosen/Penguji)**
Gunakan akun berikut untuk mencoba fitur kolaborasi tanpa perlu mendaftar:

| Role | NIM | Password |
| :--- | :--- | :--- |
| **User 1 (Admin/Ketua)** | `20230001` | `dhio` |
| **User 2 (Anggota)** | `20230002` | `student1` |
| **User 3 (Anggota)** | `20230003` | `student2` |

---

## ✨ Fitur Utama
*   **Modern Kanban Workspace**: Pengorganisasian tugas per anggota kelompok dengan sistem accordion yang rapi.
*   **Strict Admin Control**: Hanya admin yang memiliki otoritas penuh untuk manajemen tugas dan grup.
*   **Real-time Activity Log**: Pencatatan setiap aksi dalam grup secara otomatis dan real-time.
*   **Punctuality Metrics**: Laporan kinerja otomatis berdasarkan ketepatan waktu penyelesaian tugas terhadap deadline.
*   **PDF Proof System**: Kewajiban unggah bukti pengerjaan berupa file PDF untuk transparansi hasil kerja.
*   **Earthy Autumn Design**: Antarmuka estetik dengan gaya Glassmorphism yang responsif.

## 🛠 Tech Stack
*   **Frontend**: Vite, Vanilla JavaScript, CSS3 (Modern UI).
*   **Backend**: PHP (Migrated for Deployment).
*   **Database**: MySQL.
*   **Storage**: Online/Local File Storage (for PDF proofs).

## 📋 Pengujian Aspek Kualitas (Quality Testing)
Berdasarkan hasil pengujian fungsionalitas dan desain pada Daily Project 7:

| Aspek Kualitas | Deskripsi Pengujian | Hasil | Status |
| :--- | :--- | :--- | :--- |
| **Functionality** | Menguji fitur login, pendaftaran, pembuatan grup, dan manajemen tugas. | Semua fitur berjalan sesuai logika bisnis yang dirancang. | ✅ PASS |
| **Usability** | Menguji kemudahan navigasi dan estetika antarmuka (UI/UX). | Desain Glassmorphism intuitif dan memudahkan pengguna dalam memantau tugas. | ✅ PASS |
| **Reliability** | Menguji keakuratan log aktivitas realtime dan perhitungan deadline. | Log diperbarui secara otomatis dan skor ketepatan waktu terhitung presisi. | ✅ PASS |
| **Security** | Menguji proteksi halaman (Auth Guard) dan hak akses Admin. | Pengguna tanpa login tidak bisa mengakses workspace; fitur admin terproteksi. | ✅ PASS |
| **Performance** | Menguji kecepatan pemuatan data dan responsivitas aplikasi. | Aplikasi berjalan ringan dengan transisi antar halaman yang mulus. | ✅ PASS |
