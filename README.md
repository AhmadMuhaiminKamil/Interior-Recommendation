# Interior AI

**Interior AI** adalah aplikasi web berbasis Next.js yang membantu pengguna menemukan rekomendasi lantai vinyl yang cocok untuk ruangan mereka menggunakan AI. Cukup unggah foto ruangan, dan aplikasi akan menganalisis gaya interior, memberikan saran desain, mencarikan produk yang relevan dari katalog, lalu menampilkannya dalam simulasi maket interior 3D yang interaktif.

## Fitur Utama

- **Analisis Ruangan dengan AI** — Unggah foto ruangan, dan Gemini AI akan menganalisis gaya desain (Minimalis, Skandinavia, Industrial, dsb.) serta memberikan saran lantai yang sesuai.
- **Preferensi Ruangan (Opsional)** — Tambahkan catatan preferensi pribadi (misalnya "nuansa Japandi yang hangat"). AI akan mempertimbangkannya selama relevan dengan desain interior.
- **Pencarian Produk Berbasis Vector Search** — Deskripsi hasil analisis diubah menjadi embedding dan dicocokkan dengan katalog produk di Supabase menggunakan pencarian vektor (similarity search).
- **Simulasi Maket Interior 3D** — Lihat produk lantai terpilih dalam ruang 3D interaktif (dibangun dengan `@react-three/fiber` dan `@react-three/drei`), lengkap dengan mode edit untuk menambah, memindahkan, dan menghapus furnitur.
- **Autentikasi Sederhana** — Sistem login/logout berbasis cookie dengan password yang di-hash menggunakan bcrypt.

## Teknologi yang Digunakan

- **Framework:** [Next.js](https://nextjs.org) (App Router, Server Actions)
- **Bahasa:** TypeScript
- **Database & Vector Search:** [Supabase](https://supabase.com)
- **AI / LLM:** [Google Gemini API](https://ai.google.dev) (analisis gambar & embedding)
- **3D Rendering:** [Three.js](https://threejs.org), `@react-three/fiber`, `@react-three/drei`
- **Styling:** Tailwind CSS
- **Autentikasi:** bcryptjs + cookie-based session

## Memulai Proyek

### 1. Clone & Install Dependencies

```bash
npm install
# atau
yarn install
# atau
pnpm install
```

Project ini juga membutuhkan package tambahan untuk fitur 3D viewer:

```bash
npm install three @react-three/fiber @react-three/drei
```

### 2. Konfigurasi Environment Variables

Buat file `.env.local` di root project, lalu isi dengan variabel berikut:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key
```

| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase kamu |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase (digunakan di server, jaga kerahasiaannya) |
| `GEMINI_API_KEY` | API key untuk mengakses Gemini API (analisis gambar & embedding) |

> ⚠️ Jangan commit file `.env.local` ke repository. File ini sudah otomatis diabaikan oleh `.gitignore` bawaan Next.js.

### 3. Jalankan Development Server

```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser untuk melihat hasilnya.

## Struktur Project Singkat

```
app/
├── page.tsx      # Halaman utama: upload gambar, analisis, dan viewer 3D
├── actions.tsx   # Server actions: login, logout, analisis AI, vector search
├── layout.tsx    # Root layout & konfigurasi font
└── globals.css   # Style global
```

## Catatan Pengembangan

- Pencarian produk menggunakan RPC function `search_furnitur` di Supabase, yang perlu disiapkan terlebih dahulu di database (pgvector).
- Pastikan tabel `users` di Supabase menyimpan password dalam bentuk hash bcrypt, bukan plaintext.

## Pelajari Lebih Lanjut

Untuk belajar lebih lanjut tentang Next.js, lihat resource berikut:

- [Next.js Documentation](https://nextjs.org/docs) — pelajari fitur dan API Next.js.
- [Learn Next.js](https://nextjs.org/learn) — tutorial interaktif Next.js.

## Deploy

Cara termudah untuk deploy aplikasi Next.js adalah menggunakan [Vercel Platform](https://vercel.com/new). Jangan lupa menambahkan environment variables yang sama di dashboard Vercel sebelum deploy.
