import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Brain } from 'lucide-react';
import flashcardService from '../../services/flashcardService';
import Flashcard from './Flashcard';
import Spinner from '../common/Spinner';
import styles from './DueCardsSession.module.css';

const DueCardsSession = ({ documentId, onExit }) => {
  const [dueCards, setDueCards]     = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [completed, setCompleted]   = useState(false);
  const [reviewed, setReviewed]     = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await flashcardService.getDueCards(documentId);
        setDueCards(res.due || res.data?.due || []);
      } catch {
        setDueCards([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [documentId]);

  const handleReview = async (cardId, quality) => {
    try {
      await flashcardService.reviewFlashcard(cardId, quality);
      const next = currentIdx + 1;
      setReviewed(r => r + 1);
      if (next >= dueCards.length) {
        setCompleted(true);
      } else {
        setCurrentIdx(next);
      }
    } catch {}
  };

  const handleToggleStar = async (cardId) => {
    try {
      await flashcardService.toggleStar(cardId);
      setDueCards(prev =>
        prev.map(c => c._id === cardId ? { ...c, isStarred: !c.isStarred } : c)
      );
    } catch {}
  };

  if (loading) return (
    <div className={styles.center}><Spinner /></div>
  );

  if (dueCards.length === 0) return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}><CheckCircle size={40} strokeWidth={1.5} /></div>
      <h3 className={styles.emptyTitle}>All caught up!</h3>
      <p className={styles.emptyDesc}>No cards are due for review right now. Come back later.</p>
      <button className={styles.exitBtn} onClick={onExit}>Back to Sets</button>
    </div>
  );

  if (completed) return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon} style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
        <CheckCircle size={40} strokeWidth={1.5} color="#fff" />
      </div>
      <h3 className={styles.emptyTitle}>Session Complete!</h3>
      <p className={styles.emptyDesc}>
        You reviewed <strong>{reviewed}</strong> {reviewed === 1 ? 'card' : 'cards'}. Great work!
      </p>
      <div className={styles.completedStats}>
        <div className={styles.completedStat}>
          <span className={styles.completedStatVal}>{reviewed}</span>
          <span className={styles.completedStatLabel}>Reviewed</span>
        </div>
        <div className={styles.completedStat}>
          <span className={styles.completedStatVal}>0</span>
          <span className={styles.completedStatLabel}>Remaining</span>
        </div>
      </div>
      <button className={styles.exitBtn} onClick={onExit}>Back to Sets</button>
    </div>
  );

  const currentCard = dueCards[currentIdx];
  const progress = (currentIdx / dueCards.length) * 100;

  return (
    <div className={styles.session}>

      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onExit}>
          <ArrowLeft size={16} strokeWidth={2} /> Exit Session
        </button>
        <div className={styles.sessionInfo}>
          <span className={styles.sessionCount}>
            {currentIdx + 1} <span className={styles.sep}>/</span> {dueCards.length}
          </span>
          <span className={styles.sessionLabel}>due today</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressWrap}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.progressPct}>{Math.round(progress)}%</span>
      </div>

      {/* Card */}
      <div className={styles.cardWrap}>
        <Flashcard
          flashcard={currentCard}
          onToggleStar={handleToggleStar}
          onReview={handleReview}
        />
      </div>

    </div>
  );
};

export default DueCardsSession;