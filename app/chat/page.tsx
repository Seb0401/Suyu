import ChatWidget from "@/components/ChatWidget";

export const metadata = { title: "Copiloto — Suyu" };

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-2xl">
      <ChatWidget />
    </div>
  );
}
