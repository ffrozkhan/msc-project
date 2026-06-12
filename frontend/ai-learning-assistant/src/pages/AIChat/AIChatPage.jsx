import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Send, Sparkles, MessageSquare } from 'lucide-react';
import moment from 'moment';
import toast from 'react-hot-toast';
import conversationService from '../../services/conversationServices';
import MarkdownRenderer from '../../components/common/MarkdownRenderer';
import { useAuth } from '../../context/AuthContext';
import styles from './AIChat.module.css';

const AIChatPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  // Load conversation list
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await conversationService.getAll();
        setConversations(res.data.data || []);
      } catch {
        toast.error('Failed to load conversations.');
      }
    };
    fetch();
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await conversationService.getById(activeId);
        setMessages(res.data.data.messages);
      } catch {
        toast.error('Failed to load messages.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleNew = async () => {
    try {
      const res = await conversationService.create();
      const newConv = res.data.data;
      setConversations(prev => [newConv, ...prev]);
      setActiveId(newConv._id);
      setMessages([]);
    } catch {
      toast.error('Failed to create conversation.');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await conversationService.delete(id);
      setConversations(prev => prev.filter(c => c._id !== id));
      if (activeId === id) { setActiveId(null); setMessages([]); }
    } catch {
      toast.error('Failed to delete conversation.');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeId) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const res = await conversationService.sendMessage(activeId, userMsg.content);
      const { reply, conversation } = res.data.data;

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

      // Update title in sidebar if it just got auto-titled
      setConversations(prev =>
        prev.map(c => c._id === activeId ? { ...c, title: conversation.title, updatedAt: conversation.updatedAt } : c)
      );
    } catch {
      toast.error('Failed to send message.');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className={styles.page}>

      {/* ── Conversation list ── */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button className={styles.newBtn} onClick={handleNew}>
            <Plus size={15} strokeWidth={2.5} /> New Chat
          </button>
        </div>

        <div className={styles.convList}>
          {(!conversations || conversations.length === 0) && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-400)', textAlign: 'center', padding: '24px 8px' }}>
              No conversations yet
            </p>
          )}
          {conversations.length > 0 && conversations.map(c => (
            <div
              key={c._id}
              className={[styles.convItem, activeId === c._id ? styles.convItemActive : ''].join(' ')}
              onClick={() => setActiveId(c._id)}
            >
              <span className={[styles.convTitle, activeId === c._id ? styles.convTitleActive : ''].join(' ')}>
                {c.title}
              </span>
              <span className={styles.convDate}>{moment(c.updatedAt).fromNow()}</span>
              <button className={styles.convDeleteBtn} onClick={(e) => handleDelete(e, c._id)}>
                <Trash2 size={13} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className={styles.chatArea}>
        {!activeId ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><MessageSquare size={30} strokeWidth={2} /></div>
            <h3 className={styles.emptyTitle}>AI Assistant</h3>
            <p className={styles.emptyDesc}>Start a new conversation or pick one from the left. Ask anything — no document needed.</p>
            <button
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--background-blue)', color: '#fff', fontWeight: 600, fontSize: '0.875rem', border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={handleNew}
            >
              <Plus size={16} /> Start chatting
            </button>
          </div>
        ) : (
          <>
            <div className={styles.messages}>
              {messages.map((msg, i) => (
                <div key={i} className={[styles.msgRow, msg.role === 'user' ? styles.msgRowUser : ''].join(' ')}>
                  {msg.role === 'assistant' && (
                    <div className={styles.aiAvatar}><Sparkles size={15} strokeWidth={2} /></div>
                  )}
                  <div className={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI].join(' ')}>
                    {msg.role === 'assistant'
                      ? <MarkdownRenderer content={msg.content} />
                      : <p>{msg.content}</p>
                    }
                  </div>
                  {msg.role === 'user' && (
                    <div className={styles.userAvatar}>
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              ))}
              {typing && (
                <div className={styles.typingRow}>
                  <div className={styles.aiAvatar}><Sparkles size={15} strokeWidth={2} /></div>
                  <div className={styles.typingBubble}>
                    <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className={styles.inputBar}>
              <form onSubmit={handleSend} className={styles.inputRow}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  className={styles.input}
                  disabled={typing}
                />
                <button type="submit" disabled={typing || !input.trim()} className={styles.sendBtn}>
                  <Send size={18} strokeWidth={2} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default AIChatPage;