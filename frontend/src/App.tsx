import { useState, useRef } from "react";
import "./App.css";
import loadingGif from "./assets/loading.gif";

function App() {
  const [developerMessage, setDeveloperMessage] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const responseRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResponse("");
    setError("");
    setLoading(true);
    try {
      // Always require a new API key on each reload
      let apiKey = "";
      while (!apiKey) {
        apiKey = prompt("Enter your OpenAI API key:") || "";
        if (!apiKey) alert("API key is required to use the chat.");
      }
      localStorage.setItem("openai_api_key", apiKey);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developer_message: developerMessage,
          user_message: userMessage,
          api_key: apiKey,
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error ${res.status}: ${errorText}`);
      }
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullText = "";
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          fullText += chunk;
          setResponse((prev) => prev + chunk);
          // Scroll to bottom as new content arrives
          setTimeout(() => {
            responseRef.current?.scrollTo({ top: responseRef.current.scrollHeight, behavior: "smooth" });
          }, 0);
        }
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>OpenAI Chat</h1>
      <form onSubmit={handleSubmit} className="chat-form">
        <label>
          System Message:
          <input
            type="text"
            value={developerMessage}
            onChange={(e) => setDeveloperMessage(e.target.value)}
            placeholder="Enter system/developer message"
            required
          />
        </label>
        <label>
          User Message:
          <input
            type="text"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="Enter user message"
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          Send
        </button>
      </form>
      {loading && (
        <div className="loading-container">
          <img src={loadingGif} alt="Loading..." className="loading-gif" />
          <span>Waiting for response...</span>
        </div>
      )}
      {error && <div className="error">Error: {error}</div>}
      <div className="response" ref={responseRef}>
        {response}
      </div>
    </div>
  );
}

export default App;
