import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Sparkles, TrendingUp } from "lucide-react";
import moment from "moment";
import styles from "./FlashcardSetCard.module.css";

const FlashcardSetCard = ({ flashcardSet }) => {
  const navigate = useNavigate();

  const handleStudyNow = () => {
    navigate(`/documents/${flashcardSet.documentId._id}/flashcards`);
  };

  const reviewedCount = flashcardSet.cards.filter(card => card.lastReviewed).length;
  const totalCards = flashcardSet.cards.length;
  const progressPercentage = totalCards > 0 ? Math.round((reviewedCount / totalCards) * 100) : 0;

  return (
    <div className={styles.card} onClick={handleStudyNow}>
      <div className={styles.cardBody}>
        <div className={styles.titleRow}>
          <div className={styles.iconWrap}>
            <BookOpen size={24} strokeWidth={2} />
          </div>
          <div className={styles.titleInfo}>
            <h3 className={styles.title} title={flashcardSet?.documentId?.title}>
              {flashcardSet?.documentId?.title}
            </h3>
            <p className={styles.date}>Created {moment(flashcardSet.createdAt).fromNow()}</p>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statPill}>
            {totalCards} {totalCards === 1 ? 'Card' : 'Cards'}
          </div>
          {reviewedCount > 0 && (
            <div className={styles.progressPill}>
              <TrendingUp size={14} strokeWidth={2.5} />
              {progressPercentage}%
            </div>
          )}
        </div>

        {totalCards > 0 && (
          <div className={styles.progressSection}>
            <div className={styles.progressLabels}>
              <span className={styles.progressLabel}>Progress</span>
              <span className={styles.progressValue}>{reviewedCount}/{totalCards} reviewed</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <button
          onClick={(e) => { e.stopPropagation(); handleStudyNow(); }}
          className={styles.studyBtn}
        >
          <Sparkles size={16} strokeWidth={2.5} />
          Study Now
        </button>
      </div>
    </div>
  );
};

export default FlashcardSetCard;
