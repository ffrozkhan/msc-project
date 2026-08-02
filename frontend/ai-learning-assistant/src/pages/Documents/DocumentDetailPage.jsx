import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import documentService from '../../services/documentService';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Tabs from '../../components/common/Tabs';
import ChatInterface from '../../components/chat/ChatInterface';
import AIActions from '../../components/ai/AIActions';
import FlashcardManager from '../../components/flashcards/FlashcardManager';
import QuizManager from '../../components/quizzes/QuizManager';
import styles from './DocumentDetailPage.module.css';
import VideoAnswer from '../../components/documents/VideoAnswer';

const DocumentDetailPage = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Content');

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      try {
        const data = await documentService.getDocumentById(id);
        setDocument(data);
      } catch {
        toast.error('Failed to fetch document details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDocumentDetails();
  }, [id]);

  const getPdfUrl = () => {
    if (!document?.data?.filePath) return null;
    const filePath = document.data.filePath;
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    return `${baseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  };

  const renderContent = () => {
    if (loading) return <Spinner />;
    if (!document?.data?.filePath) return <div className={styles.notAvailable}>PDF not available.</div>;
    const pdfUrl = getPdfUrl();
    return (
      <div className={styles.pdfContainer}>
        <div className={styles.pdfToolbar}>
          <span className={styles.pdfToolbarLabel}>Document Viewer</span>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.pdfOpenLink}>
            <ExternalLink size={16} /> Open in new tab
          </a>
        </div>
        <div className={styles.pdfWrap}>
          <iframe src={pdfUrl} className={styles.pdfFrame} title="PDF Viewer" frameBorder="0" style={{ colorScheme: 'light' }} />
        </div>
      </div>
    );
  };

  const tabs = [
    { name: 'Content', label: 'Content', content: renderContent() },
    { name: 'Chat', label: 'Chat', content: <ChatInterface /> },
    { name: 'AI Actions', label: 'AI Actions', content: <AIActions /> },
    { name: 'Flashcards', label: 'Flashcards', content: <FlashcardManager documentId={id} /> },
    { name: 'Quizzes', label: 'Quizzes', content: <QuizManager documentId={id} /> },
    { name: 'Video Answer', label: 'Video Answer', content: <VideoAnswer documentId={id} /> },
  ];

  if (loading) return <Spinner />;
  if (!document) return <div className={styles.notAvailable}>Document not found.</div>;

  return (
    <div>
      <Link to="/documents" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to Documents
      </Link>
      <PageHeader title={document.data.title} />
      <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default DocumentDetailPage;
