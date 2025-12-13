'use client';

import { useState } from 'react';
import { Send, X, Sparkles } from 'lucide-react';
import styles from './ChatPanel.module.css';
import { clsx } from 'clsx';

import { Node, Edge } from '@xyflow/react';

import { useUI } from '@/context/UIContext';
import { API_BASE_URL } from '@/config/api';

interface ChatPanelProps {
  onGenerate: (data: any) => void;
  nodes: Node[];
  edges: Edge[];
}

export function ChatPanel({ onGenerate, nodes, edges }: ChatPanelProps) {
  const { isChatOpen, closeChat } = useUI(); // Use global state
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  // ... handle submit ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMsg = prompt;
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setPrompt('');
    setIsLoading(true);

    const apiKey = localStorage.getItem('openai_api_key');
    const baseUrl = localStorage.getItem('openai_base_url');
    const model = localStorage.getItem('openai_model');

    if (!apiKey) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Please verify your OpenAI API Key in Settings.' }]);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg,
          api_key: apiKey,
          base_url: baseUrl || undefined,
          model: model || undefined,
          current_nodes: nodes,
          current_edges: edges
        }),
      });
      const data = await res.json();

      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
      if (data.nodes && data.nodes.length > 0) {
        onGenerate(data);
      }
    } catch (error) {
      console.error('Error generating model:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error connecting to AI service.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isChatOpen) return null; // Hidden if closed

  return (
    <div className={styles.chatPanel}>
      <div className={styles.chatHeader}>
        <h3>AI Assistant</h3>
        <button className={styles.btnIcon} onClick={() => closeChat()}>
          <X size={20} />
        </button>
      </div>
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
        {isLoading && <div className={clsx(styles.message, styles.messageAssistant)}>Thinking...</div>}
      </div>
      <form onSubmit={handleSubmit} className={styles.inputArea}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe a system to generate..."
          className={styles.chatInput}
        />
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
