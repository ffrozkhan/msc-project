import React, { useState, useRef, useEffect } from "react";
import { Star } from "lucide-react";
import styles from "./Flashcard.module.css";

const Flashcard = ({ flashcard, onToggleStar, onReview }) => {
  const [phase, setPhase] = useState('question');
  const timeouts = useRef([]);

  // Define clearTimeouts first before useEffect
  const clearTimeouts = () => timeouts.current.forEach(clearTimeout);

  // Reset card when flashcard changes
  useEffect(() => {
    timeouts.current.forEach(clearTimeout);
    setPhase('question');
  }, [flashcard._id]);

  const pour = () => {
    setPhase('pouring');
    const t = setTimeout(() => setPhase('answer'), 600);
    timeouts.current.push(t);
  };

  const drain = () => {
    setPhase('draining');
    const t = setTimeout(() => setPhase('question'), 600);
    timeouts.current.push(t);
  };

  const handleCardClick = () => {
    if (phase === 'question') pour();
    else if (phase === 'answer') drain();
  };

  const handleRate = (e, quality) => {
    e.stopPropagation();
    clearTimeouts();
    onReview(flashcard._id, quality);
    setPhase('question');
  };

  const isPouring   = phase === 'pouring';
  const isDraining  = phase === 'draining';
  const showAnswer  = phase === 'answer' || phase === 'draining';
  const showQuestion = phase === 'question' || phase === 'pouring';

  return (
    <div className={styles.cardWrap} onClick={handleCardClick}>

      <div className={[
        styles.liquidOverlay,
        isPouring  ? styles.liquidPour  : '',
        isDraining ? styles.liquidDrain : '',
        showAnswer && !isDraining ? styles.liquidFull : '',
      ].join(' ')} />

      {/* Question face */}
      <div className={[
        styles.face,
        styles.questionFace,
        !showQuestion ? styles.faceHidden : '',
      ].join(' ')}>
        <div className={styles.faceTop}>
          <div className={styles.difficultyBadge}>{flashcard?.difficulty}</div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleStar(flashcard._id); }}
            className={[styles.starBtn, flashcard.isStarred ? styles.starActive : styles.starInactive].join(' ')}
          >
            <Star size={16} strokeWidth={2} fill={flashcard.isStarred ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className={styles.faceBody}>
          <p className={styles.questionLabel}>Question</p>
          <p className={styles.questionText}>{flashcard.question}</p>
        </div>
        <p className={styles.hint}>Click to reveal answer</p>
      </div>

      {/* Answer face */}
      <div className={[
        styles.face,
        styles.answerFace,
        showAnswer ? styles.faceVisible : '',
      ].join(' ')}>
        <div className={styles.faceBody}>
          <p className={styles.answerLabel}>Answer</p>
          <p className={styles.answerText}>{flashcard.answer}</p>
        </div>
        <p className={styles.hint} style={{ color: 'rgba(255,255,255,0.4)' }}>
          Click card to go back
        </p>
        <div className={styles.ratingRow} onClick={e => e.stopPropagation()}>
          <button className={[styles.rateBtn, styles.rateAgain].join(' ')} onClick={(e) => handleRate(e, 0)}>
            Again<span>Forgot</span>
          </button>
          <button className={[styles.rateBtn, styles.rateHard].join(' ')} onClick={(e) => handleRate(e, 3)}>
            Hard<span>Struggled</span>
          </button>
          <button className={[styles.rateBtn, styles.rateGood].join(' ')} onClick={(e) => handleRate(e, 4)}>
            Good<span>Recalled</span>
          </button>
          <button className={[styles.rateBtn, styles.rateEasy].join(' ')} onClick={(e) => handleRate(e, 5)}>
            Easy<span>Perfect</span>
          </button>
        </div>
        {flashcard.interval > 1 && (
          <p className={styles.nextReview}>Next review in {flashcard.interval}d</p>
        )}
      </div>

    </div>
  );
};

export default Flashcard;