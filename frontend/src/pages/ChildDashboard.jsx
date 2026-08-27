import { useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";
import ChildModeGuard from "../components/ChildModeGuard";
import "./child-mode.css";

const TILES = [
  { label: "Alphabets", emoji: "🔤" },
  { label: "Numbers", emoji: "🔢" },
  { label: "Colors", emoji: "🎨" },
  { label: "Shapes", emoji: "🔺" },
  { label: "Animals", emoji: "🐘" },
  { label: "Rhymes", emoji: "🎵" },
];

export default function ChildDashboard() {
  const { studentId } = useParams();
  const [messages, setMessages] = useState([
    { from: "buddy", text: "Hi friend! I'm your Learning Buddy 🐻. Ask me about letters, numbers, or say 'tell me a story'!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  function showReward(text) {
    setToast(text);
    setTimeout(() => setToast(null), 5000);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { from: "child", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/api/child/ai-buddy/chat", {
        user_type: "child",
        student_id: Number(studentId),
        message: userMessage.text,
      });
      setMessages((prev) => [...prev, { from: "buddy", text: res.data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { from: "buddy", text: "Oops! I couldn't hear you. Try again?" }]);
    } finally {
      setLoading(false);
    }
  }

  async function submitSampleQuiz(score) {
    try {
      const res = await api.post("/api/child/quiz-result", null, {
        params: { student_id: Number(studentId), quiz_name: "Colors Quiz", score },
      });
      if (res.data.reward) showReward("New star for a great quiz score! ⭐");
    } catch {
      // quiz submission is non-critical to the demo; fail silently
    }
  }

  return (
    <ChildModeGuard studentId={Number(studentId)} onReward={showReward}>
      <div className="cm-page">
        <h1 className="cm-title">🌈 Learning World</h1>
        <p className="cm-subtitle">Pick something fun to explore!</p>

        <div className="cm-grid">
          {TILES.map((m, i) => (
            <button
              key={m.label}
              className="cm-tile"
              style={{ animationDelay: `${i * 40}ms` }}
              onClick={() => m.label === "Colors" && submitSampleQuiz(90)}
              title={m.label === "Colors" ? "Try a sample quiz!" : undefined}
              type="button"
            >
              <span className="cm-tile__emoji">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>

        <div className="cm-chat">
          <div className="cm-chat__header">
            <span className="cm-chat__badge">🧸</span>
            <h2 className="cm-chat__title">AI Learning Buddy</h2>
          </div>
          <div className="cm-messages">
            {messages.map((m, i) => (
              <div key={i} className={`cm-bubble ${m.from === "child" ? "cm-bubble--child" : "cm-bubble--buddy"}`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="cm-bubble cm-bubble--loading">…</div>}
          </div>
          <form onSubmit={sendMessage} className="cm-input-row">
            <input
              className="cm-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Say something to your buddy..."
            />
            <button className="cm-send" type="submit">Send</button>
          </form>
        </div>

        {toast && <div className="cm-toast">🎉 {toast}</div>}
      </div>
    </ChildModeGuard>
  );
}
