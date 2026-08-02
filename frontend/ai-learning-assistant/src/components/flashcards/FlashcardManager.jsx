import React, { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight, Trash2, ArrowLeft, Sparkles, Brain } from "lucide-react";
import toast from "react-hot-toast";
import moment from "moment";
import flashcardService from "../../services/flashcardService";
import aiService from "../../services/aiService";
import Spinner from "../common/Spinner";
import Modal from "../common/Modal";
import Flashcard from "./Flashcard";
import styles from "./FlashcardManager.module.css";

const FlashcardManager = ({ documentId }) => {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [setToDelete, setSetToDelete] = useState(null);

  const fetchFlashcardSets = async () => {
    setLoading(true);
    try {
      const response = await flashcardService.getFlashcardsForDocument(documentId);
      setFlashcardSets(response.data);
    } catch {
      toast.error("Failed to fetch flashcard sets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) fetchFlashcardSets();
  }, [documentId]);

  const handleGenerateFlashcards = async () => {
    setGenerating(true);
    try {
      await aiService.generateFlashcards(documentId);
      toast.success("Flashcards generated successfully!");
      fetchFlashcardSets();
    } catch (error) {
      toast.error(error.message || "Failed to generate flashcards.");
    } finally {
      setGenerating(false);
    }
  };

  const handleNextCard = () => {
    if (selectedSet) {
      // handleReview(currentCardIndex);
      setCurrentCardIndex((prev) => (prev + 1) % selectedSet.cards.length);
    }
  };

  const handlePrevCard = () => {
    if (selectedSet) {
      // handleReview(currentCardIndex);
      setCurrentCardIndex((prev) => (prev - 1 + selectedSet.cards.length) % selectedSet.cards.length);
    }
  };

  // const handleReview = async (index) => {
  //   const card = selectedSet?.cards[currentCardIndex];
  //   if (!card) return;
  //   try {
  //     await flashcardService.reviewFlashcard(card._id, index);
  //   } catch {}
  // };

  const handleReview = async (cardId, quality) => {
  try {
    await flashcardService.reviewFlashcard(cardId, quality);
    // Move to next card
    setCurrentCardIndex((prev) => (prev + 1) % selectedSet.cards.length);
  } catch {
    toast.error('Failed to save review.');
  }
};

  const handleToggleStar = async (cardId) => {
    try {
      await flashcardService.toggleStar(cardId);
      const updatedSets = flashcardSets.map((set) => {
        if (set._id === selectedSet._id) {
          return { ...set, cards: set.cards.map((c) => c._id === cardId ? { ...c, isStarred: !c.isStarred } : c) };
        }
        return set;
      });
      setFlashcardSets(updatedSets);
      setSelectedSet(updatedSets.find((s) => s._id === selectedSet._id));
    } catch {
      toast.error("Failed to update star status.");
    }
  };


  const handleConfirmDelete = async () => {
    if (!setToDelete) return;
    setDeleting(true);
    try {
      await flashcardService.deleteFlashcardSet(setToDelete._id);
      toast.success("Flashcard set deleted successfully!");
      setIsDeleteModalOpen(false);
      setSetToDelete(null);
      fetchFlashcardSets();
    } catch (error) {
      toast.error(error.message || "Failed to delete flashcard set.");
    } finally {
      setDeleting(false);
    }
  };

  const renderFlashcardViewer = () => {
    const currentCard = selectedSet.cards[currentCardIndex];
    return (
      <div className={styles.viewerWrap}>
        <button onClick={() => setSelectedSet(null)} className={styles.backBtn}>
          <ArrowLeft size={16} strokeWidth={2} />
          Back to Sets
        </button>
        <div className={styles.cardCenter}>
          <div className={styles.cardMaxWidth}>
            <Flashcard flashcard={currentCard} onToggleStar={handleToggleStar} onReview={handleReview} />
          </div>
          <div className={styles.navControls}>
            <button onClick={handlePrevCard} disabled={selectedSet.cards.length <= 1} className={styles.navBtn}>
              <ChevronLeft size={16} strokeWidth={2.5} /> Previous
            </button>
            <div className={styles.cardCounter}>
              {currentCardIndex + 1} <span className={styles.cardCounterSep}>/</span> {selectedSet.cards.length}
            </div>
            <button onClick={handleNextCard} disabled={selectedSet.cards.length <= 1} className={styles.navBtn}>
              Next <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSetList = () => {
    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner /></div>;

    if (flashcardSets.length === 0) {
      return (
        <div className={styles.emptyWrap}>
          <div className={styles.emptyIcon}><Brain size={32} strokeWidth={2} /></div>
          <h3 className={styles.emptyTitle}>No Flashcards Yet</h3>
          <p className={styles.emptyDesc}>Generate flashcards from your document to start learning.</p>
          <button onClick={handleGenerateFlashcards} disabled={generating} className={styles.generateBtn}>
            {generating ? <><span className={styles.spinnerRing} /> Generating...</> : <><Sparkles size={16} strokeWidth={2} /> Generate Flashcards</>}
          </button>
        </div>
      );
    }

    return (
      <div>
        <div className={styles.setListHeader}>
          <div>
            <h3 className={styles.setListTitle}>Your Flashcard Sets</h3>
            <p className={styles.setListCount}>{flashcardSets.length} {flashcardSets.length === 1 ? "set" : "sets"} available</p>
          </div>
          <button onClick={handleGenerateFlashcards} disabled={generating} className={[styles.generateBtn, styles.generateBtnSm].join(' ')}>
            {generating ? <><span className={styles.spinnerRing} /> Generating...</> : <><Plus size={16} strokeWidth={2.5} /> Generate New Set</>}
          </button>
        </div>

        <div className={styles.grid}>
          {flashcardSets.map((set) => (
            <div key={set._id} onClick={() => { setSelectedSet(set); setCurrentCardIndex(0); }} className={styles.setCard}>
              <button onClick={(e) => { e.stopPropagation(); setSetToDelete(set); setIsDeleteModalOpen(true); }} className={styles.setCardDeleteBtn}>
                <Trash2 size={16} strokeWidth={2} />
              </button>
              <div className={styles.setCardIcon}><Brain size={24} strokeWidth={2} /></div>
              <h4 className={styles.setCardTitle}>Flashcard Set</h4>
              <p className={styles.setCardDate}>Created {moment(set.createdAt).format("MMM D, YYYY")}</p>
              <div className={styles.setCardStats}>
                <div className={styles.cardCountBadge}>{set.cards.length} {set.cards.length === 1 ? "card" : "cards"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={styles.container}>
        {selectedSet ? renderFlashcardViewer() : renderSetList()}
      </div>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Flashcard Set?">
        <p className={styles.deleteModalText}>
          Are you sure you want to delete this flashcard set? This action cannot be undone and all cards will be permanently removed.
        </p>
        <div className={styles.deleteModalActions}>
          <button onClick={() => setIsDeleteModalOpen(false)} disabled={deleting} className={styles.cancelBtn}>Cancel</button>
          <button onClick={handleConfirmDelete} disabled={deleting} className={styles.deleteConfirmBtn}>
            {deleting ? <><span className={styles.spinnerRing} /> Deleting...</> : "Delete Set"}
          </button>
        </div>
      </Modal>
    </>
  );
};

export default FlashcardManager;
