# Korabo - Platform Kolaborasi Tugas Mahasiswa 🍂☕️

**Korabo** adalah platform manajemen tugas kelompok mahasiswa berbasis web yang menggunakan pendekatan **Linear-Modern Kanban**. Sistem ini dirancang untuk meningkatkan transparansi, kedisiplinan, dan akuntabilitas dalam pengerjaan proyek kolaboratif di lingkungan akademik.

---

## Live Demo & Akses Percobaan
Website: [http://korabo.great-site.net](http://korabo.great-site.net)

### ** Akun Percobaan (Untuk Dosen/Penguji)**
Gunakan akun berikut untuk mencoba fitur kolaborasi tanpa perlu mendaftar:
PERLU DIINGAT: Bahwa website ini yang menjadi admin adalah pengguna yang membuat grup itu PERTAMA KALI

| Role | NIM | Password |
| :--- | :--- | :--- |
| **User 1 (Anggota)** | `20230001` | `dhio` |
| **User 2 (Anggota)** | `20230002` | `student1` |
| **User 3 (Anggota)** | `20230003` | `student2` |

---

## Fitur Utama
*   **Modern Kanban Workspace**: Pengorganisasian tugas per anggota kelompok dengan sistem accordion yang rapi.
*   **Strict Admin Control**: Hanya admin yang memiliki otoritas penuh untuk manajemen tugas dan grup.
*   **Real-time Activity Log**: Pencatatan setiap aksi dalam grup secara otomatis dan real-time.
*   **Punctuality Metrics**: Laporan kinerja otomatis berdasarkan ketepatan waktu penyelesaian tugas terhadap deadline.
*   **PDF Proof System**: Kewajiban unggah bukti pengerjaan berupa file PDF untuk transparansi hasil kerja.
*   **Earthy Autumn Design**: Antarmuka estetik dengan gaya Glassmorphism yang responsif.

## Tech Stack
*   **Frontend**: Vite, Vanilla JavaScript, CSS3 (Modern UI).
*   **Backend**: PHP (Migrated for Deployment).
*   **Database**: MySQL.
*   **Storage**: Online/Local File Storage (for PDF proofs).

## 📋 Daftar Fitur & Status Fungsionalitas
Berikut adalah daftar fitur utama yang telah diimplementasikan dan hasil pengujian fungsionalitasnya:

| Fitur | Deskripsi | Status |
| :--- | :--- | :--- |
| **Autentikasi** | Login dan Register Mahasiswa menggunakan NIM sebagai identitas unik. | ✅ PASS |
| **Workspace Management** | Membuat grup baru (Admin) atau bergabung ke grup via kode unik. | ✅ PASS |
| **Kanban Board** | Manajemen tugas dengan 4 stage: To Do, In Progress, Review, dan Done. | ✅ PASS |
| **Evidence Upload** | Fitur unggah bukti pengerjaan berupa file PDF pada tugas yang selesai. | ✅ PASS |
| **Activity Logging** | Pencatatan otomatis setiap aksi user (log) untuk transparansi tim. | ✅ PASS |
| **Performance Report** | Laporan statistik kinerja anggota berdasarkan ketepatan waktu (deadline). | ✅ PASS |
