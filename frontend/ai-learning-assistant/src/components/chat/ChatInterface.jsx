import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Sparkles } from 'lucide-react';
import { useParams } from 'react-router-dom';
import aiService from '../../services/aiService';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../common/Spinner';
import MarkdownRenderer from '../common/MarkdownRenderer';
import styles from './ChatInterface.module.css';

const ChatInterface = () => {
  const { id: documentId } = useParams();
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setInitialLoading(true);
        const response = await aiService.getChatHistory(documentId);
        setHistory(response.data);
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchChatHistory();
  }, [documentId]);

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = { role: 'user', content: message, timestamp: new Date() };
    setHistory(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const response = await aiService.chat(documentId, userMessage.content);
      const assistantMessage = {
        role: 'assistant',
        content: response.data.answer,
        timestamp: new Date(),
        relevantChunks: response.data.relevantChunks,
      };
      setHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.role === 'user';
    return (
      <div key={index} className={[styles.message, isUser ? styles.messageUser : ''].join(' ')}>
        {!isUser && (
          <div className={styles.aiAvatar}>
            <Sparkles size={16} strokeWidth={2} />
          </div>
        )}
        <div className={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI].join(' ')}>
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <MarkdownRenderer content={msg.content} />
          )}
        </div>
        {isUser && (
          <div className={styles.userAvatar}>
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>
    );
  };

  if (initialLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingIcon}>
          <MessageSquare size={28} strokeWidth={2} />
        </div>
        <Spinner />
        <p className={styles.loadingText}>Loading chat history...</p>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messagesArea}>
        {history.length === 0 ? (
          <div className={styles.emptyChat}>
            <div className={styles.emptyChatIcon}>
              <MessageSquare size={32} strokeWidth={2} />
            </div>
            <h3 className={styles.emptyChatTitle}>Start a conversation</h3>
            <p className={styles.emptyChatSub}>Ask me anything about the document!</p>
          </div>
        ) : (
          history.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
        {loading && (
          <div className={styles.typingRow}>
            <div className={styles.aiAvatar}>
              <Sparkles size={16} strokeWidth={2} />
            </div>
            <div className={styles.typingBubble}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          </div>
        )}
      </div>

      <div className={styles.inputArea}>
        <form onSubmit={handleSendMessage} className={styles.inputForm}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask a follow-up question..."
            className={styles.input}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className={styles.sendBtn}
          >
            <Send size={20} strokeWidth={2} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
