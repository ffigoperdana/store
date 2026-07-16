"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  generateTotpPair,
  getTotpTiming,
  TOTP_PERIOD_SECONDS,
  validateBase32Secret,
  type Base32ValidationCode,
} from "@/lib/totp";

const INPUT_DEBOUNCE_MILLISECONDS = 300;
const CLOCK_INTERVAL_MILLISECONDS = 250;
const COPY_FEEDBACK_MILLISECONDS = 2_000;

type CopyTarget = "code" | "link";

interface GeneratedCodes {
  counter: number;
  secret: string;
  currentCode: string;
  nextCode: string;
}

interface FailedGeneration {
  counter: number;
  secret: string;
}

interface CopyFeedback {
  target: CopyTarget | null;
  state: "idle" | "copied" | "error";
}

const VALIDATION_MESSAGES: Record<Base32ValidationCode, string> = {
  EMPTY_SECRET: "Masukkan secret key untuk membuat kode 2FA.",
  INVALID_CHARACTERS:
    "Secret key hanya boleh berisi huruf A-Z dan angka 2-7.",
  INVALID_LENGTH: "Panjang secret key Base32 belum valid.",
};

function readSecretFromLocation(): {
  secret: string;
  migratedFromQuery: boolean;
} {
  const url = new URL(window.location.href);
  const hashParameters = new URLSearchParams(url.hash.replace(/^#/, ""));
  const hashSecret = hashParameters.get("key");

  if (hashSecret !== null) {
    return { secret: hashSecret, migratedFromQuery: false };
  }

  const querySecret = url.searchParams.get("key");
  return {
    secret: querySecret ?? "",
    migratedFromQuery: querySecret !== null,
  };
}

function migrateQuerySecretToHash(secret: string): void {
  try {
    const url = new URL(window.location.href);
    const hashParameters = new URLSearchParams();
    hashParameters.set("key", secret);
    url.searchParams.delete("key");
    url.hash = hashParameters.toString();
    window.history.replaceState(window.history.state, "", url);
  } catch {
    // Some embedded browsers disallow history replacement. The query value is
    // still usable for this session and is never copied into storage.
  }
}

function makeShareUrl(normalizedSecret: string): string {
  if (!normalizedSecret || typeof window === "undefined") {
    return "";
  }

  const url = new URL(window.location.href);
  const hashParameters = new URLSearchParams();
  hashParameters.set("key", normalizedSecret);
  url.searchParams.delete("key");
  url.hash = hashParameters.toString();
  return url.toString();
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Clipboard access can be blocked outside HTTPS; use the selection-based
      // fallback below while the click still has user activation.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.readOnly = true;
  textarea.style.position = "fixed";
  textarea.style.inset = "0 auto auto -9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Copy command was rejected.");
    }
  } finally {
    textarea.remove();
  }
}

