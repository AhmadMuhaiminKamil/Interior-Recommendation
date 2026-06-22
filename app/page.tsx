"use client";
import React, { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useTexture, PerspectiveCamera, Html } from '@react-three/drei';
import { SparklesIcon, LayoutDashboardIcon, Trash2Icon, PlusIcon, LockIcon, UnlockIcon } from 'lucide-react';
import * as THREE from 'three';

// --- ANTARMUKA DATA ---
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

// --- TIPE FURNITUR ---
type FurniturType = 'sofa' | 'meja_kopi' | 'tanaman' | 'kursi' | 'lemari' | 'lampu';

interface FurniturItem {
  id: string;
  type: FurniturType;
  position: [number, number, number];
  label: string;
}

const FURNITUR_CATALOG: { type: FurniturType; label: string; emoji: string }[] = [
  { type: 'sofa',      label: 'Sofa',       emoji: '🛋️' },
  { type: 'meja_kopi', label: 'Meja Kopi',  emoji: '☕' },
  { type: 'tanaman',   label: 'Tanaman',    emoji: '🪴' },
  { type: 'kursi',     label: 'Kursi',      emoji: '🪑' },
  { type: 'lemari',    label: 'Lemari',     emoji: '🗄️' },
  { type: 'lampu',     label: 'Lampu',      emoji: '💡' },
];

// --- DATA SIMULASI PRODUK (FALLBACK) ---
const MOCK_PRODUCTS: Produk[] = [
  {
    id: "1",
    nama_barang: "Vinyl Oak Premium Natural",
    harga: 350000,
    link_gambar: "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=600&q=80",
    deskripsi: "Lantai vinyl berkualitas tinggi dengan serat kayu oak alami yang memberikan nuansa hangat, elegan, dan sangat cocok untuk gaya Japandi atau Minimalis Modern."
  },
  {
    id: "2",
    nama_barang: "Vinyl Dark Ash Wood",
    harga: 330000,
    link_gambar: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=600&q=80",
    deskripsi: "Serat kayu ash abu-abu gelap yang memberikan kesan maskulin, industrial, modern, serta sangat tahan terhadap goresan dan air."
  },
  {
    id: "3",
    nama_barang: "Teak Wood Parket Luxury",
    harga: 450000,
    link_gambar: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
    deskripsi: "Parket kayu jati mewah dengan perlindungan UV ekstra, menghadirkan estetika berkelas tinggi untuk ruang keluarga Anda."
  }
];

const DEFAULT_FURNITUR: FurniturItem[] = [
  { id: 'sofa-1',    type: 'sofa',      position: [0, 0, -1.5],  label: 'Sofa' },
  { id: 'meja-1',   type: 'meja_kopi', position: [0, 0, 0.8],   label: 'Meja Kopi' },
  { id: 'tanaman-1',type: 'tanaman',   position: [4, 0, -3],    label: 'Tanaman' },
];

