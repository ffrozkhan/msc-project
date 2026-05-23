import React from 'react';
import { Link } from 'react-router-dom';
import { Play, BarChart2, Trash2, Award } from 'lucide-react';
import moment from 'moment';
import styles from './QuizCard.module.css';

const QuizCard = ({ quiz, onDelete }) => {
  return (
    <div className={styles.card}>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(quiz); }}
        className={styles.deleteBtn}
      >
        <Trash2 size={16} strokeWidth={2} />
      </button>

      <div className={styles.body}>
        <div className={styles.scoreBadge}>
          <Award size={14} strokeWidth={2.5} />
          Score: {quiz?.score}
        </div>

        <div className={styles.titleSection}>
          <h3 className={styles.title} title={quiz.title}>
            {quiz.title || `Quiz - ${moment(quiz.createdAt).format("MMM D, YYYY")}`}
          </h3>
          <p className={styles.date}>Created {moment(quiz.createdAt).format("MMM D, YYYY")}</p>
        </div>

        <div className={styles.infoRow}>
          <div className={styles.questionPill}>
            {quiz.questions.length} {quiz.questions.length === 1 ? "Question" : "Questions"}
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        {quiz?.userAnswers?.length > 0 ? (
          <Link to={`/quizzes/${quiz._id}/results`} style={{ display: 'block' }}>
            <button className={styles.resultsBtn}>
              <BarChart2 size={16} strokeWidth={2.5} />
              View Results
            </button>
          </Link>
        ) : (
          <Link to={`/quizzes/${quiz._id}`} style={{ display: 'block' }}>
            <button className={styles.startBtn}>
              <Play size={16} strokeWidth={2.5} />
              Start Quiz
            </button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default QuizCard;