export function TwoFactorTool() {
  const inputId = useId();
  const inputHelpId = useId();
  const inputErrorId = useId();
  const statusId = useId();
  const shareInputId = useId();
  const [secretInput, setSecretInput] = useState("");
  const [debouncedSecret, setDebouncedSecret] = useState("");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [nowMilliseconds, setNowMilliseconds] = useState(0);
  const [codes, setCodes] = useState<GeneratedCodes | null>(null);
  const [failedGeneration, setFailedGeneration] =
    useState<FailedGeneration | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback>({
    target: null,
    state: "idle",
  });
  const copyResetTimer = useRef<number | null>(null);

  useEffect(() => {
    const { secret, migratedFromQuery } = readSecretFromLocation();
    if (migratedFromQuery) {
      migrateQuerySecretToHash(secret);
    }

    const hydrationTimer = window.setTimeout(() => {
      if (secret) {
        setSecretInput(secret);
        setHasInteracted(true);
      }
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSecret(secretInput),
      INPUT_DEBOUNCE_MILLISECONDS,
    );
    return () => window.clearTimeout(timer);
  }, [secretInput]);

  const validation = useMemo(
    () => validateBase32Secret(debouncedSecret),
    [debouncedSecret],
  );
  const isDebouncing = secretInput !== debouncedSecret;
  const canGenerate = validation.isValid && !isDebouncing;

  useEffect(() => {
    if (!canGenerate) return;

    const updateClock = () => setNowMilliseconds(Date.now());
    const initialTick = window.setTimeout(updateClock, 0);
    const interval = window.setInterval(
      updateClock,
      CLOCK_INTERVAL_MILLISECONDS,
    );
    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(interval);
    };
  }, [canGenerate]);

  const timing = useMemo(
    () =>
      getTotpTiming(
        nowMilliseconds,
        TOTP_PERIOD_SECONDS,
      ),
    [nowMilliseconds],
  );
  const activeCounter =
    canGenerate && nowMilliseconds > 0 ? timing.counter : null;

  useEffect(() => {
    if (!canGenerate || activeCounter === null) return;

    let isCurrentRequest = true;
    const counter = activeCounter;
    const secret = validation.normalizedSecret;

    // A period-aligned timestamp keeps this effect deterministic and avoids
    // regenerating HMAC values on each 250 ms countdown tick.
    void generateTotpPair(
      secret,
      counter * TOTP_PERIOD_SECONDS * 1_000,
    )
      .then((pair) => {
        if (!isCurrentRequest) return;
        setCodes({
          counter,
          secret,
          currentCode: pair.currentCode,
          nextCode: pair.nextCode,
        });
        setFailedGeneration(null);
      })
      .catch(() => {
        if (!isCurrentRequest) return;
        setFailedGeneration({ counter, secret });
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [
    activeCounter,
    canGenerate,
    validation.normalizedSecret,
  ]);

  useEffect(
    () => () => {
      if (copyResetTimer.current !== null) {
        window.clearTimeout(copyResetTimer.current);
      }
    },
    [],
  );

  const visibleCodes =
    canGenerate &&
    codes?.counter === timing.counter &&
    codes.secret === validation.normalizedSecret
      ? codes
      : null;
  const hasGenerationError = Boolean(
    canGenerate &&
      activeCounter !== null &&
      failedGeneration?.counter === activeCounter &&
      failedGeneration.secret === validation.normalizedSecret,
  );
  const isGenerating = Boolean(
    canGenerate && activeCounter !== null && !visibleCodes && !hasGenerationError,
  );
  const shareUrl = canGenerate
    ? makeShareUrl(validation.normalizedSecret)
    : "";
  const validationMessage =
    !isDebouncing && validation.code
      ? VALIDATION_MESSAGES[validation.code]
      : null;
  const showValidationError = hasInteracted && Boolean(validationMessage);
  const describedBy = showValidationError
    ? `${inputHelpId} ${inputErrorId}`
    : inputHelpId;

  function handleSecretChange(event: ChangeEvent<HTMLInputElement>) {
    setHasInteracted(true);
    setSecretInput(event.target.value);
    setCopyFeedback({ target: null, state: "idle" });
  }

  async function handleCopy(target: CopyTarget, value: string) {
    if (!value) return;

    if (copyResetTimer.current !== null) {
      window.clearTimeout(copyResetTimer.current);
    }

    try {
      await copyText(value);
      setCopyFeedback({ target, state: "copied" });
    } catch {
      setCopyFeedback({ target, state: "error" });
    }

    copyResetTimer.current = window.setTimeout(() => {
      setCopyFeedback({ target: null, state: "idle" });
    }, COPY_FEEDBACK_MILLISECONDS);
  }

  const codeButtonLabel =
    copyFeedback.target === "code" && copyFeedback.state === "copied"
      ? "Tersalin"
      : "Salin kode";
  const linkButtonLabel =
    copyFeedback.target === "link" && copyFeedback.state === "copied"
      ? "Tersalin"
      : "Salin link";
  const liveMessage =
    copyFeedback.state === "error"
      ? "Tidak dapat menyalin otomatis. Pilih teks dan salin secara manual."
      : copyFeedback.state === "copied"
        ? copyFeedback.target === "code"
          ? "Kode 2FA berhasil disalin."
          : "Tautan berhasil disalin."
        : isGenerating || isDebouncing
          ? "Sedang membuat kode 2FA."
          : "";

  return (
    <section className="totp-tool" aria-labelledby="totp-tool-title">
      <header className="totp-header">
        <p className="totp-eyebrow">Authenticator utility</p>
        <h1 className="totp-title" id="totp-tool-title">
          2FA Code Generator
        </h1>
        <p className="totp-description">
          Tempel secret key Base32. Semua kode dibuat langsung di perangkatmu.
        </p>
      </header>

      <div className="totp-input-section">
        <label className="totp-input-label" htmlFor={inputId}>
          Secret key
        </label>
        <div className="totp-input-shell">
          <input
            className="totp-secret-input"
            id={inputId}
            type="text"
            value={secretInput}
            onChange={handleSecretChange}
            placeholder="Contoh: JBSWY3DPEHPK3PXP"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-invalid={showValidationError}
            aria-describedby={describedBy}
          />
          {isDebouncing ? (
            <span className="totp-input-state" aria-hidden="true">
              Memeriksa…
            </span>
          ) : null}
        </div>
        <p className="totp-input-help" id={inputHelpId}>
          Spasi, tanda hubung, huruf kecil, dan padding akan dinormalisasi.
        </p>
        {showValidationError ? (
          <p className="totp-input-error" id={inputErrorId} role="alert">
            {validationMessage}
          </p>
        ) : null}
      </div>

      <div className="totp-code-panel" aria-busy={isGenerating}>
        <div className="totp-code-heading-row">
          <p className="totp-code-label">Kode 2FA saat ini</p>
          <button
            className="totp-copy-button"
            type="button"
            disabled={!visibleCodes}
            onClick={() =>
              void handleCopy("code", visibleCodes?.currentCode ?? "")
            }
          >
            {codeButtonLabel}
          </button>
        </div>

        {hasGenerationError ? (
          <div className="totp-generation-error" role="alert">
            Browser tidak dapat membuat kode. Pastikan halaman dibuka melalui
            koneksi HTTPS yang aman.
          </div>
        ) : visibleCodes ? (
          <>
            <button
              className="totp-code-button"
              type="button"
              onClick={() => void handleCopy("code", visibleCodes.currentCode)}
              aria-label={`Kode 2FA ${visibleCodes.currentCode}. Tekan untuk menyalin.`}
            >
              <output className="totp-code-output" aria-live="off">
                {visibleCodes.currentCode.split("").map((digit, index) => (
                  <span className="totp-code-digit" key={`${index}-${digit}`}>
                    {digit}
                  </span>
                ))}
              </output>
            </button>

            <div className="totp-countdown-row">
              <span className="totp-countdown-text">
                Kode berikutnya <strong>{visibleCodes.nextCode}</strong> dalam{" "}
                {timing.remainingSeconds} detik
              </span>
              <progress
                className="totp-progress"
                max={TOTP_PERIOD_SECONDS * 1_000}
                value={timing.remainingMilliseconds}
                aria-label={`${timing.remainingSeconds} detik sampai kode diperbarui`}
              />
            </div>
          </>
        ) : (
          <div className="totp-empty-state">
            {isDebouncing || isGenerating
              ? "Membuat kode aman…"
              : "Masukkan secret key yang valid untuk melihat kode."}
          </div>
        )}
      </div>

      <div className="totp-share-panel">
        <label className="totp-share-label" htmlFor={shareInputId}>
          Tautan alternatif dengan secret key
        </label>
        <div className="totp-share-row">
          <input
            className="totp-share-input"
            id={shareInputId}
            type="text"
            value={shareUrl}
            readOnly
            placeholder="Tautan #key= akan muncul setelah secret valid"
            onFocus={(event) => event.currentTarget.select()}
            aria-describedby={statusId}
          />
          <button
            className="totp-share-copy-button"
            type="button"
            disabled={!shareUrl}
            onClick={() => void handleCopy("link", shareUrl)}
          >
            {linkButtonLabel}
          </button>
        </div>
        <p className="totp-privacy-note">
          Secret hanya berada di browser dan tidak disimpan atau dikirim ke
          server.
        </p>
      </div>

      <p className="totp-live-status" id={statusId} aria-live="polite">
        {liveMessage}
      </p>
    </section>
  );
}
