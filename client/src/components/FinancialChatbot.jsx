import { useEffect, useMemo, useRef, useState } from "react";
import chatbotDataset from "../data/financial_chatbot_1000.json";

const normalizeText = (text) =>
  text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (text) => normalizeText(text).split(" ").filter(Boolean);

const defaultMessages = [
  {
    id: 1,
    role: "bot",
    time: "10:30 AM",
    text: "Hello. I am your AI financial assistant.",
    extra: "Ask me about loans, EMI, savings, income planning, or banking support questions.",
  },
  {
    id: 2,
    role: "user",
    time: "10:31 AM",
    text: "I earn Rs 40,000 per month. Can I take a loan of Rs 8,00,000?",
  },
  {
    id: 3,
    role: "bot",
    time: "10:31 AM",
    text: "Based on a monthly income of Rs 40,000, a loan near Rs 8,00,000 may be manageable depending on tenure and interest rate.",
    bullets: [
      "Estimated EMI changes with tenure and interest rate.",
      "Savings ratio impact should remain moderate.",
      "Recommendation: keep emergency savings before taking the loan.",
    ],
  },
];

const FALLBACK_RESPONSE =
  "Review income, obligations, repayment capacity, and required documents before taking a final banking decision.";

function findBestMatch(query, dataset) {
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenize(query);

  let bestMatch = null;
  let bestScore = 0;

  for (const item of dataset) {
    let score = 0;

    if (item.normalizedQuestion === normalizedQuery) {
      score += 100;
    }

    if (item.normalizedQuestion.includes(normalizedQuery) || normalizedQuery.includes(item.normalizedQuestion)) {
      score += 35;
    }

    const overlap = queryTokens.filter((token) => item.tokens.includes(token)).length;
    if (overlap > 0) {
      score += (overlap / Math.max(queryTokens.length, 1)) * 30;
      score += (overlap / Math.max(item.tokens.length, 1)) * 20;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return bestScore >= 12 ? bestMatch : null;
}

function ChatAvatar({ role }) {
  return <div className={`fis-chat-avatar ${role}`}>{role === "bot" ? "BOT" : "YOU"}</div>;
}

function FinancialChatbot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(defaultMessages);
  const messagesEndRef = useRef(null);

  const preparedDataset = useMemo(
    () =>
      chatbotDataset.map((item, index) => ({
        ...item,
        id: index + 100,
        normalizedQuestion: normalizeText(item.question),
        tokens: tokenize(item.question),
      })),
    []
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    // Add user message immediately
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", text: trimmed, time: now },
    ]);
    setInput("");

    try {
      const response = await fetch("/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await response.json();
      
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "bot",
          text: data.answer || FALLBACK_RESPONSE,
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (error) {
      console.error("Chatbot API Error:", error);
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "bot",
          text: FALLBACK_RESPONSE,
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  return (
    <section className="fis-panel fis-chat-panel">
      <div className="fis-panel-head align-start">
        <div>
          <h3>AI Financial Assistant</h3>
          <p className="fis-panel-copy">Ask about loans, EMI, savings, income planning, or banking forms.</p>
        </div>
        <button className="fis-secondary-btn compact" type="button" onClick={() => setMessages(defaultMessages)}>
          Clear Chat
        </button>
      </div>

      <div className="fis-chat-window">
        {messages.map((message) => (
          <div key={message.id} className={`fis-chat-row ${message.role}`}>
            {message.role === "bot" ? <ChatAvatar role="bot" /> : null}
            <div className="fis-chat-column">
              <div className={`fis-chat-bubble ${message.role}`}>
                <p>{message.text}</p>
                {message.extra ? <p>{message.extra}</p> : null}
                {message.bullets ? (
                  <ul>
                    {message.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <small>{message.time}</small>
            </div>
            {message.role === "user" ? <ChatAvatar role="user" /> : null}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="fis-chat-entry">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your financial question..."
        />
        <button className="fis-primary-btn compact" type="button" onClick={handleSend}>
          Send
        </button>
      </div>
    </section>
  );
}

export default FinancialChatbot;
