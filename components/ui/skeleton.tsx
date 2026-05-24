export function Skeleton({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        borderRadius: 6,
        animation: "pulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}