// --- KOMPONEN MESH FURNITUR ---
function FurniturMesh({
  item,
  isSelected,
  isDragging,
  onSelect,
  onDragStart,
}: {
  item: FurniturItem;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string, e: ThreeEvent<PointerEvent>) => void;
}) {
  const highlight = isSelected ? '#a855f7' : undefined;

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSelect(item.id);
    onDragStart(item.id, e);
  };

  const meshProps = {
    castShadow: true,
    receiveShadow: true,
    onPointerDown: handlePointerDown,
  };

  const [px, py, pz] = item.position;

  const renderShape = () => {
    switch (item.type) {
      case 'sofa':
        return (
          <group position={[px, py + 0.4, pz]}>
            <mesh {...meshProps}>
              <boxGeometry args={[3.2, 0.55, 1.4]} />
              <meshStandardMaterial color={highlight || '#334155'} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.65, -0.6]} castShadow>
              <boxGeometry args={[3.2, 0.85, 0.25]} />
              <meshStandardMaterial color={highlight || '#334155'} roughness={0.8} />
            </mesh>
            <mesh position={[-1.55, 0.2, 0]} castShadow>
              <boxGeometry args={[0.2, 0.5, 1.4]} />
              <meshStandardMaterial color={highlight || '#1e293b'} roughness={0.8} />
            </mesh>
            <mesh position={[1.55, 0.2, 0]} castShadow>
              <boxGeometry args={[0.2, 0.5, 1.4]} />
              <meshStandardMaterial color={highlight || '#1e293b'} roughness={0.8} />
            </mesh>
            {isSelected && (
              <Html center position={[0, 1.4, 0]}>
                <div className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg pointer-events-none">
                  {item.label}
                </div>
              </Html>
            )}
          </group>
        );

      case 'meja_kopi':
        return (
          <group position={[px, py + 0.25, pz]}>
            <mesh {...meshProps}>
              <boxGeometry args={[2.0, 0.38, 1.0]} />
              <meshStandardMaterial color={highlight || '#a16207'} roughness={0.6} />
            </mesh>
            {[[-0.85,-0.4],[0.85,-0.4],[-0.85,0.4],[0.85,0.4]].map(([x,z],i)=>(
              <mesh key={i} position={[x as number, -0.22, z as number]} castShadow>
                <boxGeometry args={[0.08, 0.44, 0.08]} />
                <meshStandardMaterial color="#78350f" />
              </mesh>
            ))}
            {isSelected && (
              <Html center position={[0, 0.6, 0]}>
                <div className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg pointer-events-none">
                  {item.label}
                </div>
              </Html>
            )}
          </group>
        );

      case 'tanaman':
        return (
          <group position={[px, py + 0.4, pz]}>
            <mesh {...meshProps}>
              <cylinderGeometry args={[0.28, 0.2, 0.7, 16]} />
              <meshStandardMaterial color={highlight || '#78350f'} />
            </mesh>
            <mesh position={[0, 0.65, 0]} castShadow>
              <sphereGeometry args={[0.48, 16, 16]} />
              <meshStandardMaterial color={highlight || '#15803d'} roughness={0.9} />
            </mesh>
            {isSelected && (
              <Html center position={[0, 1.3, 0]}>
                <div className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg pointer-events-none">
                  {item.label}
                </div>
              </Html>
            )}
          </group>
        );

      case 'kursi':
        return (
          <group position={[px, py + 0.35, pz]}>
            <mesh {...meshProps}>
              <boxGeometry args={[0.85, 0.4, 0.85]} />
              <meshStandardMaterial color={highlight || '#4a5568'} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.5, -0.38]} castShadow>
              <boxGeometry args={[0.85, 0.65, 0.1]} />
              <meshStandardMaterial color={highlight || '#4a5568'} roughness={0.8} />
            </mesh>
            {isSelected && (
              <Html center position={[0, 1.2, 0]}>
                <div className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg pointer-events-none">
                  {item.label}
                </div>
              </Html>
            )}
          </group>
        );

      case 'lemari':
        return (
          <group position={[px, py + 1.0, pz]}>
            <mesh {...meshProps}>
              <boxGeometry args={[1.2, 2.0, 0.5]} />
              <meshStandardMaterial color={highlight || '#5c3d2e'} roughness={0.7} />
            </mesh>
            <mesh position={[0, 0, 0.26]}>
              <boxGeometry args={[1.1, 1.85, 0.02]} />
              <meshStandardMaterial color={highlight || '#7c5c40'} roughness={0.5} />
            </mesh>
            {isSelected && (
              <Html center position={[0, 1.2, 0]}>
                <div className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg pointer-events-none">
                  {item.label}
                </div>
              </Html>
            )}
          </group>
        );

      case 'lampu':
        return (
          <group position={[px, py, pz]}>
            <mesh {...meshProps} position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.2, 0.22, 0.08, 16]} />
              <meshStandardMaterial color={highlight || '#888'} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.85, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 1.5, 8]} />
              <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 1.65, 0]} castShadow>
              <cylinderGeometry args={[0.28, 0.18, 0.38, 16, 1, true]} />
              <meshStandardMaterial color="#f5e6c8" roughness={0.9} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 1.62, 0]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshStandardMaterial color="#ffe8a0" emissive="#ffcc44" emissiveIntensity={1.5} />
            </mesh>
            {isSelected && (
              <Html center position={[0, 2.1, 0]}>
                <div className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg pointer-events-none">
                  {item.label}
                </div>
              </Html>
            )}
          </group>
        );

      default:
        return null;
    }
  };

  return <>{renderShape()}</>;
}

