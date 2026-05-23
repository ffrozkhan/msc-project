import React from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Trash2, BookOpen, BrainCircuit, Clock } from "lucide-react";
import moment from "moment";
import styles from "./DocumentCard.module.css";

const formatFileSize = (bytes) => {
  if (bytes === undefined || bytes === null) return "N/A";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const DocumentCard = ({ document, onDelete }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.card} onClick={() => navigate(`/documents/${document._id}`)}>
      <div className={styles.header}>
        <div className={styles.topRow}>
          <div className={styles.docIcon}>
            <FileText size={24} strokeWidth={2} />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(document); }}
            className={styles.deleteBtn}
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>

        <h3 className={styles.docTitle} title={document.title}>{document.title}</h3>

        {document.fileSize !== undefined && (
          <div className={styles.meta}>
            <span className={styles.metaValue}>{formatFileSize(document.fileSize)}</span>
          </div>
        )}

        <div className={styles.statsRow}>
          {document.flashcardCount !== undefined && (
            <div className={styles.flashcardBadge}>
              <BookOpen size={14} strokeWidth={2} />
              {document.flashcardCount} Flashcards
            </div>
          )}
          {document.quizCount !== undefined && (
            <div className={styles.quizBadge}>
              <BrainCircuit size={14} strokeWidth={2} />
              {document.quizCount} Quizzes
            </div>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <Clock size={14} strokeWidth={2} />
        <span>Uploaded {moment(document.createdAt).fromNow()}</span>
      </div>

      <div className={styles.hoverOverlay} />
    </div>
  );
};

export default DocumentCard;
