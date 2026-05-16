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
    Tentukan gaya desainnya dan deskripsikan furnitur yang cocok ditambahkan.
    
    OUTPUT HARUS DALAM FORMAT JSON SEPERTI INI (TANPA TEKS LAIN, TANPA BACKTICKS):
    {
      "gaya": "Minimalis",
      "saran": "Berikan 1 kalimat saran profesional di sini",
      "deskripsi_furnitur": "Deskripsikan furnitur ideal untuk ruangan ini secara detail, termasuk gaya, warna, material, dan nuansa yang cocok"
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
    if (!aiContent.deskripsi_furnitur) throw new Error("AI tidak memberikan deskripsi furnitur");

    // STEP 2: Buat embedding
    const embeddingUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`;
    const embeddingResponse = await fetch(embeddingUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-2",
        content: { parts: [{ text: aiContent.deskripsi_furnitur }] },
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
      deskripsi_furnitur: aiContent.deskripsi_furnitur,
      rekomendasiProduk: products || [],
      // Kembalikan base64 untuk dipakai visualisasi nanti
      imageBase64: base64Data,
      imageMimeType: file.type,
    };

  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error("ERROR DETAIL:", error);
    return { success: false, error: `Sistem Error: ${error.message}` };
  }
}

export async function generateRoomVisualization(
  imageBase64: string,
  imageMimeType: string,
  gaya: string,
  deskripsi_furnitur: string,
  rekomendasiProduk: { nama_barang: string }[]
) {
  try {
    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) throw new Error("HF_TOKEN tidak ditemukan");

    const produkList = rekomendasiProduk.map(p => `- ${p.nama_barang}`).join('\n');

    const prompt = `Interior room, ${gaya} style. ${deskripsi_furnitur}. 
    Furniture includes: ${produkList}. 
    Professional interior photography, natural lighting, realistic, high quality, 4k.`;

    const response = await fetch(
  "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${hfToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: prompt }),
  }
);

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Kesalahan Hugging Face API");
    }

    // Response berupa binary image
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return {
      success: true,
      imageBase64: base64,
      mimeType: "image/jpeg",
    };

  } catch (error: any) {
    console.error("ERROR VISUALISASI:", error);
    return { success: false, error: `Gagal generate visualisasi: ${error.message}` };
  }
}