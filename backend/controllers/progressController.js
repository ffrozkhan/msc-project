import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import ReviewHistory from '../models/ReviewHistory.js';

// @desc    Get user learning statistics
// @route   GET /api/progress/dashboard
// @access  Private
// export const getDashboard = async (req, res, next) => {
//   try {
//     const userId = req.user._id;

//     // Get counts
//     const totalDocuments = await Document.countDocuments({ userId });
//     const totalFlashcardSets = await Flashcard.countDocuments({ userId });
//     const totalQuizzes = await Quiz.countDocuments({ userId });
//     const completedQuizzes = await Quiz.countDocuments({ userId, completedAt: { $ne: null } });

//     // Get flashcard statistics
//     const flashcardSets = await Flashcard.find({ userId });
//     let totalFlashcards = 0;
//     let reviewedFlashcards = 0;
//     let starredFlashcards = 0;

//     flashcardSets.forEach(set => {
//       totalFlashcards += set.cards.length;
//       reviewedFlashcards += set.cards.filter(c => c.reviewCount > 0).length;
//       starredFlashcards += set.cards.filter(c => c.isStarred).length;
//     });

//     // Get quiz statistics
//     const quizzes = await Quiz.find({ userId, completedAt: { $ne: null } });
//     const averageScore = quizzes.length > 0
//       ? Math.round(quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length)
//       : 0;

//     // Recent activity
//     const recentDocuments = await Document.find({ userId })
//       .sort({ lastAccessed: -1 })
//       .limit(5)
//       .select('title fileName lastAccessed status');

//     const recentQuizzes = await Quiz.find({ userId })
//       .sort({ createdAt: -1 })
//       .limit(5)
//       .populate('documentId', 'title')
//       .select('title score totalQuestions completedAt');

//     // Study streak (simplified - in production, track daily activity)
//     const studyStreak = Math.floor(Math.random() * 7) + 1; // Mock data

//     res.status(200).json({
//       success: true,
//       data: {
//         overview: {
//           totalDocuments,
//           totalFlashcardSets,
//           totalFlashcards,
//           reviewedFlashcards,
//           starredFlashcards,
//           totalQuizzes,
//           completedQuizzes,
//           averageScore,
//           studyStreak
//         },
//         recentActivity: {
//           documents: recentDocuments,
//           quizzes: recentQuizzes
//         }
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get all existing document IDs for this user
    const existingDocIds = await Document.distinct('_id', { userId });

    // Get counts
    const totalDocuments = await Document.countDocuments({ userId });
    const totalQuizzes   = await Quiz.countDocuments({ userId });
    const completedQuizzes = await Quiz.countDocuments({ userId, completedAt: { $ne: null } });

    // Only count flashcard sets for documents that still exist
    const flashcardSets = await Flashcard.find({
      userId,
      documentId: { $in: existingDocIds }
    });

    console.log('existingDocIds:', existingDocIds);
    console.log('flashcardSets count:', flashcardSets.length);
    console.log('sets breakdown:', flashcardSets.map(s => ({ id: s._id, docId: s.documentId, cards: s.cards.length })));

    const totalFlashcardSets = flashcardSets.length;

    let totalFlashcards    = 0;
    let reviewedFlashcards = 0;
    let starredFlashcards  = 0;

    flashcardSets.forEach(set => {
      totalFlashcards    += set.cards.length;
      reviewedFlashcards += set.cards.filter(c => c.reviewCount > 0).length;
      starredFlashcards  += set.cards.filter(c => c.isStarred).length;
    });

    // Quiz statistics
    const quizzes = await Quiz.find({ userId, completedAt: { $ne: null } });
    const averageScore = quizzes.length > 0
      ? Math.round(quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length)
      : 0;

    // Recent activity
    const recentDocuments = await Document.find({ userId })
      .sort({ lastAccessed: -1 })
      .limit(5)
      .select('title fileName lastAccessed status');

    const recentQuizzes = await Quiz.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('documentId', 'title')
      .select('title score totalQuestions completedAt');

    // Real study streak from ReviewHistory
    let studyStreak = 0;
    try {
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const day = new Date(today);
        day.setDate(day.getDate() - i);
        const dayStart = new Date(new Date(day).setHours(0, 0, 0, 0));
        const dayEnd   = new Date(new Date(day).setHours(23, 59, 59, 999));
        const reviewed = await ReviewHistory.findOne({
          userId,
          reviewedAt: { $gte: dayStart, $lte: dayEnd }
        });
        if (reviewed) studyStreak++;
        else break;
      }
    } catch {}

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalDocuments,
          totalFlashcardSets,
          totalFlashcards,
          reviewedFlashcards,
          starredFlashcards,
          totalQuizzes,
          completedQuizzes,
          averageScore,
          studyStreak
        },
        recentActivity: {
          documents: recentDocuments,
          quizzes:   recentQuizzes
        }
      }
    });
  } catch (error) {
    next(error);
  }
};


