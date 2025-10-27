import { useNavigate } from "react-router-dom";

export default function AboutPage() {
  const navigate = useNavigate();
  const MAX_CHARS = 5000;
  const handleClick = () => {
    console.log("Pindah ke halaman koreksi...");
    navigate("/koreksi-teks"); // berpindah ke route
  };

  return (
    <>
        {/* ABOUT / HOMEPAGE */}
        <section
            id="about"
            className="scroll-mt-24 min-h-[85vh] flex flex-col items-center px-6 md:px-20 pt-10 pb-16 bg-gradient-to-b from-green-100 to-green-10"
        >
            <div className="text-center mb-10">
            <h1 className="text-6xl md:text-7xl font-extrabold text-cyan-700 tracking-wide drop-shadow-sm">
                KORELU
            </h1>
            <h2 className="text-xl md:text-2xl text-gray-700 font-semibold mt-1">
                (Koreksi Ejaan Pemilu)
            </h2>
            </div>

            {/* 2 KOL0M: Biodata & Info Sistem */}
            <div className="grid md:grid-cols-2 gap-10 w-full max-w-8xl">

            {/* ABOUT */}
            <div className="flex flex-col gap-10">
                {/* Tentang Sistem */}
                <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-md">
                <h2 className="text-xl font-bold text-cyan-700 mb-2">
                    Tentang Sistem
                </h2>
                <p className="text-gray-700 text-sm leading-relaxed">
                    Sistem ini berfokus pada koreksi ejaan teks bertema{" "}
                    <span className="font-semibold">
                    Pemilihan Umum (Pemilu)
                    </span>{" "}
                    agar istilah politik dan pemilu tetap akurat sesuai konteks.
                    <br />
                    <br />
                    Sistem bekerja dalam tiga tahap:
                    <br />
                    <span className="font-semibold">1. Kandidat:</span> SymSpell
                    mencari kandidat koreksi. <br />
                    <span className="font-semibold">2. Peringkat:</span> Jaro-Winkler
                    memberi skor kemiripan (0–1; makin dekat 1 makin mirip).
                    <br />
                    <span className="font-semibold">3. Finalisasi:</span> IndoBERT
                    (PLL) memilih kandidat paling sesuai konteks (dipilih jika
                    lebih tinggi ≥ 0,005 dari kata asli).
                </p>
                </div>

                {/* Biodata + tombol mulai */}
                <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
                    <p className="text-gray-700 mb-4 leading-relaxed font-medium">
                        Aplikasi ini merupakan bagian dari <strong>Program Skripsi</strong>{" "}
                        yang dibuat oleh:
                    </p>
                    <div className="text-left text-gray-700 mb-6 bg-gray-50 p-5 rounded-xl border border-gray-200/50">
                        <table className="w-full text-sm">
                        <tbody>
                            <tr>
                            <td className="font-semibold w-1/3 align-top py-1">Nama</td>
                            <td className="py-1">: Saskia Lavinsky</td>
                            </tr>
                            <tr>
                            <td className="font-semibold py-1">NIM</td>
                            <td className="py-1">: 535220176</td>
                            </tr>
                            <tr>
                            <td className="font-semibold py-1">Program Studi</td>
                            <td className="py-1">: Teknik Informatika</td>
                            </tr>
                            <tr>
                            <td className="font-semibold py-1">Fakultas</td>
                            <td className="py-1">: Teknologi Informasi</td>
                            </tr>
                            <tr>
                            <td className="font-semibold py-1">Universitas</td>
                            <td className="py-1">: Tarumanagara</td>
                            </tr>
                            <tr>
                            <td className="font-semibold align-top py-1">Judul Skripsi</td>
                            <td className="py-1">
                                : Koreksi Ejaan Bahasa Indonesia Dengan Kombinasi Symspell, Jaro-Winkler, Dan Indobert
                            </td>
                            </tr>
                            <tr>
                            <td className="font-semibold py-1">Dosen Pembimbing Utama</td>
                            <td className="py-1">
                                : Viny Christanti Mawardi, S.Kom., M.Kom.
                            </td>
                            </tr>
                            <tr>
                            <td className="font-semibold py-1">
                                Dosen Pembimbing Pendamping
                            </td>
                            <td className="py-1">
                                : Irvan Lewenusa, S.Kom., M.Kom.
                            </td>
                            </tr>
                        </tbody>
                        </table>
                    </div>

                    <button
                        onClick={handleClick}
                        className="bg-cyan-600 text-white px-4 py-2 rounded"
                        >
                        Mulai Koreksi Teks
                    </button>
                </div>
            </div>

            {/* KANAN */}
            <div className="grid grid-cols-1 gap-10">
                {/* Penjelasan Highlight */}
                <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-md">
                <h2 className="text-xl font-bold text-cyan-700 mb-3">
                    Penjelasan Highlight
                </h2>
                <ul className="list-none text-sm space-y-2">
                    <li>
                    <span className="px-1 py-0.5 rounded bg-blue-100 text-gray-500">
                        {" "}
                        Biru
                    </span>{" "}
                    kata dari <strong>Kamus Singkatan</strong>.
                    </li>
                    <li>
                    <span className="px-1 py-0.5 rounded bg-pink-100 text-gray-500">
                        {" "}
                        Pink
                    </span>{" "}
                    hasil dari <strong>Kamus Pemilu</strong>.
                    </li>
                    <li>
                    <span className="px-1 py-0.5 rounded bg-yellow-100 text-gray-500">
                        {" "}
                        Kuning
                    </span>{" "}
                    hasil dari <strong>Kamus KBBI</strong>.
                    </li>
                </ul>
                <p className="text-gray-600 text-xs mt-4 italic border-t pt-2">
                    Warna highlight membantu memahami asal koreksi & tingkat
                    keyakinan sistem.
                </p>
                </div>

                {/* Kamus & Sumber Data */}
                <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-md">
                <h2 className="text-xl font-bold text-cyan-700 mb-3">
                    Kamus & Sumber Data
                </h2>
                <ul className="list-disc list-inside text-sm space-y-3 text-gray-700">
                    <li>
                    <strong>Kamus KBBI</strong> — kata baku:{" "}
                    <a
                        href="https://github.com/damzaky/kumpulan-kata-bahasa-indonesia"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-700 hover:underline"
                    >
                        github.com/damzaky/kumpulan-kata-bahasa-indonesia
                    </a>
                    </li>
                    <li>
                    <strong>Kamus Singkatan</strong> — singkatan umum:{" "}
                    <a
                        href="https://huggingface.co/datasets/nahiar/indonesia-slang"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-700 hover:underline"
                    >
                        hf/datasets/nahiar/indonesia-slang
                    </a>
                    </li>
                    <li>
                    <strong>Kamus Pemilu</strong> — istilah dari berita Pemilu
                    2024:{" "}
                    <a
                        href="https://huggingface.co/datasets/emkr-13/berita_pemilu_2024"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-700 hover:underline"
                    >
                        hf/datasets/emkr-13/berita_pemilu_2024
                    </a>
                    </li>
                </ul>
                </div>

                {/* Batasan Sistem */}
                <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-md">
                <h2 className="text-xl font-bold text-cyan-700 mb-3">
                    Batasan Sistem
                </h2>
                <ul className="list-disc list-inside text-sm space-y-2 text-gray-700">
                    <li>Difokuskan pada teks berita bertema Pemilu.</li>
                    <li>Memperbaiki typo (bukan tata bahasa).</li>
                    <li>
                    Input teks/dokumen .docx/.pdf, panjang maksimal {MAX_CHARS}{" "}
                    karakter per proses.
                    </li>
                    <li>
                    Kapital di awal kalimat / setelah tanda baca (. , ! ?).
                    </li>
                    <li>
                    Tidak mengenali entitas baru di luar kamus (nama orang/lembaga/daerah).
                    </li>
                    <li>
                    Kandidat koreksi berdasarkan SymSpell + Jaro-Winkler +
                    IndoBERT (PLL).
                    </li>
                    <li>
                    Belum mendeteksi typo “tanpa spasi” antar kata (mis.{" "}
                    <em>anggotapolitik</em>).
                    </li>
                </ul>
                </div>
            </div>
            </div>
        </section>
    </>
  );
}
