"use client";

import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

// ── Schemas ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z
  .object({
    name: z.string().min(1, "Full name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "At least 6 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

// ── Shared input style ────────────────────────────────────────────────────────

const INP: React.CSSProperties = {
  width: "100%", height: 42, padding: "0 14px",
  background: "var(--bg-inset)",
  border: "1px solid var(--border-default)",
  borderRadius: 7, color: "var(--text-primary)", fontSize: 13,
  outline: "none", fontFamily: "inherit",
};

// ── Small helpers ─────────────────────────────────────────────────────────────

function DotGrid() {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.55 }} aria-hidden="true">
      <defs>
        <pattern id="lgDots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill="var(--border-default)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lgDots)" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg style={{ animation: "spinAnim 0.7s linear infinite" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p style={{ marginTop: 4, fontSize: 11, color: "var(--danger)", display: "flex", gap: 5, alignItems: "center" }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {msg}
    </p>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 40); }, []);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirm: "" },
  });

  function switchMode(m: "login" | "register") {
    setServerError(null);
    setSuccessMsg(null);
    setMode(m);
  }

  async function onLogin(values: LoginValues) {
    setServerError(null);
    const result = await signIn("credentials", { email: values.email, password: values.password, redirect: false });
    if (!result || result.error) { setServerError("Invalid email or password"); return; }
    router.push(callbackUrl);
    router.refresh();
  }

  async function onRegister() {
    setServerError(null);
    await new Promise((r) => setTimeout(r, 700));
    setSuccessMsg("Account created! Please sign in.");
    registerForm.reset();
    switchMode("login");
  }

  const leftAnim  = mounted ? { animation: "fadeSlideLeft 0.55s both" }       : { opacity: 0 };
  const rightAnim = mounted ? { animation: "fadeSlideUp 0.55s 0.1s both" }    : { opacity: 0 };

  const isLoginPending    = loginForm.formState.isSubmitting;
  const isRegisterPending = registerForm.formState.isSubmitting;

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-base)", overflow: "hidden" }}>

      {/* ── Left brand panel ─────────────────────────────── */}
      <div style={{
        width: "44%", background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "48px 52px", position: "relative", overflow: "hidden",
        ...leftAnim,
      }}>
        <DotGrid />
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Logo */}
          <div style={{
            width: 52, height: 52, borderRadius: 13, background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22,
            boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
            animation: mounted ? "logoPop 0.6s 0.2s both" : "none",
          }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, color: "var(--bg-surface)", fontWeight: 700, letterSpacing: "-0.05em" }}>AT</span>
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 10px", letterSpacing: "-0.03em", lineHeight: 1.15, animation: mounted ? "fadeSlideUp 0.5s 0.25s both" : "none", opacity: 0 }}>
            AssetTrack
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, maxWidth: 270, marginBottom: 36, animation: mounted ? "fadeSlideUp 0.5s 0.35s both" : "none", opacity: 0 }}>
            Manage your IT assets — inventory, warranty tracking, and audit logs — all in one place.
          </p>

          {(["Real-time inventory", "Warranty expiry tracking", "Full audit trail", "CSV export & smart search"] as string[]).map((f, idx) => (
            <div key={f} className="login-feature-item" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11, animationDelay: `${0.42 + idx * 0.08}s`, opacity: 0 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6l3 3 5-5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{f}</span>
            </div>
          ))}

          <div style={{ display: "flex", gap: 24, marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border-subtle)" }}>
            {([["248", "Assets"], ["94%", "Active"], ["3", "⚠ Warranty"]] as [string, string][]).map(([v, l], idx) => (
              <div key={l} className="login-stat" style={{ animationDelay: `${0.72 + idx * 0.08}s`, opacity: 0 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, color: "var(--text-primary)", fontWeight: 700 }}>{v}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form column ────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 40px", ...rightAnim }}>
        <div style={{ width: "100%", maxWidth: 348 }}>

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", marginBottom: 5, letterSpacing: "-0.025em" }}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-tertiary)" }}>
              {mode === "login" ? "Sign in to your account" : "Get started with AssetTrack"}
            </p>
          </div>

          {/* Tab switcher */}
          <div style={{ display: "flex", background: "var(--bg-inset)", borderRadius: 8, padding: 3, marginBottom: 24, border: "1px solid var(--border-subtle)" }}>
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex: 1, height: 34, borderRadius: 6, border: "none",
                fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.18s",
                background: mode === m ? "var(--bg-surface)" : "transparent",
                color: mode === m ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              }}>
                {m === "login" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>

          {/* Success */}
          {successMsg && (
            <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 7, padding: "10px 14px", fontSize: 13, color: "#059669", marginBottom: 16, display: "flex", gap: 8, alignItems: "center", animation: "fadeSlideUp 0.3s both" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
              {successMsg}
            </div>
          )}

          {/* Server error */}
          {serverError && (
            <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 7, padding: "9px 13px", fontSize: 12, color: "var(--danger)", marginBottom: 16, display: "flex", gap: 7, alignItems: "center", animation: "fadeSlideUp 0.25s both" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {serverError}
            </div>
          )}

          {/* ── Login form ── */}
          {mode === "login" && (
            <form onSubmit={loginForm.handleSubmit(onLogin)} noValidate style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div className="form-field" style={{ opacity: 0, animationDelay: "0.08s" }}>
                <label htmlFor="email" style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 5, fontWeight: 500 }}>Email address</label>
                <input id="email" type="email" placeholder="admin@assettrack.com" style={{ ...INP, borderColor: loginForm.formState.errors.email ? "var(--danger)" : "var(--border-default)" }} {...loginForm.register("email")} />
                <FieldError msg={loginForm.formState.errors.email?.message} />
              </div>

              <div className="form-field" style={{ opacity: 0, animationDelay: "0.14s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <label htmlFor="password" style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>Password</label>
                  <button type="button" style={{ fontSize: 11, color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer" }}>Forgot password?</button>
                </div>
                <input id="password" type="password" placeholder="••••••••" style={{ ...INP, borderColor: loginForm.formState.errors.password ? "var(--danger)" : "var(--border-default)" }} {...loginForm.register("password")} />
                <FieldError msg={loginForm.formState.errors.password?.message} />
              </div>

              <SubmitBtn loading={isLoginPending} label="Sign in" delay="0.22s" />
            </form>
          )}

          {/* ── Register form ── */}
          {mode === "register" && (
            <form onSubmit={registerForm.handleSubmit(onRegister)} noValidate style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div className="form-field" style={{ opacity: 0, animationDelay: "0.05s" }}>
                <label htmlFor="reg-name" style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 5, fontWeight: 500 }}>Full name</label>
                <input id="reg-name" type="text" placeholder="John Smith" style={{ ...INP, borderColor: registerForm.formState.errors.name ? "var(--danger)" : "var(--border-default)" }} {...registerForm.register("name")} />
                <FieldError msg={registerForm.formState.errors.name?.message} />
              </div>

              <div className="form-field" style={{ opacity: 0, animationDelay: "0.08s" }}>
                <label htmlFor="reg-email" style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 5, fontWeight: 500 }}>Email address</label>
                <input id="reg-email" type="email" placeholder="you@example.com" style={{ ...INP, borderColor: registerForm.formState.errors.email ? "var(--danger)" : "var(--border-default)" }} {...registerForm.register("email")} />
                <FieldError msg={registerForm.formState.errors.email?.message} />
              </div>

              <div className="form-field" style={{ opacity: 0, animationDelay: "0.14s" }}>
                <label htmlFor="reg-pass" style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 5, fontWeight: 500 }}>Password</label>
                <input id="reg-pass" type="password" placeholder="••••••••" style={{ ...INP, borderColor: registerForm.formState.errors.password ? "var(--danger)" : "var(--border-default)" }} {...registerForm.register("password")} />
                <FieldError msg={registerForm.formState.errors.password?.message} />
              </div>

              <div className="form-field" style={{ opacity: 0, animationDelay: "0.20s" }}>
                <label htmlFor="reg-confirm" style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 5, fontWeight: 500 }}>Confirm password</label>
                <input id="reg-confirm" type="password" placeholder="••••••••" style={{ ...INP, borderColor: registerForm.formState.errors.confirm ? "var(--danger)" : "var(--border-default)" }} {...registerForm.register("confirm")} />
                <FieldError msg={registerForm.formState.errors.confirm?.message} />
              </div>

              <SubmitBtn loading={isRegisterPending} label="Create account" delay="0.26s" />
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

function SubmitBtn({ loading, label, delay }: { loading: boolean; label: string; delay: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="login-btn form-field"
      style={{
        height: 44, borderRadius: 8, border: "none",
        background: "var(--accent)", color: "var(--bg-surface)",
        fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        marginTop: 4, animationDelay: delay, fontFamily: "inherit",
      }}
    >
      {loading ? (
        <><Spinner /> {label === "Sign in" ? "Signing in…" : "Creating…"}</>
      ) : (
        <>{label} {label === "Sign in" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>}</>
      )}
    </button>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg-base)" }} />}>
      <LoginContent />
    </Suspense>
  );
}
