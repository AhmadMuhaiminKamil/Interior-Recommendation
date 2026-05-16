"use client";
import { useState, ChangeEvent } from 'react';
import { analyzeInterior, logout, generateRoomVisualization } from './actions';

interface Produk {
  id: string;
  nama_barang: string;
  harga: number;
  link_gambar: string;
  deskripsi: string;
}

interface AnalisisResult {
  success: boolean;
  gaya?: string;
  analisis?: string;
  deskripsi_furnitur?: string;
  rekomendasiProduk?: Produk[];
  imageBase64?: string;
  imageMimeType?: string;
  error?: string;
}

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [data, setData] = useState<AnalisisResult | null>(null);
  const [visualisasi, setVisualisasi] = useState<string | null>(null);
  const [loadingVisualisasi, setLoadingVisualisasi] = useState(false);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
      setData(null);
      setVisualisasi(null);
    } else {
      setPreview(null);
    }
  };

  const handleSearch = async () => {
    if (!image) return;
    setLoading(true);
    setData(null);
    setVisualisasi(null);
    const formData = new FormData();
    formData.append("image", image);
    const response = await analyzeInterior(formData);
    if (response.success) {
      setData(response);
    } else {
      alert(response.error);
    }
    setLoading(false);
  };

  const handleVisualisasi = async () => {
    if (!data?.imageBase64 || !data?.rekomendasiProduk) return;
    setLoadingVisualisasi(true);
    const result = await generateRoomVisualization(
      data.imageBase64,
      data.imageMimeType || "image/jpeg",
      data.gaya || "Minimalis",
      data.deskripsi_furnitur || "",
      data.rekomendasiProduk
    );
    if (result.success && result.imageBase64) {
      setVisualisasi(`data:${result.mimeType};base64,${result.imageBase64}`);
    } else {
      alert(result.error);
    }
    setLoadingVisualisasi(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="max-w-4xl mx-auto">

        {/* Tombol Logout */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '12px',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.2), rgba(131, 24, 67, 0.2))',
              color: '#e9d5ff', fontSize: '14px', fontWeight: '600',
              cursor: loggingOut ? 'not-allowed' : 'pointer',
              opacity: loggingOut ? 0.5 : 1, transition: 'all 0.2s ease', outline: 'none',
            }}
          >
            {loggingOut ? (
              <>
                <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                <span>Keluar...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                </svg>
                <span>Logout</span>
              </>
            )}
          </button>
        </div>

        {/* Kontainer Utama */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl shadow-2xl shadow-purple-900/20 mb-10 border border-slate-700/50">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-3">Interior AI</h1>
            <p className="text-slate-400 text-lg">Transformasi Ruangan dengan Bantuan AI</p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-purple-500/40 p-8 rounded-2xl hover:border-purple-400/70 transition-all bg-gradient-to-b from-purple-900/10 to-transparent">
              {preview ? (
                <div className="relative w-full h-80 overflow-hidden rounded-2xl shadow-xl shadow-purple-900/30 mb-4 bg-slate-700/40 flex items-center justify-center border border-slate-700">
                  <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="text-center py-12 flex flex-col items-center">
                  <div className="text-6xl mb-4 opacity-80">🖼️</div>
                  <p className="text-slate-300 font-semibold text-lg">Pilih atau drop foto ruangan Anda</p>
                  <p className="text-slate-500 text-sm mt-2">Pastikan pencahayaan cukup baik</p>
                </div>
              )}
              <div className="w-full flex justify-center">
                <input
                  type="file" accept="image/*" onChange={handleImageChange}
                  className="block w-auto text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-purple-600 file:to-pink-600 file:text-white hover:file:from-purple-500 hover:file:to-pink-500 cursor-pointer transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={!image || loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-purple-600/30 disabled:from-slate-700 disabled:to-slate-700 disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  Sedang Menganalisis...
                </span>
              ) : "Analisis & Cari Furnitur"}
            </button>
          </div>
        </div>

        {/* Hasil Analisis */}
        {data && (
          <div className="space-y-10">
            <div className="bg-gradient-to-r from-slate-800 to-slate-800 border-l-4 border-purple-500 p-8 rounded-2xl shadow-xl shadow-purple-900/20 border-r border-b border-slate-700/50">
              <span className="inline-block bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-300 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-purple-500/30">
                Gaya: {data.gaya || "Tidak Terdeteksi"}
              </span>
              <p className="text-2xl font-semibold mt-5 text-slate-200 leading-relaxed">
                "{data.analisis || "Tidak ada hasil analisis."}"
              </p>
            </div>

            {/* Rekomendasi Produk */}
            <div>
              <h2 className="text-3xl font-bold mb-8 text-slate-100">Rekomendasi Produk Toko:</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.rekomendasiProduk?.map((item) => (
                  <div key={item.id} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-slate-700/50 flex flex-col group">
                    <div className="h-52 w-full overflow-hidden bg-slate-700/40 relative">
                      <img src={item.link_gambar} alt={item.nama_barang} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="p-5 flex-grow">
                      <h3 className="font-bold text-lg mb-2 text-slate-100">{item.nama_barang}</h3>
                      <p className="text-slate-400 text-sm line-clamp-2">{item.deskripsi}</p>
                    </div>
                    <div className="p-5 pt-0 mt-auto">
                      <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                        <span className="text-purple-400 font-bold text-xl">
                          Rp {item.harga.toLocaleString('id-ID')}
                        </span>
                        <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all">
                          Beli
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tombol Visualisasi */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700/50">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-100 mb-2">✨ Visualisasikan Ruangan Anda</h2>
                <p className="text-slate-400 text-sm">Lihat tampilan ruangan Anda setelah didekorasi dengan furnitur rekomendasi AI</p>
              </div>

              <button
                onClick={handleVisualisasi}
                disabled={loadingVisualisasi}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-violet-600/30 disabled:from-slate-700 disabled:to-slate-700 disabled:shadow-none"
              >
                {loadingVisualisasi ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    Sedang Membuat Visualisasi... (30-60 detik)
                  </span>
                ) : "🏠 Generate Visualisasi Ruangan"}
              </button>

              {/* Hasil Visualisasi */}
              {visualisasi && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-100">Hasil Visualisasi:</h3>
                    <a
                      href={visualisasi}
                      download="visualisasi-ruangan.png"
                      className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                    >
                      ⬇️ Download
                    </a>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl shadow-purple-900/30">
                    <img src={visualisasi} alt="Visualisasi Ruangan" className="w-full object-contain" />
                  </div>
                  <p className="text-slate-500 text-xs text-center mt-3">
                    * Hasil visualisasi adalah ilustrasi AI, bukan foto nyata
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}