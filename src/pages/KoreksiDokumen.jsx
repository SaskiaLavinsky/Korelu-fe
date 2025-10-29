import { useRef, useState, useMemo } from "react";

export default function DocCorrectionPage() {
  const API_BASE = "https://slavinskiaa-korelu-backend.hf.space";
  // const API_BASE = "http://127.0.0.1:8000";

  const [docFile, setDocFile] = useState(null);
  const [docIsLoading, setDocIsLoading] = useState(false);
  const [docCandidates, setDocCandidates] = useState({});
  const [docDownloadId, setDocDownloadId] = useState(null);
  const [docDownloadName, setDocDownloadName] = useState("");
  const [docDownloadMime, setDocDownloadMime] = useState("");
  const [docProcessTimeMs, setDocProcessTimeMs] = useState(null);

  const [previewTokens, setPreviewTokens] = useState([]);
  const [previewIdxSingkatan, setPreviewIdxSingkatan] = useState([]);
  const [previewIdxPolitik, setPreviewIdxPolitik] = useState([]);
  const [previewIdxTypo, setPreviewIdxTypo] = useState([]);
  const [previewText, setPreviewText] = useState("");

  const fileInputRef = useRef(null);

  const BOX =
    "p-4 border border-green-300 bg-green-50 rounded-lg text-gray-800 min-h-[60px] break-words overflow-x-auto select-none ";
  const TA =
    "w-full bg-green-50 border border-green-300 rounded-lg p-4 text-gray-800 min-h-[60px] break-words overflow-x-auto resize-none focus:outline-none ";

  const handlePickFileClick = () => fileInputRef.current?.click();

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
    resetState();
  };

  // === fallback otomatis ke /koreksi bila kandidat kosong ===
  const runCandidateFallback = async (text) => {
    if (!text) return;
    try {
      const res = await fetch(`${API_BASE}/koreksi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kalimat: text.slice(0, 2000) }),
      });
      const raw = await res.text();
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {}
      if (res.ok && data) {
        setDocCandidates(data.candidates || data.symspell_candidates || {});
      }
    } catch (err) {
      console.error("[FALLBACK ERROR]", err);
    }
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
      const res = await fetch(`${API_BASE}/koreksi-doc`, { method: "POST", body: fd });
      const elapsed = performance.now() - start;
      setDocProcessTimeMs(elapsed);

      const raw = await res.text();
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {}

      if (!res.ok || (data && data.error)) {
        throw new Error((data && data.error) || `Server error (${res.status})`);
      }
      if (!data) throw new Error("Response kosong dari server.");

      setDocCandidates(data.candidates || data.symspell_candidates || {});
      setDocDownloadId(data.file_id);
      setDocDownloadName(data.filename || "hasil_koreksi");
      setDocDownloadMime(data.mime || "");

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

      // fallback otomatis
      const textFallback =
        (typeof p.teks === "string" && p.teks.trim()) ||
        (Array.isArray(p.tokens) ? p.tokens.join(" ") : "");
      if (
        !data.candidates &&
        !data.symspell_candidates &&
        textFallback
      ) {
        await runCandidateFallback(textFallback);
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
        <h2 className="text-2xl font-bold text-gray-800">
          📄 Koreksi Dokumen (.docx / .pdf)
        </h2>
      </div>

      <div className="bg-white shadow-md rounded-xl p-6">
        <p className="text-xs text-gray-500 mb-2">
          Sistem memproses maksimal 5.000 karakter pertama. Jangan tutup atau
          ubah halaman saat proses berlangsung agar file tetap tersimpan.
        </p>

        {/* Pilih File */}
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleDocFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={handlePickFileClick}
            disabled={docIsLoading}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              docIsLoading
                ? "bg-blue-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium"
            }`}
          >
            Pilih File (.docx / .pdf)
          </button>

          {docFile && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-sm text-gray-700">
              {docFile.name}
            </span>
          )}

          <button
            onClick={resetState}
            disabled={disableClear}
            className={`${
              disableClear
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            } text-white px-6 py-2 rounded-lg transition`}
          >
            Hapus
          </button>
        </div>

        {/* Proses */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <button
            onClick={handleDocCorrection}
            disabled={docIsLoading || !docFile}
            className={`inline-flex items-center gap-2 text-white px-6 py-2 rounded-lg transition ${
              docIsLoading || !docFile
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {docIsLoading ? "Memproses…" : "Periksa Ejaan & Buat Dokumen"}
          </button>

          {!docIsLoading && docProcessTimeMs !== null && (
            <span className="text-xs text-gray-600">
              ⏱️ Waktu proses:{" "}
              <span className="font-semibold">
                {formatProcTime(docProcessTimeMs)}
              </span>
            </span>
          )}
        </div>

        {/* Hasil */}
        <div className="mt-3">
          <h4 className="font-semibold text-gray-700 mb-2">
            Hasil Koreksi:
          </h4>
          <div className={BOX}>
            {docIsLoading ? (
              <p className="text-gray-500">Sedang memproses...</p>
            ) : previewTokens.length ? (
              renderTokensWithHighlight(
                previewTokens,
                previewIdxSingkatan,
                previewIdxPolitik,
                previewIdxTypo
              )
            ) : (
              <span className="text-gray-500">Belum ada hasil...</span>
            )}
          </div>

          <h4 className="font-semibold text-gray-700 mt-4">Hasil Akhir:</h4>
          <textarea
            readOnly
            value={
              docIsLoading
                ? "Sedang memproses hasil akhir..."
                : previewText || ""
            }
            className={`mt-2 ${TA}`}
          />
        </div>

        {/* Kandidat */}
        <h4 className="font-semibold text-gray-700 mt-6 mb-2">
          Kandidat (JW → PLL):
        </h4>
        <textarea
          readOnly
          value={
            docIsLoading
              ? "Sedang memproses kandidat..."
              : candidatesText || "Tidak ada kandidat"
          }
          className={`mt-2 ${TA}`}
        />

        {/* Unduhan */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleDownloadDocResult}
            disabled={!docDownloadId}
            className={`${
              !docDownloadId
                ? "bg-green-300 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            } text-white px-6 py-2 rounded-lg transition`}
          >
            {docDownloadName ? `Download: ${docDownloadName}` : "Download Hasil"}
          </button>
        </div>
      </div>
    </section>
  );
}