// --- KOMPONEN SCENE 3D ---
function SceneMaket3D({
  textureUrl,
  tileScale,
  furniturList,
  selectedId,
  draggingId,
  onSelectFurnitur,
  onDragStartFurnitur,
  onMoveFurnitur,
  onStopDrag,
}: {
  textureUrl: string;
  tileScale: number;
  furniturList: FurniturItem[];
  selectedId: string | null;
  draggingId: string | null;
  onSelectFurnitur: (id: string) => void;
  onDragStartFurnitur: (id: string, e: ThreeEvent<PointerEvent>) => void;
  onMoveFurnitur: (id: string, pos: [number, number, number]) => void;
  onStopDrag: () => void;
}) {
  const lantaiTexture = useTexture(textureUrl);
  lantaiTexture.wrapS = lantaiTexture.wrapT = THREE.RepeatWrapping;
  lantaiTexture.repeat.set(tileScale, tileScale);
  lantaiTexture.generateMipmaps = true;
  lantaiTexture.minFilter = THREE.LinearMipmapLinearFilter;

  const { camera, gl } = useThree();
  const planeRef = useRef<THREE.Mesh>(null);
  const raycaster = useRef(new THREE.Raycaster());

  const handlePlaneMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!draggingId) return;
    e.stopPropagation();
    const intersect = e.intersections[0];
    if (intersect) {
      const { x, z } = intersect.point;
      const clampX = Math.max(-4.5, Math.min(4.5, x));
      const clampZ = Math.max(-3.8, Math.min(3.8, z));
      onMoveFurnitur(draggingId, [clampX, 0, clampZ]);
    }
  }, [draggingId, onMoveFurnitur]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow shadow-mapSize={[1024,1024]} />
      <pointLight position={[-4, 5, -2]} intensity={0.5} />

      <group position={[0, -1, 0]}>
        {/* LANTAI */}
        <mesh
          ref={planeRef}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
          onPointerMove={handlePlaneMove}
          onPointerUp={onStopDrag}
        >
          <planeGeometry args={[10, 8]} />
          <meshStandardMaterial map={lantaiTexture} roughness={0.4} metalness={0.1} />
        </mesh>

        {/* DINDING BELAKANG */}
        <mesh position={[0, 2.5, -4]} receiveShadow>
          <boxGeometry args={[10, 5, 0.2]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.9} />
        </mesh>

        {/* DINDING KIRI */}
        <mesh position={[-5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[8, 5, 0.2]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
        </mesh>

        {/* KARPET */}
        <mesh position={[0, 0.01, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.2, 2.0]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
        </mesh>

        {/* FURNITUR INTERAKTIF */}
        {furniturList.map((item) => (
          <FurniturMesh
            key={item.id}
            item={item}
            isSelected={selectedId === item.id}
            isDragging={draggingId === item.id}
            onSelect={onSelectFurnitur}
            onDragStart={onDragStartFurnitur}
          />
        ))}
      </group>

      <OrbitControls
        enablePan={!draggingId}
        enableRotate={!draggingId}
        enableZoom={true}
        minDistance={3}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </>
  );
}

// --- HALAMAN UTAMA ---
export default function App() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [userInput, setUserInput] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [data, setData] = useState<AnalisisResult | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Produk | null>(null);
  const [tileScale, setTileScale] = useState(3.0);
  const section3DRef = useRef<HTMLDivElement | null>(null);

  // State furnitur interaktif
  const [furniturList, setFurniturList] = useState<FurniturItem[]>(DEFAULT_FURNITUR);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const handleSelectFurnitur = useCallback((id: string) => {
    if (editMode) setSelectedId(prev => prev === id ? null : id);
  }, [editMode]);

  const handleDragStartFurnitur = useCallback((id: string, e: ThreeEvent<PointerEvent>) => {
    if (editMode) {
      e.stopPropagation();
      setDraggingId(id);
      setSelectedId(id);
    }
  }, [editMode]);

  const handleMoveFurnitur = useCallback((id: string, pos: [number, number, number]) => {
    setFurniturList(prev => prev.map(f => f.id === id ? { ...f, position: pos } : f));
  }, []);

  const handleStopDrag = useCallback(() => setDraggingId(null), []);

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    setFurniturList(prev => prev.filter(f => f.id !== selectedId));
    setSelectedId(null);
  };

  const handleAddFurnitur = (type: FurniturType, label: string) => {
    const newItem: FurniturItem = {
      id: `${type}-${Date.now()}`,
      type,
      position: [0, 0, 0],
      label,
    };
    setFurniturList(prev => [...prev, newItem]);
    setSelectedId(newItem.id);
  };

  const handleSelectProduct = (item: Produk) => {
    setSelectedProduct(item);
    setTimeout(() => {
      section3DRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    setSelectedProduct(null);
    setInputError(null);
    if (file) {
      setPreview(URL.createObjectURL(file));
      setData(null);
    } else {
      setPreview(null);
    }
  };

  const handleSearch = async () => {
    if (!image) return;
    setLoading(true);
    setData(null);
    setInputError(null);
    try {
      const { analyzeInterior } = await import('./actions');
      const formData = new FormData();
      formData.append("image", image);
      formData.append("userInput", userInput);
      const response = await analyzeInterior(formData);
      if (response.success) {
        setData(response);
      } else {
        if (response.error?.includes('tidak relevan')) {
          setInputError(response.error);
        } else {
          alert(response.error);
        }
      }
    } catch (e) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setData({
        success: true,
        gaya: "Japandi Modern",
        analisis: "Ruangan Anda memiliki potensi pencahayaan alami yang sangat baik. Kami merekomendasikan penggunaan lantai bertekstur kayu jati berwarna hangat guna menyeimbangkan dinding netral dan mempertegas kesan luas serta asri.",
        deskripsi_furnitur: "Saran vinyl lantai dengan serat kayu jati hangat.",
        rekomendasiProduk: MOCK_PRODUCTS
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { logout } = await import('./actions');
      await logout();
    } catch (e) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      alert("Berhasil keluar dari sesi pratinjau.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans text-slate-100">
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

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl shadow-2xl shadow-purple-900/20 mb-10 border border-slate-700/50">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-3">Interior AI</h1>
            <p className="text-slate-400 text-lg font-medium">Transformasi Ruangan dengan Simulasi Maket 3D</p>
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
                  <p className="text-slate-500 text-sm mt-2">AI akan menganalisis gaya interior ruangan Anda</p>
                </div>
              )}
              <div className="w-full flex justify-center">
                <input
                  type="file" accept="image/*" onChange={handleImageChange}
                  className="block w-auto text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-purple-600 file:to-pink-600 file:text-white hover:file:from-purple-500 hover:file:to-pink-500 cursor-pointer transition-all"
                />
              </div>
            </div>

            {/* Input Preferensi Pengguna */}
            <div style={{
              position: 'relative',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.05))',
              border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: '20px',
              padding: '1px',
            }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(15,15,30,0.95), rgba(20,10,35,0.95))',
                borderRadius: '19px',
                padding: '20px 24px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.3))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="url(#grad1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#a78bfa"/>
                          <stop offset="100%" stopColor="#f472b6"/>
                        </linearGradient>
                      </defs>
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                  </div>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    background: 'linear-gradient(90deg, #a78bfa, #f472b6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>Preferensi Ruangan</span>
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '11px',
                    color: 'rgba(148,163,184,0.5)',
                    fontStyle: 'italic',
                  }}>opsional</span>
                </div>
                <textarea
                  value={userInput}
                  onChange={(e) => { setUserInput(e.target.value); setInputError(null); }}
                  placeholder='Contoh: "Saya ingin ruangan ini menjadi nuansa Japandi yang hangat" atau "Warna lebih gelap dan natural"'
                  rows={3}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#e2e8f0',
                    fontSize: '14px',
                    lineHeight: '1.7',
                    resize: 'none',
                    fontFamily: 'inherit',
                    caretColor: '#a78bfa',
                  }}
                />
              </div>
            </div>

            {/* Error preferensi */}
            {inputError && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 18px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(236,72,153,0.05))',
                border: '1px solid rgba(239,68,68,0.25)',
                animation: 'fadeInUp 0.25s ease',
              }}>
                <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }`}</style>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                  background: 'rgba(239,68,68,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#f87171', marginBottom: '2px' }}>
                    Preferensi tidak valid
                  </p>
                  <p style={{ fontSize: '12px', color: 'rgba(252,165,165,0.7)', lineHeight: '1.5' }}>
                    {inputError.replace('Sistem Error: Preferensi tidak relevan dengan desain interior. ', '').replace('Preferensi tidak relevan dengan desain interior. ', '')}
                  </p>
                </div>
                <button
                  onClick={() => setInputError(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'rgba(239,68,68,0.5)', flexShrink: 0 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            )}

            <button
              onClick={handleSearch}
              disabled={!image || loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-purple-600/30 disabled:from-slate-700 disabled:to-slate-700 disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  Sedang Menganalisis Gaya Ruangan...
                </span>
              ) : "Analisis & Cari Furnitur"}
            </button>
          </div>
        </div>

        {/* Hasil */}
        {data && (
          <div className="space-y-10">
            <div className="bg-gradient-to-r from-slate-800 to-slate-800 border-l-4 border-purple-500 p-8 rounded-2xl shadow-xl shadow-purple-900/20 border-r border-b border-slate-700/50">
              <span className="inline-block bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-300 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-purple-500/30">
                Gaya Terdeteksi: {data.gaya || "Tidak Terdeteksi"}
              </span>
              <p className="text-xl font-medium mt-5 text-slate-200 leading-relaxed">
                "{data.analisis || "Tidak ada hasil analisis."}"
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center gap-2">
                <LayoutDashboardIcon className="w-5 h-5 text-purple-400" />
                Pilih Produk Lantai untuk Simulasi 3D:
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.rekomendasiProduk?.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectProduct(item)}
                    className={`text-left bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-slate-700/50 flex flex-col group transition-transform duration-200 ${selectedProduct?.id === item.id ? 'ring-2 ring-purple-500 shadow-[0_0_0_1px_rgba(168,85,247,0.25)] scale-[1.02]' : 'hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10'}`}
                  >
                    <div className="h-44 w-full overflow-hidden bg-slate-700/40 relative">
                      <img src={item.link_gambar} alt={item.nama_barang} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-5 flex-grow">
                      <h3 className="font-bold text-base mb-1 text-slate-100">{item.nama_barang}</h3>
                      <p className="text-slate-400 text-xs line-clamp-2">{item.deskripsi}</p>
                    </div>
                    <div className="p-5 pt-0 mt-auto">
                      <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                        <span className="text-purple-400 font-bold text-base">Rp {item.harga.toLocaleString('id-ID')}</span>
                        <span className="text-xs text-purple-300 bg-purple-500/10 px-2 py-1 rounded-md border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-all">Simulasikan 3D</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* VIEWER 3D */}
            {selectedProduct && (
              <div
                ref={section3DRef}
                className="mt-12 rounded-3xl border border-purple-500/30 bg-slate-950 p-6 shadow-2xl shadow-purple-950/50 space-y-6 scroll-mt-6"
              >
                {/* Header viewer */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                      <SparklesIcon className="w-6 h-6 text-purple-400 animate-pulse" />
                      Pratinjau Maket Interior 3D
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">Menggunakan tekstur: <span className="text-purple-300 font-semibold">{selectedProduct.nama_barang}</span></p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-500">Estimasi Harga / m²</p>
                    <p className="text-xl font-black text-purple-400">Rp {selectedProduct.harga.toLocaleString('id-ID')}</p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">

                  {/* CANVAS */}
                  <div className="relative h-[450px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-inner group">
                    <Canvas shadows>
                      <PerspectiveCamera makeDefault position={[5, 6, 7]} fov={50} />
                      <SceneMaket3D
                        textureUrl={selectedProduct.link_gambar}
                        tileScale={tileScale}
                        furniturList={furniturList}
                        selectedId={editMode ? selectedId : null}
                        draggingId={draggingId}
                        onSelectFurnitur={handleSelectFurnitur}
                        onDragStartFurnitur={handleDragStartFurnitur}
                        onMoveFurnitur={handleMoveFurnitur}
                        onStopDrag={handleStopDrag}
                      />
                    </Canvas>

                    {/* Mode badge */}
                    <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 pointer-events-none ${editMode ? 'bg-purple-600/90 text-white' : 'bg-slate-800/80 text-slate-400'}`}>
                      {editMode ? <UnlockIcon className="w-3 h-3" /> : <LockIcon className="w-3 h-3" />}
                      {editMode ? 'Mode Edit Aktif' : 'Mode Lihat'}
                    </div>

                    <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 pointer-events-none opacity-70 group-hover:opacity-100">
                      {editMode ? '🖱️ Klik furnitur lalu seret untuk pindahkan' : '🖱️ Kiri: Putar | Scroll: Zoom'}
                    </div>
                  </div>

                  {/* PANEL KONTROL */}
                  <div className="flex flex-col gap-4">

                    {/* Toggle edit mode */}
                    <button
                      onClick={() => { setEditMode(v => !v); setSelectedId(null); setDraggingId(null); }}
                      className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border ${editMode ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                    >
                      {editMode ? <><UnlockIcon className="w-4 h-4" /> Mode Edit ON</> : <><LockIcon className="w-4 h-4" /> Aktifkan Edit Furnitur</>}
                    </button>

                    {/* Aksi furnitur terpilih */}
                    {editMode && selectedId && (
                      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 flex items-center justify-between">
                        <span className="text-xs text-slate-300">
                          Terpilih: <span className="text-purple-300 font-semibold">{furniturList.find(f => f.id === selectedId)?.label}</span>
                        </span>
                        <button
                          onClick={handleDeleteSelected}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-all"
                        >
                          <Trash2Icon className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                      </div>
                    )}

                    {/* Tambah furnitur */}
                    {editMode && (
                      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <PlusIcon className="w-3.5 h-3.5 text-purple-400" />
                          Tambah Furnitur
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {FURNITUR_CATALOG.map(cat => (
                            <button
                              key={cat.type}
                              onClick={() => handleAddFurnitur(cat.type, cat.label)}
                              className="flex items-center gap-1.5 px-2 py-2 bg-slate-800 hover:bg-purple-900/40 border border-slate-700 hover:border-purple-500/50 rounded-lg text-xs text-slate-300 hover:text-white transition-all"
                            >
                              <span>{cat.emoji}</span>
                              <span>{cat.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Slider kepadatan */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                      <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Kepadatan Serat Lantai</h4>
                      <input
                        type="range" min="1.0" max="8.0" step="0.5"
                        value={tileScale}
                        onChange={(e) => setTileScale(parseFloat(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                        <span>Lebih Padat</span>
                        <span className="text-purple-300 font-bold">{tileScale.toFixed(1)}x</span>
                        <span>Lebih Renggang</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/30 p-4 rounded-2xl border border-slate-800/50 text-xs text-slate-500">
                      Pencahayaan ruangan mencakup Ambient, Directional (Matahari), dan Point Light untuk efek bayangan yang realistis pada tekstur kayu pilihan Anda.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}