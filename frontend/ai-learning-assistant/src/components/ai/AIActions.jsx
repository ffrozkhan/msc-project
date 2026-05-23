import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Sparkles, BookOpen, Lightbulb } from "lucide-react";
import aiService from "../../services/aiService";
import toast from "react-hot-toast";
import MarkdownRenderer from "../common/MarkdownRenderer";
import Modal from "../common/Modal";
import styles from "./AIActions.module.css";

const AIActions = () => {
  const { id: documentId } = useParams();
  const [loadingAction, setLoadingAction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [concept, setConcept] = useState("");

  const handleGenerateSummary = async () => {
    setLoadingAction("summary");
    try {
      const { summary } = await aiService.generateSummary(documentId);
      setModalTitle("Generated Summary");
      setModalContent(summary);
      setIsModalOpen(true);
    } catch {
      toast.error("Failed to generate summary.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExplainConcept = async (e) => {
    e.preventDefault();
    if (!concept.trim()) {
      toast.error("Please enter a concept to explain.");
      return;
    }
    setLoadingAction("explain");
    try {
      const { explanation } = await aiService.explainConcept(documentId, concept);
      setModalTitle(`Explanation of "${concept}"`);
      setModalContent(explanation);
      setIsModalOpen(true);
      setConcept("");
    } catch {
      toast.error("Failed to explain concept.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.headerIcon}>
              <Sparkles size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 className={styles.headerTitle}>AI Assistant</h3>
              <p className={styles.headerSub}>Powered by advanced AI</p>
            </div>
          </div>
        </div>

        <div className={styles.body}>
          {/* Generate Summary */}
          <div className={styles.section}>
            <div className={styles.sectionRow}>
              <div className={styles.sectionLeft}>
                <div className={styles.sectionIconRow}>
                  <div className={[styles.sectionIcon, styles.iconBlue].join(' ')}>
                    <BookOpen size={16} strokeWidth={2} />
                  </div>
                  <h4 className={styles.sectionTitle}>Generate Summary</h4>
                </div>
                <p className={styles.sectionDesc}>Get a concise summary of the entire document.</p>
              </div>
              <button
                onClick={handleGenerateSummary}
                disabled={loadingAction === "summary"}
                className={styles.actionBtn}
              >
                {loadingAction === "summary" ? (
                  <span className={styles.spinnerRow}>
                    <span className={styles.spinnerRing} /> Loading...
                  </span>
                ) : "Summarize"}
              </button>
            </div>
          </div>

          {/* Explain Concept */}
          <div className={styles.section}>
            <form onSubmit={handleExplainConcept} className={styles.explainForm}>
              <div className={styles.explainTitle}>
                <div className={[styles.sectionIcon, styles.iconAmber].join(' ')}>
                  <Lightbulb size={16} strokeWidth={2} />
                </div>
                <h4 className={styles.sectionTitle}>Explain a Concept</h4>
              </div>
              <p className={styles.explainDesc}>
                Enter a topic or concept from the document to get a detailed explanation.
              </p>
              <div className={styles.explainRow}>
                <input
                  type="text"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="e.g., 'React Hooks'"
                  className={styles.explainInput}
                  disabled={loadingAction === "explain"}
                />
                <button
                  type="submit"
                  disabled={loadingAction === "explain" || !concept.trim()}
                  className={styles.explainBtn}
                >
                  {loadingAction === "explain" ? (
                    <span className={styles.spinnerRow}>
                      <span className={styles.spinnerRing} /> Loading...
                    </span>
                  ) : "Explain"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        <div className={styles.modalScroll}>
          <MarkdownRenderer content={modalContent} />
        </div>
      </Modal>
    </>
  );
};

export default AIActions;
