import { useState } from "react";
import "./App.css";

type Message = {
  id: number;
  role: "user" | "assistant" | "other";
  speaker: string;
  timestamp?: string;
  content: string;
};

const MESSAGE_START =
  /^\s*(?:(\[[^\]]+\]|\d{4}-\d{2}-\d{2}[T ][\d:.+-]+Z?)\s*)?(You|User|Assistant|Duck\.ai)\s*:\s*/i;

function parseConversation(text: string): Message[] {
  const messages: Message[] = [];
  let current: Omit<Message, "id"> | null = null;

  function saveCurrent() {
    if (!current) return;

    const content = current.content.trim();
    if (content) {
      messages.push({ ...current, id: messages.length, content });
    }
  }

  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    const userHeader = line.match(
      /^\s*User prompt \d+ of \d+ - (.+?):\s*$/
    );
    const assistantHeader = line.match(/^\s*GPT-6 Luna:\s*$/);

    if (userHeader || assistantHeader) {
      saveCurrent();

      current = userHeader
        ? {
            role: "user",
            speaker: "User",
            timestamp: userHeader[1],
            content: "",
          }
        : {
            role: "assistant",
            speaker: "GPT-6 Luna",
            content: "",
          };

      continue;
    }

    if (/^\s*[-=]{4,}\s*$/.test(line)) continue;

    if (current) {
      current.content += `${current.content ? "\n" : ""}${line}`;
    }
  }

  saveCurrent();
  return messages;
}



function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  async function handleFile(file?: File) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".txt")) {
      setError("Please choose a .txt file.");
      return;
    }

    try {
      const text = await file.text();
      setMessages(parseConversation(text));
      setFileName(file.name);
      setError("");
    } catch {
      setError("Could not read that file.");
    }
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>Chat transcript</h1>
          <p>Upload a text export to view the conversation.</p>
        </div>

        <label className="upload-button">
          Choose text file
          <input
            type="file"
            accept=".txt,text/plain"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      {!messages.length ? (
        <section
          className="empty-state"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleFile(event.dataTransfer.files[0]);
          }}
        >
          <strong>Drop a .txt file here</strong>
          <span>or use the button above to select a file.</span>
        </section>
      ) : (
        <section className="conversation" aria-label="Conversation">
          <div className="file-label">{fileName}</div>

          {messages.map((message) => (
            <details
              className={`message ${message.role}`}
              key={message.id}
              open
            >
              <summary>
                <span className="speaker">{message.speaker}</span>
                {message.timestamp && (
                  <time className="timestamp">{message.timestamp}</time>
                )}
                <span className="toggle" aria-hidden="true" />
              </summary>
              <div className="message-content">{message.content}</div>
            </details>
          ))}
        </section>
      )}
    </main>
  );
}

export default App;
