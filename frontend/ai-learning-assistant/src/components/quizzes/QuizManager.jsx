import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import quizService from '../../services/quizService';
import aiService from '../../services/aiService';
import Spinner from '../common/Spinner';
import Button from '../common/Button';
import Modal from '../common/Modal';
import QuizCard from './QuizCard';
import EmptyState from '../common/EmptyState';
import styles from './QuizManager.module.css';

const QuizManager = ({ documentId }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const data = await quizService.getQuizzesForDocument(documentId);
      setQuizzes(data.data);
    } catch {
      toast.error('Failed to fetch quizzes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) fetchQuizzes();
  }, [documentId]);

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await aiService.generateQuiz(documentId, { numQuestions });
      toast.success('Quiz generated successfully!');
      setIsGenerateModalOpen(false);
      fetchQuizzes();
    } catch (error) {
      toast.error(error.message || 'Failed to generate quiz.');
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuiz) return;
    setDeleting(true);
    try {
      await quizService.deleteQuiz(selectedQuiz._id);
      toast.success(`'${selectedQuiz.title || 'Quiz'}' deleted.`);
      setIsDeleteModalOpen(false);
      setSelectedQuiz(null);
      setQuizzes(quizzes.filter(q => q._id !== selectedQuiz._id));
    } catch (error) {
      toast.error(error.message || 'Failed to delete quiz.');
    } finally {
      setDeleting(false);
    }
  };

  const renderContent = () => {
    if (loading) return <Spinner />;
    if (quizzes.length === 0) {
      return (
        <EmptyState
          title="No Quizzes Yet"
          description="Generate a quiz from your document to test your knowledge."
        />
      );
    }
    return (
      <div className={styles.grid}>
        {quizzes.map((quiz) => (
          <QuizCard
            key={quiz._id}
            quiz={quiz}
            onDelete={(q) => { setSelectedQuiz(q); setIsDeleteModalOpen(true); }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <Button onClick={() => setIsGenerateModalOpen(true)}>
          <Plus size={16} /> Generate Quiz
        </Button>
      </div>

      {renderContent()}

      <Modal isOpen={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} title="Generate New Quiz">
        <form onSubmit={handleGenerateQuiz}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Number of Questions</label>
            <input
              type="number"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              required
              className={styles.input}
            />
          </div>
          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => setIsGenerateModalOpen(false)} disabled={generating}>Cancel</Button>
            <Button type="submit" disabled={generating}>{generating ? 'Generating...' : 'Generate'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete Quiz">
        <p className={styles.deleteText}>
          Are you sure you want to delete <strong>{selectedQuiz?.title || 'this quiz'}</strong>? This action cannot be undone.
        </p>
        <div className={styles.formActions}>
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={deleting}>Cancel</Button>
          <Button onClick={handleConfirmDelete} disabled={deleting} className="btn-danger">
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default QuizManager;
