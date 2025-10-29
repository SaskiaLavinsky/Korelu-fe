import { useRef, useState, useMemo } from "react";

export default function DocCorrectionPage() {
  // ✅ GUNAKAN DOMAIN SPACE YANG BENAR
  const API_BASE = "https://slavinskiaa-korelu-backend.hf.space";
  console.log("API_BASE in bundle =", API_BASE);

  const [docFile, setDocFile] = useState(null);
  const [docIsLoading, setDocIsLoading] = useState(false);
  const [docCandidates, setDocCandidates] = useState({});
  const [docDownloadId, setDocDownloadId] = useState(null);
  const [docDownloadName, setDocDownloadName] = useState("");
  const [docDownloadMime, setDocDownloadMime] = useState("");
  const [docProcessTimeMs, setDocProcessTimeMs] = useState(null);

  // PREVIEW dari backend
  const [previewTokens, setPreviewTokens] = useState([]);
  const [previewIdxSingkatan, setPreviewIdxSingkatan] = useState([]);
  const [previewIdxPolitik, setPreviewIdxPolitik] = useState([]);
  const [previewIdxTypo, setPreviewIdxTypo] = useState([]);
  const [previewText, setPreviewText] = useState(""); // Hasil akhir plain

  const fileInputRef = useRef(null);

  // Box & textarea class — disamakan dengan halaman teks
  const BOX =
    "p-4 border border-green-300 bg-green-50 rounded-lg text-gray-800 " +
    "min-h-[60px] break-words overflow-x-auto select-none ";
  const TA =
    "w-full bg-green-50 border border-green-300 rounded-lg p-4 text-gray-800 " +
    "min-h-[60px] break-words overflow-x-auto resize-none focus:outline-none ";

  const handlePickFileClick = () => {
    fileInputRef.current?.click();
  };

  const resetState = () => {
    setDocFile(null);
    setDocCandidates({});
    setDocDownloadId(null);
    setDocDownloadName("");
    setDocDownloadMime("");
    setDocProcessTimeMs(null);
    setPreviewTokens([]);
    setPreviewIdxSingkatan([]);
    setPreviewIdxPolitik([]);
    setPreviewIdxTypo([]);
    setPreviewText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDocFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setDocFile(f);
    setDocCandidates({});
    setDocDownloadId(null);
    setDocDownloadName("");
    setDocDownloadMime("");
    setDocProcessTimeMs(null);
    setPreviewTokens([]);
    setPreviewIdxSingkatan([]);
    setPreviewIdxPolitik([]);
    setPreviewIdxTypo([]);
    setPreviewText("");
  };

  const handleDocCorrection = async () => {
    if (!docFile) return alert("Pilih file .docx atau .pdf terlebih dahulu.");

    setDocIsLoading(true);
    setDocCandidates({});
    setDocDownloadId(null);
    setDocDownloadName("");
    setDocDownloadMime("");
    setDocProcessTimeMs(null);
    setPreviewTokens([]);
    setPreviewIdxSingkatan([]);
    setPreviewIdxPolitik([]);
    setPreviewIdxTypo([]);
    setPreviewText("");

    try {
      const fd = new FormData();
      fd.append("file", docFile);

      const start = performance.now();
      const res = await fetch(`${API_BASE}/koreksi-doc`, {
        method: "POST",
        body: fd,
      });
      const elapsed = performance.now() - start;

      // Cegah crash saat server kirim HTML error
      const rawText = await res.text();
      let data = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        // bukan JSON (mungkin HTML error page)
      }

      setDocProcessTimeMs(elapsed);

      if (!res.ok || (data && data.error)) {
        const msg =
          (data && data.error) ||
          `Server error (${res.status})` ||
          "Terjadi kesalahan saat memproses dokumen.";
        throw new Error(msg);
      }

      if (!data) throw new Error("Response kosong dari server.");

      // Kandidat + info unduhan (terima banyak nama key)
      setDocCandidates(data.candidates || data.symspell_candidates || {});
      setDocDownloadId(data.file_id);
      setDocDownloadName(data.filename || "hasil_koreksi");
      setDocDownloadMime(data.mime || "");

      // PREVIEW (tokens + index highlight + teks final)
      const p = data.preview || {};
      const toks = Array.isArray(p.tokens)
        ? p.tokens
        : typeof p.tokens === "string"
        ? p.tokens.split(/\s+/)
        : [];
      setPreviewTokens(toks);
      setPreviewIdxSingkatan(Array.isArray(p.idx_singkatan) ? p.idx_singkatan : []);
      setPreviewIdxPolitik(
        Array.isArray(p.idx_politik_fix)
          ? p.idx_politik_fix
          : Array.isArray(p.idx_politik)
          ? p.idx_politik
          : []
      );
      setPreviewIdxTypo(Array.isArray(p.idx_typo_fix) ? p.idx_typo_fix : []);
      setPreviewText(typeof p.teks === "string" ? p.teks : "");

      const hasCandidates =
        (data.candidates && Object.keys(data.candidates).length > 0) ||
        (data.symspell_candidates && Object.keys(data.symspell_candidates).length > 0);

      if (!hasCandidates) {
        const teksForCandidates =
          (typeof p.teks === "string" && p.teks.trim()) ||
          (Array.isArray(p.tokens) ? p.tokens.join(" ") : "");
        if (teksForCandidates) {
          // Tampilkan mini-loading khusus kandidat
          setDocIsLoading(true);
          try {
            const res2 = await fetch(`${API_BASE}/koreksi`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ kalimat: teksForCandidates.slice(0, 2000) }),
            });
            const raw2 = await res2.text();
            let data2 = null;
            try {
              data2 = raw2 ? JSON.parse(raw2) : null;
            } catch {}
            if (res2.ok && data2) {
              setDocCandidates(
                data2.candidates || data2.symspell_candidates || {}
              );
            }
          } catch (e) {
            console.error("Fallback kandidat gagal:", e);
          } finally {
            setDocIsLoading(false);
          }
        }
      }
    } catch (e) {
      console.error(e);
      alert(e?.message || "Terjadi kesalahan saat memproses dokumen.");
    } finally {
      setDocIsLoading(false);
    }
  };

  const handleDownloadDocResult = async () => {
    if (!docDownloadId) return;
    try {
      const res = await fetch(`${API_BASE}/download-doc/${docDownloadId}`);
      if (!res.ok) return alert("Gagal mengunduh file.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = docDownloadName || "hasil_koreksi";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Gagal mengunduh file.");
    }
  };

  const disableClear =
    !(docFile || docDownloadId || Object.keys(docCandidates).length > 0 || previewTokens.length > 0 || previewText) ||
    docIsLoading;

  const renderTokensWithHighlight = (tokens, biru, pink, kuning) => {
    const B = new Set(biru || []);
    const P = new Set(pink || []);
    const K = new Set(kuning || []);
    const safe = Array.isArray(tokens)
      ? tokens
      : typeof tokens === "string"
      ? tokens.split(/\s+/)
      : [];
    return safe.map((t, i) => {
      const cls = B.has(i)
        ? "bg-blue-100 rounded px-1"
        : P.has(i)
        ? "bg-pink-100 rounded px-1"
        : K.has(i)
        ? "bg-yellow-100 rounded px-1"
        : "";
      return (
        <span key={`tok-${i}`} className={cls}>
          {t}
          {i < safe.length - 1 ? " " : ""}
        </span>
      );
    });
  };

  const handleCopyFinal = () => {
    if (!previewText || docIsLoading) return;
    navigator.clipboard.writeText(previewText);
  };

  const candidatesText = useMemo(() => {
    if (!docCandidates || Object.keys(docCandidates).length === 0) return "";
    const lines = [];
    for (const [asal, kandidat] of Object.entries(docCandidates)) {
      if (Array.isArray(kandidat) && kandidat.length > 0) {
        const parts = kandidat.map(([term, jw, pll]) => {
          const jwNum = Number(jw);
          const pllNum = Number(pll);
          const jwStr = Number.isFinite(jwNum) ? jwNum.toFixed(2) : "-";
          const pllStr = Number.isFinite(pllNum) ? pllNum.toFixed(3) : "-";
          return `${term} (JW ${jwStr}, PLL ${pllStr})`;
        });
        lines.push(`${asal}: ${parts.join(", ")}`);
      } else {
        lines.push(`${asal}: (tidak ada kandidat)`);
      }
    }
    return lines.join("\n");
  }, [docCandidates]);

  // Helper format waktu
  const formatProcTime = (ms) => {
    if (ms == null) return "";
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <section id="doc-correction" className="scroll-mt-24 px-6 md:px-10 py-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📄 Koreksi Dokumen (.docx / .pdf)</h2>
      </div>

      <div className="bg-white shadow-md rounded-xl p-6">
        <p className="text-xs text-gray-500 mb-2">
          Sistem memproses maksimal 5.000 karakter pertama. Jangan tutup atau ubah halaman saat proses berlangsung
          agar file tetap tersimpan.
        </p>

        {/* ===== Baris 1: Pilih file -> Nama file -> Hapus ===== */}
        <div className="flex flex-wrap items-center gap-3 mb-2">
          {/* input file tersembunyi */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleDocFileChange}
            className="hidden"
          />

          {/* Pilih File */}
          <button
            type="button"
            onClick={handlePickFileClick}
            disabled={docIsLoading}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              docIsLoading
                ? "bg-blue-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium"
            }`}
            aria-label="Pilih file dokumen .docx atau .pdf"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM13 3.5L18.5 9H13V3.5z" />
            </svg>
            Pilih File (.docx / .pdf)
          </button>

          {/* Nama file (jika ada) */}
          {docFile && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-sm text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
              </svg>
              {docFile.name}
            </span>
          )}

          {/* Hapus */}
          <button
            onClick={resetState}
            disabled={disableClear}
            className={`${
              disableClear ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
            } text-white px-6 py-2 rounded-lg transition`}
            title="Hapus pilihan file & hasil"
          >
            Hapus
          </button>
        </div>

        {/* ===== Baris 2: Tombol proses + (Timer & Legend di sebelahnya) ===== */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {/* Tombol proses */}
          <button
            onClick={handleDocCorrection}
            disabled={docIsLoading || !docFile}
            className={`inline-flex items-center gap-2 text-white px-6 py-2 rounded-lg transition ${
              docIsLoading || !docFile ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
            aria-busy={docIsLoading ? "true" : "false"}
          >
            {docIsLoading && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" />
              </svg>
            )}
            <span>{docIsLoading ? "Memproses…" : "Periksa Ejaan & Buat Dokumen"}</span>
          </button>

          {/* Timer + Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
            {(!docIsLoading && docProcessTimeMs !== null) && (
              <span role="status" aria-live="polite">
                ⏱️ Waktu proses: <span className="font-semibold">{formatProcTime(docProcessTimeMs)}</span>
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-100">Singkatan</span>
              <span className="px-2 py-0.5 rounded bg-pink-100">Perbaikan Kamus Politik</span>
              <span className="px-2 py-0.5 rounded bg-yellow-100">Perbaikan Typo umum</span>
            </div>
          </div>
        </div>

        {/* ===== Hasil Koreksi (token ber-highlight) ===== */}
        <div className="mt-3">
          <h4 className="font-semibold text-gray-700 mb-2">Hasil Koreksi:</h4>
          <div className={BOX}>
            {docIsLoading ? (
              <p className="text-gray-500">Sedang memproses koreksi. Mohon tunggu...</p>
            ) : previewTokens.length ? (
              renderTokensWithHighlight(previewTokens, previewIdxSingkatan, previewIdxPolitik, previewIdxTypo)
            ) : (
              <span className="text-gray-500">Belum ada hasil...</span>
            )}
          </div>

          {/* ===== Hasil Akhir (plain + Salin) ===== */}
          <div className="flex items-center justify-between mt-4">
            <h4 className="font-semibold text-gray-700">Hasil Akhir:</h4>
            <button
              onClick={handleCopyFinal}
              disabled={!previewText || docIsLoading}
              className={`flex items-center gap-2 text-sm px-2 py-1 rounded transition ${
                previewText && !docIsLoading ? "text-gray-600 hover:text-blue-600" : "text-gray-400 cursor-not-allowed"
              }`}
              title="Salin Teks"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1z" />
                <path d="M20 5H8c-1.1 0-2 .9-2 2v14h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h12v14z" />
              </svg>
              <span className="hidden sm:inline">Salin</span>
            </button>
          </div>

        <textarea
            readOnly
            value={docIsLoading ? "Sedang memproses hasil akhir. Mohon tunggu..." : (previewText || "")}
            placeholder="Hasil akhir akan muncul di sini…"
            className={`mt-2 ${TA}`}
          />
        </div>

        {/* ===== Kandidat (JW → PLL) ===== */}
        <h4 className="font-semibold text-gray-700 mt-6 mb-2">Kandidat (JW → PLL):</h4>
        <textarea
          readOnly
          value={docIsLoading ? "Sedang memproses dan menghitung kandidat..." : candidatesText}
          placeholder="Tidak ada Kandidat"
          className={`mt-2 ${TA}`}
        />

        {/* ===== Unduhan ===== */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleDownloadDocResult}
            disabled={!docDownloadId}
            className={`${
              !docDownloadId ? "bg-green-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            } text-white px-6 py-2 rounded-lg transition`}
          >
            {docDownloadName ? `Download: ${docDownloadName}` : "Download Hasil"}
          </button>

          {!!docDownloadMime && (
            <span className="text-xs text-gray-500">
              ({docDownloadMime && docDownloadMime.includes("pdf") ? "PDF" : "DOCX"}) ber-highlight
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