// GET /api/progress/flashcard-stats/:documentId
// export const getFlashcardStats = async (req, res) => {
//   try {
//     const set = await Flashcard.findOne({
//       documentId: req.params.documentId,
//       userId: req.user._id
//     });

//     if (!set) {
//       return res.status(404).json({ success: false, message: 'No flashcard set found' });
//     }

//     const now = new Date();
//     const cards = set.cards;

//     // Due today
//     const dueToday = cards.filter(c =>
//       !c.nextReview || new Date(c.nextReview) <= now
//     ).length;

//     // Due next 30 days — one count per day
//     const next30 = Array.from({ length: 30 }, (_, i) => {
//       const day = new Date();
//       day.setDate(day.getDate() + i);
//       const dayStart = new Date(day.setHours(0, 0, 0, 0));
//       const dayEnd   = new Date(day.setHours(23, 59, 59, 999));
//       return cards.filter(c =>
//         c.nextReview &&
//         new Date(c.nextReview) >= dayStart &&
//         new Date(c.nextReview) <= dayEnd
//       ).length;
//     });

//     // Mastered — interval > 21 days
//     const mastered = cards.filter(c => (c.interval || 1) > 21).length;

//     // Average interval
//     const avgInterval = cards.length > 0
//       ? Math.round(cards.reduce((sum, c) => sum + (c.interval || 1), 0) / cards.length * 10) / 10
//       : 1;

//     // Ease factor buckets
//     const efBuckets = {
//       struggling: cards.filter(c => (c.easeFactor || 2.5) < 1.8).length,
//       learning:   cards.filter(c => (c.easeFactor || 2.5) >= 1.8 && (c.easeFactor || 2.5) < 2.4).length,
//       good:       cards.filter(c => (c.easeFactor || 2.5) >= 2.4 && (c.easeFactor || 2.5) < 2.8).length,
//       mastered:   cards.filter(c => (c.easeFactor || 2.5) >= 2.8).length,
//     };

//     // Interval distribution buckets
//     const intervalBuckets = {
//       oneDay:    cards.filter(c => (c.interval || 1) === 1).length,
//       twotoSix:  cards.filter(c => (c.interval || 1) >= 2  && (c.interval || 1) <= 6).length,
//       oneToTwo:  cards.filter(c => (c.interval || 1) >= 7  && (c.interval || 1) <= 14).length,
//       threeToFour: cards.filter(c => (c.interval || 1) >= 15 && (c.interval || 1) <= 30).length,
//       oneMonthPlus: cards.filter(c => (c.interval || 1) > 30).length,
//     };

//     // Study streak — days with at least one review in last 30 days
//     const streak = Array.from({ length: 30 }, (_, i) => {
//       const day = new Date();
//       day.setDate(day.getDate() - i);
//       const dayStart = new Date(day.setHours(0, 0, 0, 0));
//       const dayEnd   = new Date(day.setHours(23, 59, 59, 999));
//       return cards.some(c =>
//         c.lastReviewed &&
//         new Date(c.lastReviewed) >= dayStart &&
//         new Date(c.lastReviewed) <= dayEnd
//       );
//     }).reverse();

//     // Average ease factor for retention curve
//     const avgEF = cards.length > 0
//       ? cards.reduce((sum, c) => sum + (c.easeFactor || 2.5), 0) / cards.length
//       : 2.5;

