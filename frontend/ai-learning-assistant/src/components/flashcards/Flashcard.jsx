import React, { useState } from "react";
import { RotateCcw, Star } from "lucide-react";
import styles from "./Flashcard.module.css";

const Flashcard = ({ flashcard, onToggleStar, onReview }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleRate = (quality) => {
    onReview(flashcard._id, quality);
    setIsFlipped(false); // flip back, move to next card
  };

  return (
    <div className={styles.cardWrap}>
      <div
        className={[styles.cardInner, isFlipped ? styles.cardFlipped : ''].join(' ')}
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        {/* Front */}
        <div className={[styles.face, styles.front].join(' ')}>
          <div className={styles.faceTop}>
            <div className={styles.difficultyBadge}>{flashcard?.difficulty}</div>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleStar(flashcard._id); }}
              className={[styles.starBtnFront, flashcard.isStarred ? styles.starActive : styles.starInactive].join(' ')}
            >
              <Star size={16} strokeWidth={2} fill={flashcard.isStarred ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div className={styles.faceBody}>
            <p className={styles.question}>{flashcard.question}</p>
          </div>
          <div className={styles.flipHint}>
            <RotateCcw size={14} strokeWidth={2} />
            <span>Click to reveal answer</span>
          </div>
        </div>

        {/* Back */}
        <div className={[styles.face, styles.back].join(' ')} onClick={(e) => e.stopPropagation()}>
          <div className={styles.faceBody}>
            <p className={styles.answer}>{flashcard.answer}</p>
          </div>

          {/* SM-2 Rating buttons */}
          <div className={styles.ratingRow}>
            <button className={[styles.rateBtn, styles.rateAgain].join(' ')} onClick={() => handleRate(0)}>
              Again
              <span>Forgot</span>
            </button>
            <button className={[styles.rateBtn, styles.rateHard].join(' ')} onClick={() => handleRate(3)}>
              Hard
              <span>Struggled</span>
            </button>
            <button className={[styles.rateBtn, styles.rateGood].join(' ')} onClick={() => handleRate(4)}>
              Good
              <span>Recalled</span>
            </button>
            <button className={[styles.rateBtn, styles.rateEasy].join(' ')} onClick={() => handleRate(5)}>
              Easy
              <span>Perfect</span>
            </button>
          </div>

          {/* Next review info */}
          {flashcard.nextReview && (
            <div className={styles.nextReview}>
              Next review in {flashcard.interval || 1}d
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Flashcard;