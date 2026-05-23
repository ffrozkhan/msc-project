import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import quizService from '../../services/quizService';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Target, BookOpen } from 'lucide-react';
import styles from './QuizResultPage.module.css';

const QuizResultPage = () => {
  const { quizId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await quizService.getQuizResults(quizId);
        setResults(data);
      } catch {
        toast.error('Failed to fetch quiz results.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [quizId]);

  if (loading) return <div className={styles.centered}><Spinner /></div>;

  if (!results?.data) {
    return (
      <div className={styles.centered}>
        <p style={{ color: 'var(--color-slate-600)', fontSize: '1.125rem' }}>Quiz results not found.</p>
      </div>
    );
  }

  const { data: { quiz, results: detailedResults } } = results;
  const score = quiz.score;
  const totalQuestions = detailedResults.length;
  const correctAnswers = detailedResults.filter(r => r.isCorrect).length;
  const incorrectAnswers = totalQuestions - correctAnswers;

  const getScoreClass = (s) => s >= 80 ? styles.scoreGood : s >= 60 ? styles.scoreMid : styles.scoreLow;
  const getScoreMessage = (s) => {
    if (s >= 90) return 'Outstanding!';
    if (s >= 80) return 'Great job!';
    if (s >= 70) return 'Good work!';
    if (s >= 60) return 'Not bad!';
    return 'Keep practicing!';
  };

  return (
    <div className={styles.page}>
      <Link to={`/documents/${quiz.document._id}`} className={styles.backLink}>
        <ArrowLeft size={16} strokeWidth={2} /> Back to Document
      </Link>

      <PageHeader title={`${quiz.title || 'Quiz'} Results`} />

      {/* Score Card */}
      <div className={styles.scoreCard}>
        <div className={styles.trophyWrap}><Trophy size={28} strokeWidth={2} /></div>
        <p className={styles.scoreLabel}>Your Score</p>
        <span className={[styles.scoreValue, getScoreClass(score)].join(' ')}>{score}%</span>
        <p className={styles.scoreMessage}>{getScoreMessage(score)}</p>

        <div className={styles.statsRow}>
          <div className={[styles.statPill, styles.statPillDefault].join(' ')}>
            <Target size={16} strokeWidth={2} /> {totalQuestions} Total
          </div>
          <div className={[styles.statPill, styles.statPillCorrect].join(' ')}>
            <CheckCircle2 size={16} strokeWidth={2} /> {correctAnswers} Correct
          </div>
          <div className={[styles.statPill, styles.statPillWrong].join(' ')}>
            <XCircle size={16} strokeWidth={2} /> {incorrectAnswers} Incorrect
          </div>
        </div>
      </div>

      {/* Detailed Review */}
      <div>
        <div className={styles.reviewHeader}>
          <BookOpen size={20} strokeWidth={2} />
          <h3 className={styles.reviewTitle}>Detailed Review</h3>
        </div>

        <div className={styles.reviewList}>
          {detailedResults.map((result, index) => {
            const userAnswerIndex = result.options.findIndex(opt => opt === result.selectedAnswer);
            const correctAnswerIndex = result.correctAnswer.startsWith('O')
              ? parseInt(result.correctAnswer.substring(1)) - 1
              : result.options.findIndex(opt => opt === result.correctAnswer);
            const isCorrect = result.isCorrect;

            return (
              <div key={index} className={styles.reviewItem}>
                <div className={styles.reviewItemTop}>
                  <div className={styles.reviewItemLeft}>
                    <div className={styles.questionNumBadge}>Question {index + 1}</div>
                    <h4 className={styles.reviewQuestion}>{result.question}</h4>
                  </div>
                  <div className={[styles.resultIcon, isCorrect ? styles.resultIconCorrect : styles.resultIconWrong].join(' ')}>
                    {isCorrect
                      ? <CheckCircle2 size={20} strokeWidth={2.5} />
                      : <XCircle size={20} strokeWidth={2.5} />
                    }
                  </div>
                </div>

                <div className={styles.optionsList}>
                  {result.options.map((option, optIndex) => {
                    const isCorrectOption = optIndex === correctAnswerIndex;
                    const isUserAnswer = optIndex === userAnswerIndex;
                    const isWrongAnswer = isUserAnswer && !isCorrect;
                    const optClass = isCorrectOption ? styles.optionCorrect : isWrongAnswer ? styles.optionWrong : styles.optionDefault;
                    const textClass = isCorrectOption ? styles.optionResultTextCorrect : isWrongAnswer ? styles.optionResultTextWrong : styles.optionResultTextDefault;

                    return (
                      <div key={optIndex} className={[styles.optionResult, optClass].join(' ')}>
                        <span className={[styles.optionResultText, textClass].join(' ')}>{option}</span>
                        <div className={styles.optionTags}>
                          {isCorrectOption && (
                            <span className={[styles.optionTag, styles.tagCorrect].join(' ')}>
                              <CheckCircle2 size={12} strokeWidth={2.5} /> Correct
                            </span>
                          )}
                          {isWrongAnswer && (
                            <span className={[styles.optionTag, styles.tagWrong].join(' ')}>
                              <XCircle size={12} strokeWidth={2.5} /> Your Answer
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {result.explanation && (
                  <div className={styles.explanation}>
                    <div className={styles.explanationInner}>
                      <div className={styles.explanationIcon}><BookOpen size={16} strokeWidth={2} /></div>
                      <div>
                        <p className={styles.explanationLabel}>Explanation</p>
                        <p className={styles.explanationText}>{result.explanation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.returnWrap}>
        <Link to={`/documents/${quiz.document._id}`} className={styles.returnBtn}>
          <ArrowLeft size={16} strokeWidth={2.5} /> Return to Document
        </Link>
      </div>
    </div>
  );
};

export default QuizResultPage;
