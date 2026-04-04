import { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

const suggestedPrompts = [
  "Generate a quiz on photosynthesis for Grade 9",
  "Explain the Pythagorean theorem in simple terms",
  "Create a discussion prompt about climate change",
  "Summarize Chapter 5 of 'To Kill a Mockingbird'",
  "Design a group activity for learning about fractions",
];

export default function AITutor() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your AI Teaching Assistant. I can help you create lesson plans, generate quizzes, explain concepts, or brainstorm classroom activities. What would you like to work on today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text) => {
    const msgText = text || input.trim();
    if (!msgText) return;

    setMessages(prev => [...prev, { role: 'user', content: msgText }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        `Great question! Here's what I'd suggest:\n\n**Key Points:**\n- Start with a warm-up activity to assess prior knowledge\n- Use visual aids and real-world examples\n- Include 2-3 formative assessment checkpoints\n- End with a reflection activity\n\nWould you like me to elaborate on any of these points?`,
        `I've drafted a quick outline:\n\n1. **Introduction** (5 min) — Hook question + learning objectives\n2. **Direct Instruction** (15 min) — Core concept with examples\n3. **Guided Practice** (10 min) — Worked examples together\n4. **Independent Practice** (10 min) — Student exercises\n5. **Wrap-up** (5 min) — Exit ticket\n\nShall I flesh out any section?`,
        `Here are some creative approaches:\n\n🎯 **Think-Pair-Share**: Students discuss in pairs first\n🎮 **Gamification**: Turn the review into a Kahoot-style quiz\n📊 **Data Analysis**: Use real-world datasets\n🎨 **Visual Learning**: Mind maps and concept diagrams\n\nWhich approach resonates with your class?`,
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--background)', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '24px 40px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(128, 131, 255, 0.15), rgba(108, 92, 231, 0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(192, 193, 255, 0.12)',
            }}>
              <span className="material-symbols-outlined filled" style={{ color: '#c0c1ff', fontSize: '22px' }}>smart_toy</span>
            </div>
            <div>
              <h1 className="font-headline" style={{
                fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em',
                background: 'linear-gradient(to right, #e0e2ea, #c0c1ff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>AI Teaching Assistant</h1>
              <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                Powered by AI • Helps you create, plan, and explain
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '24px 40px',
          display: 'flex', flexDirection: 'column', gap: '20px',
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', gap: '12px',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
            }}>
              {/* Avatar */}
              <div style={{
                width: '36px', height: '36px', minWidth: '36px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #4ae176, #2dd573)'
                  : 'linear-gradient(135deg, #8083ff, #494bd6)',
                boxShadow: msg.role === 'user'
                  ? '0 4px 12px rgba(74, 225, 118, 0.2)'
                  : '0 4px 12px rgba(128, 131, 255, 0.2)',
              }}>
                <span className="material-symbols-outlined filled" style={{ color: '#fff', fontSize: '18px' }}>
                  {msg.role === 'user' ? 'person' : 'smart_toy'}
                </span>
              </div>

              {/* Message Bubble */}
              <div style={{
                maxWidth: '70%', padding: '16px 20px',
                borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, rgba(74, 225, 118, 0.12), rgba(45, 213, 115, 0.08))'
                  : 'var(--surface-container)',
                border: msg.role === 'user'
                  ? '1px solid rgba(74, 225, 118, 0.15)'
                  : '1px solid rgba(255,255,255,0.04)',
                fontSize: '14px', lineHeight: 1.7,
                color: 'var(--on-surface)',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{
                width: '36px', height: '36px', minWidth: '36px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #8083ff, #494bd6)',
              }}>
                <span className="material-symbols-outlined filled" style={{ color: '#fff', fontSize: '18px' }}>smart_toy</span>
              </div>
              <div style={{
                padding: '16px 24px', borderRadius: '20px 20px 20px 4px',
                background: 'var(--surface-container)',
                border: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', gap: '6px', alignItems: 'center',
              }}>
                <div className="typing-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c0c1ff', animation: 'typingBounce 1.4s infinite ease-in-out', animationDelay: '0s' }} />
                <div className="typing-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c0c1ff', animation: 'typingBounce 1.4s infinite ease-in-out', animationDelay: '0.2s' }} />
                <div className="typing-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c0c1ff', animation: 'typingBounce 1.4s infinite ease-in-out', animationDelay: '0.4s' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts (only before user sends first message) */}
        {messages.length <= 1 && (
          <div style={{ padding: '0 40px 12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                style={{
                  padding: '8px 16px', borderRadius: '20px', border: 'none',
                  background: 'rgba(128, 131, 255, 0.08)',
                  color: '#c0c1ff', fontSize: '12px', fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.2s',
                  border: '1px solid rgba(192, 193, 255, 0.1)',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(128, 131, 255, 0.15)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(128, 131, 255, 0.08)'}
              >{prompt}</button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div style={{
          padding: '16px 40px 24px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: '12px',
            backgroundColor: 'var(--surface-container)', borderRadius: '16px',
            padding: '12px 16px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about teaching, lesson planning, or activities..."
              rows={1}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: 'var(--on-surface)', fontSize: '14px', resize: 'none',
                lineHeight: 1.5, fontFamily: "'Inter', sans-serif",
                minHeight: '24px', maxHeight: '120px',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              style={{
                width: '40px', height: '40px', borderRadius: '12px',
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                background: input.trim()
                  ? 'linear-gradient(135deg, #8083ff, #494bd6)'
                  : 'rgba(224, 226, 234, 0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: input.trim() ? '0 4px 12px rgba(128, 131, 255, 0.3)' : 'none',
              }}
            >
              <span className="material-symbols-outlined" style={{
                fontSize: '20px',
                color: input.trim() ? '#fff' : 'rgba(224, 226, 234, 0.3)',
              }}>send</span>
            </button>
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(224, 226, 234, 0.25)', marginTop: '8px', textAlign: 'center' }}>
            AI Tutor provides suggestions only. Always review content before using in class.
          </p>
        </div>
      </main>

      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
