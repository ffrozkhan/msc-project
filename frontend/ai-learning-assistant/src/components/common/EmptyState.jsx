import React from 'react';
import { FileText, Plus } from 'lucide-react';
import styles from './EmptyState.module.css';

const EmptyState = ({ onActionClick, title, description, buttonText }) => {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrap}>
        <FileText size={32} strokeWidth={2} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {buttonText && onActionClick && (
        <button onClick={onActionClick} className={styles.actionBtn}>
          <Plus size={16} strokeWidth={2.5} />
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
