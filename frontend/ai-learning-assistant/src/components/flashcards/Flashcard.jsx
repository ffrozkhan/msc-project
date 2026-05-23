import { useState } from "react";
import { Star, RotateCcw } from "lucide-react";
import styles from "./Flashcard.module.css";

const Flashcard = ({ flashcard, onToggleStar }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className={styles.cardWrap}>
      <div
        className={[styles.cardInner, isFlipped ? styles.cardFlipped : ''].join(' ')}
        onClick={() => setIsFlipped(!isFlipped)}
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
        <div className={[styles.face, styles.back].join(' ')}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleStar(flashcard._id); }}
              className={[styles.starBtnBack, flashcard.isStarred ? styles.starBtnBackActive : styles.starBtnBackInactive].join(' ')}
            >
              <Star size={16} strokeWidth={2} fill={flashcard.isStarred ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div className={styles.faceBody}>
            <p className={styles.answer}>{flashcard.answer}</p>
          </div>
          <div className={[styles.flipHint, styles.flipHintBack].join(' ')}>
            <RotateCcw size={14} strokeWidth={2} />
            <span>Click to see question</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
