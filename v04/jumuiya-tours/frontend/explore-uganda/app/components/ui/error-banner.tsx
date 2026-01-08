interface ErrorBannerProps {
  message: string;
  type?: "error" | "info";
}

export default function ErrorBanner({ message, type = "error" }: ErrorBannerProps) {
  if (!message) return null;
  const base =
    type === "error"
      ? "bg-red-50 border-red-400 text-red-700"
      : "bg-yellow-50 border-yellow-400 text-yellow-800";

  return (
    <div className={`border-l-4 p-3 mb-6 rounded-md ${base}`}>
      {type === "error" ? "⚠️" : "ℹ️"} {message}
    </div>
  );
}
