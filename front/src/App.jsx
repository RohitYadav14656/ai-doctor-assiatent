import { useState, useEffect } from "react";

const SESSION_ID = "session_1";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load history on page load
  useEffect(() => {
    const loadHistory = async () => {
      const res = await fetch(`http://localhost:3000/chat/${SESSION_ID}`);
      const data = await res.json();
      setChat(data.messages);
    };
    loadHistory();
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsg = { role: "user", content: message };
    const updatedChat = [...chat, userMsg];

    setChat(updatedChat);
    setMessage("");
    setLoading(true);

    const response = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        messages: updatedChat, 
        sessionId: SESSION_ID 
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aiReply = "";

    setChat(prev => [...prev, { role: "assistant", content: "" }]);
    setLoading(false);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          const data = JSON.parse(line.replace("data: ", ""));
          aiReply += data.token;

          setChat(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { 
              role: "assistant", 
              content: aiReply 
            };
            return updated;
          });
        }
      }
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>AI Chat App</h2>
      <div style={{ 
        border: "1px solid #ddd", 
        borderRadius: "8px", 
        padding: "16px", 
        minHeight: "300px", 
        marginBottom: "12px",
        overflowY: "auto",
        maxHeight: "500px"
      }}>
        {chat.map((msg, i) => (
          <div key={i} style={{ 
            textAlign: msg.role === "user" ? "right" : "left", 
            margin: "8px 0" 
          }}>
            <span style={{
              background: msg.role === "user" ? "#0070f3" : "#f1f1f1",
              color: msg.role === "user" ? "white" : "black",
              padding: "8px 14px", 
              borderRadius: "18px", 
              display: "inline-block",
              maxWidth: "80%",
              textAlign: "left"
            }}>
              {msg.content}
            </span>
          </div>
        ))}
        {loading && <div style={{ color: "#999" }}>AI is thinking...</div>}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          style={{ 
            flex: 1, 
            padding: "10px", 
            borderRadius: "6px", 
            border: "1px solid #ddd" 
          }}
        />
        <button 
          onClick={sendMessage} 
          style={{ 
            padding: "10px 20px", 
            background: "#0070f3", 
            color: "white", 
            border: "none", 
            borderRadius: "6px", 
            cursor: "pointer" 
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;