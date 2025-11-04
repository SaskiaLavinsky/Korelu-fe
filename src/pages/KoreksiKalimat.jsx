import { useState, useMemo, useRef, useEffect } from "react";

export default function TextCorrectionPage() {
  const MAX_CHARS = 5000;

  // Pakai ENV kalau sudah diset di Vercel; fallback ke hardcode-mu
  const API_BASE =
    import.meta?.env?.VITE_API_BASE || "https://slavinskiaa-korelu-backend.hf.space";
  console.log("API_BASE in bundle =", API_BASE);

  // ====== STATE ======
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [hasilTeks, setHasilTeks] = useState("");
  const [hasilTokens, setHasilTokens] = useState([]);
  const [processTimeMs, setProcessTimeMs] = useState(null);

  const [ubahIndex, setUbahIndex] = useState([]);
  const [idxSingkatan, setIdxSingkatan] = useState([]);
  const [idxPolitikFix, setIdxPolitikFix] = useState([]);
  const [idxTypoFix, setIdxTypoFix] = useState([]);

  const [symspellCandidates, setSymspellCandidates] = useState({});

  // Controller request aktif + watchdog timeout id
  const ctrlRef = useRef(null);
  const watchdogRef = useRef(null);

  // ====== STYLES ======
  const TA_BASE =
    "w-full bg-green-50 border border-green-300 rounded-lg p-4 text-gray-800 min-h-[60px] " +
    "break-words overflow-x-auto resize-none focus:outline-none";

  // ====== HELPERS ======
  const handleCopy = () => {
    if (!hasilTeks) return;
    navigator.clipboard.writeText(hasilTeks);
  };

  const renderTokensWithHighlight = (tokens, biru, pink, kuning) => {
    const B = new Set(biru || []);
    const P = new Set(pink || []);
    const K = new Set(kuning || []);
    const safe = Array.isArray(tokens) ? tokens : [];
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

  // Susun teks kandidat untuk textarea
  const candidatesText = useMemo(() => {
    if (!symspellCandidates || Object.keys(symspellCandidates).length === 0) {
      return "";
    }
    const lines = [];
    for (const [asal, kandidat] of Object.entries(symspellCandidates)) {
      if (Array.isArray(kandidat) && kandidat.length > 0) {
        const parts = kandidat.map(([term, jw, pll]) => {
          const jwStr = jw != null ? Number(jw).toFixed(2) : "-";
          const pllStr = pll != null ? Number(pll).toFixed(3) : "-";
          return `${term} (JW ${jwStr}, PLL ${pllStr})`;
        });
        lines.push(`${asal}: ${parts.join(", ")}`);
      } else {
        lines.push(`${asal}: (tidak ada kandidat)`);
      }
    }
    return lines.join("\n");
  }, [symspellCandidates]);

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

  // ====== LIFECYCLE PROTEKSI (HP) ======
  useEffect(() => {
    // Abort saat tab disembunyikan (HP lock/pindah app) biar gak ngegantung
    const onVisibility = () => {
      if (document.hidden) {
        try { ctrlRef.current?.abort(); } catch {}
      }
    };

    // Abort & beri pesan jika offline
    const onOffline = () => {
      try { ctrlRef.current?.abort(); } catch {}
      setErrorMsg("Koneksi Internet terputus. Coba lagi saat online.");
      setIsLoading(false);
    };

    const onOnline = () => {
      // bersihkan pesan kalau sudah online lagi (opsional)
      // setErrorMsg("");
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  const clearWatchdog = () => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  };

  // ====== ACTION: Koreksi Kalimat ======
  const handleTextCorrection = async () => {
    const text = (inputText || "").trim();
    if (!text) return;

    const payload = text.slice(0, MAX_CHARS);

    // Batalkan request sebelumnya bila masih jalan
    try { ctrlRef.current?.abort(); } catch {}
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    setIsLoading(true);
    setErrorMsg("");
    setProcessTimeMs(null);

    // Watchdog: paksa berhenti kalau lebih dari 60 detik (jaringan HP sering freeze)
    clearWatchdog();
    watchdogRef.current = setTimeout(() => {
      try { ctrlRef.current?.abort(); } catch {}
      setIsLoading(false);
      setErrorMsg("Koneksi lambat/terputus. Silakan coba lagi.");
    }, 60000);

    const start = performance.now();

    try {
      // Tambah proteksi timeout di sisi fetch juga (race)
      const timeout = new Promise((_, rej) =>
        setTimeout(() => rej(new Error("Timeout")), 60000)
      );

      const res = await Promise.race([
        fetch(`${API_BASE}/koreksi`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kalimat: payload }),
          signal: ctrl.signal,
        }),
        timeout,
      ]);

      // Kalau Promise.race dimenangkan oleh timeout, di atas sudah throw Error("Timeout")

      // Baca sebagai text dulu supaya kalau server balas HTML/error tetap tertangani
      const raw = await res.text();
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        // bukan JSON (mungkin HTML dari proxy/server)
      }

      if (!res.ok || !data) {
        const msg =
          (data && data.error) ||
          `Gagal menghubungi server (HTTP ${res.status}).`;
        throw new Error(msg);
      }

      // === sukses ===
      setHasilTeks(data.teks || "");
      setHasilTokens(Array.isArray(data.tokens) ? data.tokens : []);
      setUbahIndex(Array.isArray(data.ubah_index) ? data.ubah_index : []);
      setIdxSingkatan(Array.isArray(data.idx_singkatan) ? data.idx_singkatan : []);
      setIdxPolitikFix(Array.isArray(data.idx_politik_fix) ? data.idx_politik_fix : []);
      setIdxTypoFix(Array.isArray(data.idx_typo_fix) ? data.idx_typo_fix : []);
      setSymspellCandidates(data.symspell_candidates || {});
      setErrorMsg("");
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error(e);
        setHasilTeks("");
        setHasilTokens([]);
        setUbahIndex([]);
        setIdxSingkatan([]);
        setIdxPolitikFix([]);
        setIdxTypoFix([]);
        setSymspellCandidates({});
        setErrorMsg(e?.message || "Terjadi kesalahan saat menghubungi server.");
      }
    } finally {
      clearWatchdog();
      setProcessTimeMs(performance.now() - start);
      setIsLoading(false);
      ctrlRef.current = null;
    }
  };

  return (
    <>
      {/* ====== TEXT CORRECTION ====== */}
      <section id="text-correction" className="scroll-mt-24 px-6 md:px-10 py-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📝 Koreksi Kalimat</h2>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6 mb-8">
          {/* Input */}
          <textarea
            id="inputText"
            name="inputText"
            placeholder="cth: anggoa dpr itu sdng berdebat panass."
            value={inputText}
            onChange={(e) => setInputText(e.target.value.slice(0, MAX_CHARS))}
            maxLength={MAX_CHARS}
            className="w-full p-4 border border-gray-300 rounded-lg resize-none mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={4}
          />

          <div className="text-xs text-gray-500 mb-4 text-right">
            {inputText.length}/{MAX_CHARS} karakter
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={handleTextCorrection}
              disabled={isLoading || !inputText.trim()}
              className={`text-white px-6 py-2 rounded-lg transition flex items-center justify-center ${
                isLoading || !inputText.trim()
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Memproses...
                </>
              ) : (
                "Periksa Ejaan"
              )}
            </button>

            {/* Waktu proses */}
            {!isLoading && processTimeMs !== null && (
              <span className="text-sm text-gray-600" aria-live="polite">
                ⏱️ Waktu proses:{" "}
                <span className="font-semibold">{formatProcTime(processTimeMs)}</span>
              </span>
            )}

            <div className="text-xs text-gray-600 flex flex-wrap gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-100">Singkatan</span>
              <span className="px-2 py-0.5 rounded bg-pink-100">Perbaikan Kamus Politik</span>
              <span className="px-2 py-0.5 rounded bg-yellow-100">Perbaikan Typo umum</span>
            </div>
          </div>

          {/* Pesan error kalau ada */}
          {errorMsg && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          {/* 1) HASIL KOREKSI (div supaya highlight tampil) */}
          <div className="mt-3">
            <h4 className="font-semibold text-gray-700 mb-2">Hasil Koreksi:</h4>
            <div className={`${TA_BASE} select-none`}>
              {isLoading ? (
                <p className="text-gray-500">Sedang memproses koreksi. Mohon tunggu...</p>
              ) : hasilTokens.length ? (
                renderTokensWithHighlight(hasilTokens, idxSingkatan, idxPolitikFix, idxTypoFix)
              ) : (
                <span className="text-gray-500">Belum ada hasil...</span>
              )}
            </div>

            {/* 2) HASIL AKHIR (textarea asli) */}
            <div className="flex items-center justify-between mt-4">
              <h4 className="font-semibold text-gray-700">Hasil Akhir:</h4>
              <button
                onClick={handleCopy}
                disabled={!hasilTeks || isLoading}
                className={`flex items-center gap-2 text-sm px-2 py-1 rounded transition ${
                  hasilTeks && !isLoading
                    ? "text-gray-600 hover:text-blue-600"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                title="Salin Teks"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1z" />
                  <path d="M20 5H8c-1.1 0-2 .9-2 2v14h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h12v14z" />
                </svg>
                <span className="hidden sm:inline">Salin</span>
              </button>
            </div>

            <textarea
              readOnly
              value={isLoading ? "Sedang memproses hasil akhir. Mohon tunggu..." : (hasilTeks || "")}
              placeholder="Hasil akhir akan muncul di sini…"
              className={`${TA_BASE} mt-2`}
            />
          </div>

          {/* 3) KANDIDAT (JW → PLL) */}
          <h4 className="font-semibold text-gray-700 mt-6 mb-2">Kandidat (JW → PLL):</h4>
          <textarea
            readOnly
            value={candidatesText}
            placeholder={isLoading ? "Sedang memuat kandidat…" : "Tidak ada Kandidat"}
            className={TA_BASE}
          />
        </div>
      </section>
    </>
  );
}
