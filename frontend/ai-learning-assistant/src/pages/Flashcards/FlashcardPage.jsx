import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import flashcardService from "../../services/flashcardService";
import aiService from "../../services/aiService";
import PageHeader from "../../components/common/PageHeader";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Flashcard from "../../components/flashcards/Flashcard";

const FlashcardPage = () => {
  const { id: documentId } = useParams();
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchFlashcards = async () => {
    setLoading(true);
    try {
      const response = await flashcardService.getFlashcardsForDocument(documentId);
      setFlashcardSets(response.data[0]);
      setFlashcards(response.data[0]?.cards || []);
    } catch {
      toast.error("Failed to fetch flashcards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFlashcards(); }, [documentId]);

  const handleGenerateFlashcards = async () => {
    setGenerating(true);
    try {
      await aiService.generateFlashcards(documentId);
      toast.success("Flashcards generated successfully!");
      fetchFlashcards();
    } catch (error) {
      toast.error(error.message || "Failed to generate flashcards.");
    } finally {
      setGenerating(false);
    }
  };

  const handleReview = async (cardId, quality) => {
  try {
    await flashcardService.reviewFlashcard(cardId, quality);
  } catch {}
};

  const handleNextCard = () => { handleReview(currentCardIndex); setCurrentCardIndex((p) => (p + 1) % flashcards.length); };
  const handlePrevCard = () => { handleReview(currentCardIndex); setCurrentCardIndex((p) => (p - 1 + flashcards.length) % flashcards.length); };

  const handleToggleStar = async (cardId) => {
    try {
      await flashcardService.toggleStar(cardId);
      setFlashcards((prev) => prev.map((c) => c._id === cardId ? { ...c, isStarred: !c.isStarred } : c));
    } catch {
      toast.error("Failed to update star status.");
    }
  };

  const handleDeleteFlashcardSet = async () => {
    setDeleting(true);
    try {
      await flashcardService.deleteFlashcardSet(flashcardSets._id);
      toast.success("Flashcard set deleted successfully!");
      setIsDeleteModalOpen(false);
      fetchFlashcards();
    } catch (error) {
      toast.error(error.message || "Failed to delete flashcard set.");
    } finally {
      setDeleting(false);
    }
  };

  const renderFlashcardContent = () => {
    if (loading) return <Spinner />;
    if (flashcards.length === 0) {
      return <EmptyState title="No Flashcards Yet" description="Generate flashcards from your document to start learning." />;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <div style={{ width: '100%', maxWidth: '448px' }}>
          <Flashcard flashcard={flashcards[currentCardIndex]} onToggleStar={handleToggleStar} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button onClick={handlePrevCard} variant="secondary" disabled={flashcards.length <= 1}>
            <ChevronLeft size={16} /> Previous
          </Button>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-neutral-600)' }}>
            {currentCardIndex + 1} / {flashcards.length}
          </span>
          <Button onClick={handleNextCard} variant="secondary" disabled={flashcards.length <= 1}>
            Next <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Link to={`/documents/${documentId}`} 
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--color-neutral-600)', textDecoration: 'none' }}
        >
          <ArrowLeft size={16} /> Back to Document
        </Link>
      </div>
      <PageHeader title="Flashcards">
        <div style={{ display: 'flex', gap: '8px' }}>
          {!loading && (
            flashcards.length > 0 ? (
              <Button onClick={() => setIsDeleteModalOpen(true)} disabled={deleting}>
                <Trash2 size={16} /> Delete Set
              </Button>
            ) : (
              <Button onClick={handleGenerateFlashcards} disabled={generating}>
                {generating ? <Spinner /> : <><Plus size={16} /> Generate Flashcards</>}
              </Button>
            )
          )}
        </div>
      </PageHeader>

      {renderFlashcardContent()}

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete Flashcard Set">
        <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-600)', marginBottom: '16px' }}>
          Are you sure you want to delete all flashcards for this document? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
          <Button type="button" variant="secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={deleting}>Cancel</Button>
          <Button onClick={handleDeleteFlashcardSet} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default FlashcardPage;
