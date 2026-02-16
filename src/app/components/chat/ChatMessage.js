"use client";

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function ChatMessage({ message, isOwn, otherName }) {
  const content = message?.content ?? "";
  const time = formatTime(message?.created_at);
  const read = !!message?.read_at;

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isOwn
            ? "bg-[#2F79F4] text-white rounded-br-md"
            : "bg-[#E0E0E0] dark:bg-[#404040] text-[#2C2C2C] dark:text-[#e5e5e5] rounded-bl-md"
        }`}
      >
        {!isOwn && otherName && (
          <p className="text-xs font-semibold opacity-90 mb-0.5">{otherName}</p>
        )}
        <p className="text-sm sm:text-base break-words whitespace-pre-wrap">{content}</p>
        <div className={`text-xs mt-1 ${isOwn ? "text-white/80" : "text-[#666666] dark:text-[#a3a3a3]"}`}>
          {time}
          {isOwn && read && " · Read"}
        </div>
      </div>
    </div>
  );
}
