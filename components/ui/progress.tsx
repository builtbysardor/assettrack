export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          background: "var(--bg-elevated)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: value === 100 ? "var(--success)" : "var(--accent)",
            borderRadius: 3,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      {label !== undefined && (
        <span
          style={{
            fontSize: 11,
            color: "var(--text-tertiary)",
            minWidth: 32,
            textAlign: "right",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {value}%
        </span>
      )}
    </div>
  );
}
