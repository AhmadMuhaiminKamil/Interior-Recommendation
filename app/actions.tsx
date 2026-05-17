"use server";

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function login(username: string, password: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !user) throw new Error('Username atau password salah');

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) throw new Error('Username atau password salah');

  const cookieStore = await cookies();
  cookieStore.set('user_id', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/',
  });

  redirect('/');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('user_id');
  redirect('/auth');
}

export async function analyzeInterior(formData: FormData) {
  try {
    const file = formData.get("image") as File;
    if (!file) throw new Error("File tidak ditemukan");
    if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar");

    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY tidak ditemukan");

    // STEP 1: Analisis gambar
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `Analisis foto ruangan ini sebagai desainer interior profesional.
    Tentukan gaya desainnya dan deskripsikan material finishing yang cocok ditambahkan,
    seperti wall panel dan vinyl lantai.
    
    OUTPUT HARUS DALAM FORMAT JSON SEPERTI INI (TANPA TEKS LAIN, TANPA BACKTICKS):
    {
      "gaya": "Minimalis",
      "saran": "Berikan 1 kalimat saran profesional di sini",
      "deskripsi_produk": "Deskripsikan wall panel dan vinyl lantai yang ideal untuk ruangan ini secara detail, termasuk gaya, warna, tekstur, material, dan nuansa yang cocok"
    }`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: file.type, data: base64Data } }] }],
      }),
    });

    const geminiData = await geminiResponse.json();
    if (!geminiResponse.ok) throw new Error(geminiData.error?.message || "Kesalahan API Gemini");

    const rawText: string = geminiData.candidates[0].content.parts[0].text;
    const startJson = rawText.indexOf('{');
    const endJson = rawText.lastIndexOf('}') + 1;
    if (startJson === -1 || endJson === 0) throw new Error("AI tidak mengembalikan format JSON yang valid");

    const aiContent = JSON.parse(rawText.substring(startJson, endJson));
    if (!aiContent.deskripsi_produk) throw new Error("AI tidak memberikan deskripsi produk");

    // STEP 2: Buat embedding
    const embeddingUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`;
    const embeddingResponse = await fetch(embeddingUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-2",
        content: { parts: [{ text: aiContent.deskripsi_produk }] },
        outputDimensionality: 768,
      }),
    });

    const embeddingData = await embeddingResponse.json();
    if (!embeddingResponse.ok) throw new Error(embeddingData.error?.message || "Kesalahan Embedding API");

    const queryEmbedding: number[] = embeddingData.embedding.values;

    // STEP 3: Vector search
    const { data: products, error: dbError } = await supabase.rpc('search_furnitur', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 6,
    });

    if (dbError) throw dbError;

    return {
      success: true,
      analisis: aiContent.saran,
      gaya: aiContent.gaya,
      deskripsi_produk: aiContent.deskripsi_produk,
      rekomendasiProduk: products || [],
      imageBase64: base64Data,
      imageMimeType: file.type,
    };

  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error("ERROR DETAIL:", error);
    return { success: false, error: `Sistem Error: ${error.message}` };
  }
}