//     res.json({
//       success: true,
//       data: {
//         total: cards.length,
//         dueToday,
//         dueThisWeek: next30.slice(0, 7).reduce((a, b) => a + b, 0),
//         mastered,
//         avgInterval,
//         avgEF: Math.round(avgEF * 100) / 100,
//         next30Days: next30,
//         efBuckets,
//         intervalBuckets,
//         streak,
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// export const getFlashcardStats = async (req, res) => {
//   try {
//     const set = await Flashcard.findOne({
//       _id: req.params.setId,
//       userId: req.user._id
//     });

//     if (!set) {
//       return res.status(404).json({ success: false, message: 'No flashcard set found' });
//     }

//     const cards = set.cards;

//     const now = new Date();

//     // Due today
//     const dueToday = cards.filter(c =>
//       !c.nextReview || new Date(c.nextReview) <= now
//     ).length;

//     // Due next 30 days
//     const next30 = Array.from({ length: 30 }, (_, i) => {
//       const day = new Date();
//       day.setDate(day.getDate() + i);
//       const dayStart = new Date(new Date(day).setHours(0, 0, 0, 0));
//       const dayEnd   = new Date(new Date(day).setHours(23, 59, 59, 999));
//       return cards.filter(c =>
//         c.nextReview &&
//         new Date(c.nextReview) >= dayStart &&
//         new Date(c.nextReview) <= dayEnd
//       ).length;
//     });

//     // Mastered
//     const mastered = cards.filter(c => (c.interval || 1) > 21).length;

//     // Average interval
//     const avgInterval = cards.length > 0
//       ? Math.round(cards.reduce((sum, c) => sum + (c.interval || 1), 0) / cards.length * 10) / 10
//       : 1;

//     // Average ease factor
//     const avgEF = cards.length > 0
//       ? cards.reduce((sum, c) => sum + (c.easeFactor || 2.5), 0) / cards.length
//       : 2.5;

//     // Ease factor buckets
//     const efBuckets = {
//       struggling: cards.filter(c => (c.easeFactor || 2.5) < 1.8).length,
//       learning:   cards.filter(c => (c.easeFactor || 2.5) >= 1.8 && (c.easeFactor || 2.5) < 2.4).length,
//       good:       cards.filter(c => (c.easeFactor || 2.5) >= 2.4 && (c.easeFactor || 2.5) < 2.8).length,
//       mastered:   cards.filter(c => (c.easeFactor || 2.5) >= 2.8).length,
//     };

//     // Interval distribution
//     const intervalBuckets = {
//       oneDay:       cards.filter(c => (c.interval || 1) === 1).length,
//       twotoSix:     cards.filter(c => (c.interval || 1) >= 2  && (c.interval || 1) <= 6).length,
//       oneToTwo:     cards.filter(c => (c.interval || 1) >= 7  && (c.interval || 1) <= 14).length,
//       threeToFour:  cards.filter(c => (c.interval || 1) >= 15 && (c.interval || 1) <= 30).length,
//       oneMonthPlus: cards.filter(c => (c.interval || 1) > 30).length,
//     };

//     // Study streak
//     const streak = Array.from({ length: 30 }, (_, i) => {
//       const day = new Date();
//       day.setDate(day.getDate() - (29 - i));
//       const dayStart = new Date(new Date(day).setHours(0, 0, 0, 0));
//       const dayEnd   = new Date(new Date(day).setHours(23, 59, 59, 999));
//       return cards.some(c =>
//         c.lastReviewed &&
//         new Date(c.lastReviewed) >= dayStart &&
//         new Date(c.lastReviewed) <= dayEnd
//       );
//     });

//     res.json({
//       success: true,
//       data: {
//         total: cards.length,
//         totalSets: 1,
//         dueToday,
//         dueThisWeek: next30.slice(0, 7).reduce((a, b) => a + b, 0),
//         mastered,
//         avgInterval,
//         avgEF: Math.round(avgEF * 100) / 100,
//         next30Days: next30,
//         efBuckets,
//         intervalBuckets,
//         streak,
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

