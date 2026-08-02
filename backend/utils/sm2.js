/**
 * SM-2 Spaced Repetition Algorithm
 * q = quality of recall (0-5)
 * 0-2 = failed recall (reset)
 * 3   = hard (correct with difficulty)
 * 4   = good (correct with some hesitation)
 * 5   = easy (perfect recall)
 */
export const sm2 = (card, q) => {
  let { easeFactor = 2.5, interval = 1, repetitions = 0 } = card;

  if (q >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  );

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return { easeFactor, interval, repetitions, nextReview };
};