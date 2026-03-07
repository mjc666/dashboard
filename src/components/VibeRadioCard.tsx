"use client";

export default function VibeRadioCard() {
  const radioUrl = process.env.NEXT_PUBLIC_VIBE_RADIO_URL || "http://localhost:3000";
  
  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-0 shadow-sm transition-colors hover:border-zinc-700">
      <iframe
        src={`${radioUrl}/embed.html?station=ambient`}
        className="h-full w-full border-0"
        title="vibe-radio"
        style={{ minHeight: "120px" }}
      />
    </div>
  );
}