export const getFlashcardStats = async (req, res) => {
  try {
    const set = await Flashcard.findOne({
      _id: req.params.setId,
      userId: req.user._id
    });

    if (!set) {
      return res.status(404).json({ success: false, message: 'No flashcard set found' });
    }

    const cards = set.cards;
    const now = new Date();

    // Due today
    const dueToday = cards.filter(c =>
      !c.nextReview || new Date(c.nextReview) <= now
    ).length;

    // Due next 30 days
    const next30 = Array.from({ length: 30 }, (_, i) => {
      const day = new Date();
      day.setDate(day.getDate() + i);
      const dayStart = new Date(new Date(day).setHours(0, 0, 0, 0));
      const dayEnd   = new Date(new Date(day).setHours(23, 59, 59, 999));
      return cards.filter(c =>
        c.nextReview &&
        new Date(c.nextReview) >= dayStart &&
        new Date(c.nextReview) <= dayEnd
      ).length;
    });

    // Mastered
    const mastered = cards.filter(c => (c.interval || 1) > 21).length;

    // Average interval
    const avgInterval = cards.length > 0
      ? Math.round(cards.reduce((sum, c) => sum + (c.interval || 1), 0) / cards.length * 10) / 10
      : 1;

    // Ease factor buckets
    const efBuckets = {
      struggling: cards.filter(c => (c.easeFactor || 2.5) < 1.8).length,
      learning:   cards.filter(c => (c.easeFactor || 2.5) >= 1.8 && (c.easeFactor || 2.5) < 2.4).length,
      good:       cards.filter(c => (c.easeFactor || 2.5) >= 2.4 && (c.easeFactor || 2.5) < 2.8).length,
      mastered:   cards.filter(c => (c.easeFactor || 2.5) >= 2.8).length,
    };

    // Interval distribution
    const intervalBuckets = {
      oneDay:       cards.filter(c => (c.interval || 1) === 1).length,
      twotoSix:     cards.filter(c => (c.interval || 1) >= 2  && (c.interval || 1) <= 6).length,
      oneToTwo:     cards.filter(c => (c.interval || 1) >= 7  && (c.interval || 1) <= 14).length,
      threeToFour:  cards.filter(c => (c.interval || 1) >= 15 && (c.interval || 1) <= 30).length,
      oneMonthPlus: cards.filter(c => (c.interval || 1) > 30).length,
    };

    // Pull real review history for this set
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const recentReviews = await ReviewHistory.find({
      setId:      set._id,
      userId:     req.user._id,
      reviewedAt: { $gte: thirtyDaysAgo }
    }).sort({ reviewedAt: 1 });

    // Real streak from review history
    const streak = Array.from({ length: 30 }, (_, i) => {
      const day = new Date();
      day.setDate(day.getDate() - (29 - i));
      const dayStart = new Date(new Date(day).setHours(0, 0, 0, 0));
      const dayEnd   = new Date(new Date(day).setHours(23, 59, 59, 999));
      return recentReviews.some(r =>
        new Date(r.reviewedAt) >= dayStart &&
        new Date(r.reviewedAt) <= dayEnd
      );
    });

    // Real avgEF from review history, fallback to card values
    const realAvgEF = recentReviews.length > 0
      ? recentReviews.reduce((sum, r) => sum + r.easeFactor, 0) / recentReviews.length
      : cards.reduce((sum, c) => sum + (c.easeFactor || 2.5), 0) / (cards.length || 1);

    // Real review dates for retention curve
    const reviewDates = recentReviews.map(r => ({
      date:       r.reviewedAt,
      easeFactor: r.easeFactor,
      interval:   r.interval,
      quality:    r.quality,
    }));

    res.json({
      success: true,
      data: {
        total:        cards.length,
        totalSets:    1,
        dueToday,
        dueThisWeek:  next30.slice(0, 7).reduce((a, b) => a + b, 0),
        mastered,
        avgInterval,
        avgEF:        Math.round(realAvgEF * 100) / 100,
        next30Days:   next30,
        efBuckets,
        intervalBuckets,
        streak,
        reviewDates,
        totalReviews: recentReviews.length,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/progress/due-count
export const getGlobalDueCount = async (req, res) => {
  try {
    const sets = await Flashcard.find({ userId: req.user._id });
    const now  = new Date();

    let totalDue  = 0;
    let totalCards = 0;

    sets.forEach(set => {
      set.cards.forEach(card => {
        totalCards++;
        if (!card.nextReview || new Date(card.nextReview) <= now) {
          totalDue++;
        }
      });
    });

    res.json({
      success: true,
      data: { totalDue, totalCards, totalSets: sets.length }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};