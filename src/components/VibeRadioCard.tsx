"use client";

export default function VibeRadioCard() {
  const radioUrl = process.env.NEXT_PUBLIC_VIBE_RADIO_URL || "http://localhost:3000";
  
  return (
    <div className="flex h-full min-h-[140px] w-full flex-col justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-sm transition-colors hover:border-zinc-700">
      <iframe
        src={`${radioUrl}/embed.html?station=ambient`}
        className="h-[120px] w-full border-0"
        title="vibe-radio"
      />
    </div>
  );
}
