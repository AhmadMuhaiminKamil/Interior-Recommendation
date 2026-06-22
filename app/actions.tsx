"use server";

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper: fetch ke Gemini dengan retry otomatis saat model sedang overload/high demand
async function fetchGeminiWithRetry(
  url: string,
  body: object,
  maxRetries = 2,
): Promise<any> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok) return data;

    const message: string = data.error?.message || "";
    const isOverloaded =
      response.status === 503 ||
      /overload|high demand|unavailable/i.test(message);

    lastError = new Error(message || "Kesalahan API Gemini");

    if (!isOverloaded || attempt === maxRetries) {
      throw lastError;
    }

    // Tunggu sebentar sebelum mencoba lagi (exponential backoff sederhana)
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
  }

  throw lastError;
}

export async function login(username: string, password: string) {
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !user) throw new Error("Username atau password salah");

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) throw new Error("Username atau password salah");

  const cookieStore = await cookies();
  cookieStore.set("user_id", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("user_id");
  redirect("/auth");
}

export async function analyzeInterior(formData: FormData) {
  try {
    const file = formData.get("image") as File;
    if (!file) throw new Error("File tidak ditemukan");
    if (!file.type.startsWith("image/"))
      throw new Error("File harus berupa gambar");

    const userInput =
      (formData.get("userInput") as string | null)?.trim() || "";

    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY tidak ditemukan");

    // STEP 1: Analisis gambar
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const preferensiBlock = userInput
      ? `\nPREFERENSI TAMBAHAN DARI PENGGUNA: "${userInput}"\nPertimbangkan preferensi ini SELAMA relevan dengan desain interior/lantai ruangan. Jika preferensi TIDAK ADA HUBUNGANNYA dengan desain interior atau lantai ruangan, set field "relevan" menjadi false dan jelaskan alasannya secara singkat di "alasan_tidak_relevan". Jika preferensi relevan, set "relevan" menjadi true.`
      : "";

    const prompt = `Analisis foto ruangan ini sebagai desainer interior profesional.
Fokus pada rekomendasi LANTAI yang cocok untuk ruangan ini.
${preferensiBlock}

OUTPUT HARUS DALAM FORMAT JSON SEPERTI INI (TANPA TEKS LAIN, TANPA BACKTICKS):
{
  "relevan": true,
  "alasan_tidak_relevan": "",
  "gaya": "Minimalis",
  "saran": "Berikan 1 kalimat saran profesional tentang lantai yang cocok",
  "deskripsi_furnitur": "Deskripsikan lantai vinyl ideal untuk ruangan ini: warna, motif kayu, nuansa (terang/gelap), tekstur, dan karakter visual yang cocok dengan gaya ruangan${userInput ? ", dengan mempertimbangkan preferensi pengguna di atas jika relevan" : ""}"
}`;

    const geminiData = await fetchGeminiWithRetry(geminiUrl, {
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: file.type, data: base64Data } },
          ],
        },
      ],
    });

    const rawText: string = geminiData.candidates[0].content.parts[0].text;
    const startJson = rawText.indexOf("{");
    const endJson = rawText.lastIndexOf("}") + 1;
    if (startJson === -1 || endJson === 0)
      throw new Error("AI tidak mengembalikan format JSON yang valid");

    const aiContent = JSON.parse(rawText.substring(startJson, endJson));

    if (userInput && aiContent.relevan === false) {
      throw new Error(
        `Preferensi tidak relevan dengan desain interior. ${aiContent.alasan_tidak_relevan || "Coba tulis preferensi yang berkaitan dengan gaya atau warna ruangan."}`,
      );
    }

    if (!aiContent.deskripsi_furnitur)
      throw new Error("AI tidak memberikan deskripsi furnitur");

    // STEP 2: Buat embedding
    const embeddingUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`;
    const embeddingData = await fetchGeminiWithRetry(embeddingUrl, {
      model: "models/gemini-embedding-2",
      content: { parts: [{ text: aiContent.deskripsi_furnitur }] },
      outputDimensionality: 768,
    });

    const queryEmbedding: number[] = embeddingData.embedding.values;

    // STEP 3: Vector search
    const { data: products, error: dbError } = await supabase.rpc(
      "search_furnitur",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 6,
      },
    );

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