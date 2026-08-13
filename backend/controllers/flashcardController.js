import Flashcard from '../models/Flashcard.js';
import { sm2 } from '../utils/sm2.js';
import ReviewHistory from '../models/ReviewHistory.js';

// @desc    Get all flashcards for a document
// @route   GET /api/flashcards/:documentId
// @access  Private

export const getFlashcards = async (req, res, next) => {
  try {
    const flashcards = await Flashcard.find({
      userId: req.user._id,
      documentId: req.params.documentId
    })
      .populate('documentId', 'title fileName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: flashcards.length,
      data: flashcards
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all flashcard sets for a user
// @route   GET /api/flashcards
// @access  Private
export const getAllFlashcardSets = async (req, res, next) => {
   try {
    const flashcardSets = await Flashcard.find({ userId: req.user._id })
      .populate('documentId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: flashcardSets.length,
      data: flashcardSets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark flashcard as reviewed
// @route   POST /api/flashcards/:cardId/review
// @access  Private
// export const reviewFlashcard = async (req, res, next) => {
//   try {
//     const flashcardSet = await Flashcard.findOne({
//       'cards._id': req.params.cardId,
//       userId: req.user._id
//     });

//     if (!flashcardSet) {
//       return res.status(404).json({
//         success: false,
//         error: 'Flashcard set or card not found',
//         statusCode: 404
//       });
//     }

//     const cardIndex = flashcardSet.cards.findIndex(card => card._id.toString() === req.params.cardId);

//     if (cardIndex === -1) {
//       return res.status(404).json({
//         success: false,
//         error: 'Card not found in set',
//         statusCode: 404
//       });
//     }

//     // Update review info
//     flashcardSet.cards[cardIndex].lastReviewed = new Date();
//     flashcardSet.cards[cardIndex].reviewCount += 1;

//     await flashcardSet.save();

//     res.status(200).json({
//       success: true,
//       data: flashcardSet,
//       message: 'Flashcard reviewed successfully'
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const reviewFlashcard = async (req, res) => {
//   try {
//     const { quality } = req.body; // 0, 3, 4, or 5

//     if (quality === undefined || quality < 0 || quality > 5) {
//       return res.status(400).json({ success: false, message: 'Quality must be 0-5' });
//     }

//     // Find the flashcard set containing this card
//     const set = await Flashcard.findOne({ 'cards._id': req.params.cardId });
//     if (!set) return res.status(404).json({ success: false, message: 'Card not found' });

//     const card = set.cards.id(req.params.cardId);
//     if (!card) return res.status(404).json({ success: false, message: 'Card not found' });

//     // Run SM-2
//     const result = sm2(card, quality);

//     card.easeFactor   = result.easeFactor;
//     card.interval     = result.interval;
//     card.repetitions  = result.repetitions;
//     card.nextReview   = result.nextReview;
//     card.lastReviewed = new Date();

//     await set.save();

//     res.json({ success: true, data: { card, sm2: result } });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

export const reviewFlashcard = async (req, res) => {
  try {
    const { quality } = req.body;

    if (quality === undefined || quality < 0 || quality > 5) {
      return res.status(400).json({ success: false, message: 'Quality must be 0-5' });
    }

    const set = await Flashcard.findOne({ 'cards._id': req.params.cardId });
    if (!set) return res.status(404).json({ success: false, message: 'Card not found' });

    const card = set.cards.id(req.params.cardId);
    if (!card) return res.status(404).json({ success: false, message: 'Card not found' });

    // Run SM-2
    const result = sm2(card, quality);

    card.easeFactor   = result.easeFactor;
    card.interval     = result.interval;
    card.repetitions  = result.repetitions;
    card.nextReview   = result.nextReview;
    card.lastReviewed = new Date();
    card.reviewCount  = (card.reviewCount || 0) + 1;

    await set.save();

    // Save review history record
    await ReviewHistory.create({
      userId:     req.user._id,
      cardId:     card._id,
      setId:      set._id,
      documentId: set.documentId,
      quality,
      easeFactor: result.easeFactor,
      interval:   result.interval,
      reviewedAt: new Date(),
    });

    res.json({ success: true, data: { card, sm2: result } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Toggle star/favorite on flashcard
// @route   PUT /api/flashcards/:cardId/star
// @access  Private
export const toggleStarFlashcard = async (req, res, next) => {
  try {
    const flashcardSet = await Flashcard.findOne({
      'cards._id': req.params.cardId,
      userId: req.user._id
    });

    if (!flashcardSet) {
      return res.status(404).json({
        success: false,
        error: 'Flashcard set or card not found',
        statusCode: 404
      });
    }

    const cardIndex = flashcardSet.cards.findIndex(card => card._id.toString() === req.params.cardId);

    if (cardIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Card not found in set',
        statusCode: 404
      });
    }

    // Toggle star
    flashcardSet.cards[cardIndex].isStarred = !flashcardSet.cards[cardIndex].isStarred;

    await flashcardSet.save();

    res.status(200).json({
      success: true,
      data: flashcardSet,
      message: `Flashcard ${flashcardSet.cards[cardIndex].isStarred ? 'starred' : 'unstarred'}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete flashcard set
// @route   DELETE /api/flashcards/:id
// @access  Private
export const deleteFlashcardSet = async (req, res, next) => {
  try {
    const flashcardSet = await Flashcard.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!flashcardSet) {
      return res.status(404).json({
        success: false,
        error: 'Flashcard set not found',
        statusCode: 404
      });
    }

    await flashcardSet.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Flashcard set deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/flashcards/due/:documentId
// export const getDueCards = async (req, res) => {
//   try {
//     const set = await Flashcard.findOne({
//       documentId: req.params.documentId,
//       userId: req.user._id
//     });

//     if (!set) return res.status(404).json({ success: false, message: 'No flashcard set found' });

//     const now = new Date();
//     const dueCards = set.cards.filter(card => !card.nextReview || new Date(card.nextReview) <= now);

//     res.json({
//       success: true,
//       data: {
//         due: dueCards,
//         total: set.cards.length,
//         dueCount: dueCards.length,
//         nextDue: set.cards
//           .filter(c => new Date(c.nextReview) > now)
//           .sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview))[0]?.nextReview || null
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

export const getDueCards = async (req, res) => {
  try {
    const sets = await Flashcard.find({
      documentId: req.params.documentId,
      userId:     req.user._id
    });

    if (!sets || sets.length === 0) {
      return res.status(404).json({ success: false, message: 'No flashcard sets found' });
    }

    const now = new Date();
    const dueCards = [];
    let totalCards = 0;
    let nextDue = null;

    sets.forEach(set => {
      set.cards.forEach(card => {
        totalCards++;
        if (!card.nextReview || new Date(card.nextReview) <= now) {
          dueCards.push({
            ...card.toObject(),
            setId: set._id,
          });
        } else {
          // Track the soonest upcoming card across all sets
          const reviewDate = new Date(card.nextReview);
          if (!nextDue || reviewDate < new Date(nextDue)) {
            nextDue = card.nextReview;
          }
        }
      });
    });

    res.json({
      success: true,
      data: {
        due:      dueCards,
        total:    totalCards,
        dueCount: dueCards.length,
        nextDue,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/flashcards/due/:documentId