import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import quizService from '../../services/quizService';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import styles from './QuizTakePage.module.css';

const QuizTakePage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await quizService.getQuizById(quizId);
        setQuiz(response.data);
      } catch {
        toast.error('Failed to fetch quiz.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = Object.keys(selectedAnswers).map(questionId => {
        const question = quiz.questions.find(q => q._id === questionId);
        const questionIndex = quiz.questions.findIndex(q => q._id === questionId);
        const selectedAnswer = question.options[selectedAnswers[questionId]];
        return { questionIndex, selectedAnswer };
      });
      await quizService.submitQuiz(quizId, formattedAnswers);
      toast.success('Quiz submitted successfully!');
      navigate(`/quizzes/${quizId}/results`);
    } catch (error) {
      toast.error(error.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.centered}><Spinner /></div>;

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className={styles.centered}>
        <p style={{ color: 'var(--color-slate-600)', fontSize: '1.125rem' }}>Quiz not found or has no questions.</p>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className={styles.page}>
      <PageHeader title={quiz.title || 'Take Quiz'} />

      <div className={styles.progressWrap}>
        <div className={styles.progressLabels}>
          <span className={styles.progressLabel}>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
          <span className={styles.progressCount}>{answeredCount} answered</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }} />
        </div>
      </div>

      <div className={styles.questionCard}>
        <div className={styles.questionBadge}>
          <div className={styles.questionDot} />
          <span className={styles.questionBadgeText}>Question {currentQuestionIndex + 1}</span>
        </div>
        <h3 className={styles.questionText}>{currentQuestion.question}</h3>

        <div className={styles.optionsList}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestion._id] === index;
            return (
              <label key={index} className={[styles.option, isSelected ? styles.optionSelected : ''].join(' ')}>
                <input
                  type="radio"
                  name={`question-${currentQuestion._id}`}
                  value={index}
                  checked={isSelected}
                  onChange={() => setSelectedAnswers(prev => ({ ...prev, [currentQuestion._id]: index }))}
                  className={styles.radioInput}
                />
                <div className={[styles.radio, isSelected ? styles.radioChecked : ''].join(' ')}>
                  {isSelected && <div className={styles.radioDot} />}
                </div>
                <span className={[styles.optionText, isSelected ? styles.optionTextSelected : ''].join(' ')}>{option}</span>
                {isSelected && <CheckCircle2 size={20} strokeWidth={2.5} className={styles.checkIcon} />}
              </label>
            );
          })}
        </div>
      </div>

      <div className={styles.navRow}>
        <Button onClick={() => setCurrentQuestionIndex(p => p - 1)} disabled={currentQuestionIndex === 0 || submitting} variant="secondary">
          <ChevronLeft size={16} strokeWidth={2.5} /> Previous
        </Button>

        {currentQuestionIndex === quiz.questions.length - 1 ? (
          <button onClick={handleSubmitQuiz} disabled={submitting} className={styles.submitBtn}>
            {submitting
              ? <><span className={styles.spinnerRing} /> Submitting...</>
              : <><CheckCircle2 size={16} strokeWidth={2.5} /> Submit Quiz</>
            }
          </button>
        ) : (
          <Button onClick={() => setCurrentQuestionIndex(p => p + 1)} disabled={submitting}>
            Next <ChevronRight size={16} strokeWidth={2.5} />
          </Button>
        )}
      </div>

      <div className={styles.dotsRow} style={{ marginTop: '16px' }}>
        {quiz.questions.map((_, index) => {
          const isAnswered = selectedAnswers.hasOwnProperty(quiz.questions[index]._id);
          const isCurrent = index === currentQuestionIndex;
          return (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              disabled={submitting}
              className={[styles.dot, isCurrent ? styles.dotCurrent : isAnswered ? styles.dotAnswered : styles.dotDefault].join(' ')}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuizTakePage;
