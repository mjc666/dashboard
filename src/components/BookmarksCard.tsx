const BOOKMARKS = [
  { name: "ChatGPT", url: "https://chat.openai.com" },
  { name: "Claude", url: "https://claude.ai" },
  { name: "Gemini", url: "https://gemini.google.com" },
  { name: "Perplexity", url: "https://perplexity.ai" },
  { name: "Grok", url: "https://grok.x.ai" },
  { name: "Copilot", url: "https://copilot.microsoft.com" },
];

export default function BookmarksCard() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-sm text-zinc-400">AI Chatbots</p>
      <div className="mt-auto grid grid-cols-3 gap-2">
        {BOOKMARKS.map(({ name, url }) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-100 transition-colors hover:bg-zinc-700"
          >
            {name}
          </a>
        ))}
      </div>
    </div>
  );
}
