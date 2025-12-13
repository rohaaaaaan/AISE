'use client';

import { useState } from 'react';
import { Send, MessageSquare, Plus } from 'lucide-react';
import styles from './chat.module.css';
import { clsx } from 'clsx';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Systems Engineering Assistant. How can I help you model your system today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
    
    // Simulate response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I understand. I can help you break that down into subsystems. Would you like me to generate a Block Definition Diagram?' }]);
    }, 1000);
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button className="btn btn-primary" style={{ width: '100%' }}>
            <Plus size={16} style={{ marginRight: '8px' }} />
            New Chat
          </button>
        </div>
        <div className={styles.historyList}>
          <div className={clsx(styles.historyItem, styles.historyItemActive)}>
            <MessageSquare size={16} style={{ display: 'inline', marginRight: '8px' }} />
            Car System Model
          </div>
          <div className={styles.historyItem}>
            <MessageSquare size={16} style={{ display: 'inline', marginRight: '8px' }} />
            Drone Architecture
          </div>
        </div>
      </aside>
      
      <main className={styles.main}>
        <div className={styles.messages}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={clsx(
                styles.message,
                msg.role === 'user' ? styles.messageUser : styles.messageAssistant
              )}
            >
              {msg.content}
            </div>
          ))}
        </div>
        
        <div className={styles.inputArea}>
          <div className={styles.inputContainer}>
            <input
              className={styles.input}
              placeholder="Ask anything about systems engineering..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="btn btn-primary" onClick={handleSend}>
              <Send size={20} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
