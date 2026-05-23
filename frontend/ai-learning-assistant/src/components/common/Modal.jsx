import React from "react";
import { X } from "lucide-react";
import styles from "./Modal.module.css";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.centerer}>
        <div className={styles.backdrop} onClick={onClose} />
        <div className={styles.panel}>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} strokeWidth={2} />
          </button>
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
