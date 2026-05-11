"use server";

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

// Inisialisasi Supabase menggunakan Service Role Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * FUNGSI LOGIN
 * Memverifikasi username dan password dari tabel manual 'users'
 */
export async function login(username: string, password: string) {
  // 1. Cari user berdasarkan username di tabel 'users'
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !user) {
    throw new Error('Username atau password salah');
  }

  // 2. Verifikasi password menggunakan bcrypt
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new Error('Username atau password salah');
  }

  // 3. Simpan session ke cookie httpOnly — tidak bisa disentuh document.cookie di browser
  const cookieStore = await cookies();
  cookieStore.set('user_id', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 1 hari
    path: '/',
  });

  // 4. Redirect ke halaman utama
  redirect('/');
}

/**
 * FUNGSI LOGOUT
 * Wajib dijalankan dari server action — satu-satunya cara hapus cookie httpOnly.
 * Jangan pernah hapus cookie ini via document.cookie di client, tidak akan berhasil.
 */
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('user_id');
  redirect('/auth');
}

/**
 * FUNGSI ANALISIS INTERIOR
 * Mengirim gambar ke Gemini AI dan mencari produk di Supabase
 */
export async function analyzeInterior(formData: FormData) {
  try {
    const file = formData.get("image") as File;
    if (!file) throw new Error("File tidak ditemukan");

    // Validasi tipe file
    if (!file.type.startsWith("image/")) {
      throw new Error("File harus berupa gambar");
    }

    // Konversi ke base64
    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY tidak ditemukan di environment");

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `Analisis foto ruangan ini sebagai desainer interior profesional.
    Tentukan gaya desainnya dan berikan saran 2 jenis barang furnitur yang cocok ditambahkan.
    
    OUTPUT HARUS DALAM FORMAT JSON SEPERTI INI (TANPA TEKS LAIN, TANPA BACKTICKS):
    {
      "gaya": "Minimalis",
      "saran": "Berikan 1 kalimat saran profesional di sini",
      "cari_kategori": ["kursi", "meja"]
    }`;

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: file.type,
                data: base64Data,
              },
            },
          ],
        },
      ],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Kesalahan API Gemini");
    }

    // Ekstraksi dan parsing JSON dari respons AI
    const rawText: string = data.candidates[0].content.parts[0].text;
    const startJson = rawText.indexOf('{');
    const endJson = rawText.lastIndexOf('}') + 1;

    if (startJson === -1 || endJson === 0) {
      throw new Error("AI tidak mengembalikan format JSON yang valid");
    }

    const cleanJson = rawText.substring(startJson, endJson);
    const aiContent = JSON.parse(cleanJson);

    const keywords: string[] = aiContent.cari_kategori;
    if (!keywords || keywords.length < 2) {
      throw new Error("AI tidak memberikan kategori pencarian yang cukup");
    }

    // Cari produk di Supabase berdasarkan kata kunci dari AI
    const { data: products, error: dbError } = await supabase
      .from('produk_interior')
      .select('*')
      .or(`nama_barang.ilike.%${keywords[0]}%,nama_barang.ilike.%${keywords[1]}%`)
      .limit(6);

    if (dbError) throw dbError;

    return {
      success: true,
      analisis: aiContent.saran,
      gaya: aiContent.gaya,
      rekomendasiProduk: products || [],
    };

  } catch (error: any) {
    // FIX: redirect() di Next.js bekerja dengan melempar error khusus.
    // Jika tidak di-rethrow, redirect tidak akan berjalan.
    if (isRedirectError(error)) throw error;

    console.error("ERROR DETAIL:", error);
    return { success: false, error: `Sistem Error: ${error.message}` };
  }
}