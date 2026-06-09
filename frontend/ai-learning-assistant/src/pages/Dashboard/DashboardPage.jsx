import React, { useState, useEffect } from 'react';
import Spinner from '../../components/common/Spinner';
import progressService from '../../services/progressService';
import toast from 'react-hot-toast';
import { FileText, BookOpen, Brain, TrendingUp, Clock } from 'lucide-react';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await progressService.getDashboardData();
        setDashboardData(data.data);
      } catch {
        toast.error('Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <Spinner />;

  if (!dashboardData || !dashboardData.overview) {
    return (
      <div className={styles.noData}>
        <div className={styles.noDataInner}>
          <div className={styles.noDataIcon}><TrendingUp size={32} /></div>
          <p className={styles.noDataText}>No dashboard data available.</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Documents', value: dashboardData.overview.totalDocuments, icon: FileText, gradient: styles.gradientBlue },
    { label: 'Total Flashcards', value: dashboardData.overview.totalFlashcards, icon: BookOpen, gradient: styles.gradientPurple },
    { label: 'Total Quizzes', value: dashboardData.overview.totalQuizzes, icon: Brain, gradient: styles.gradientEmerald },
  ];

  const activities = [
    ...(dashboardData.recentActivity?.documents || []).map(doc => ({
      id: doc._id, description: doc.title, timestamp: doc.lastAccessed,
      link: `/documents/${doc._id}`, type: 'document',
    })),
    ...(dashboardData.recentActivity?.quizzes || []).map(quiz => ({
      id: quiz._id, description: quiz.title, timestamp: quiz.lastAttempted,
      link: `/quizzes/${quiz._id}`, type: 'quiz',
    })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className={styles.page}>
      <div className={styles.dotPattern} />
      <div className={styles.inner}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>Track your learning progress and activity</p>
        </div>

        <div className={styles.statsGrid}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statCardTop}>
                <span className={styles.statLabel}>{stat.label}</span>
                <div className={[styles.statIcon, stat.gradient].join(' ')}>
                  <stat.icon size={20} strokeWidth={2} />
                </div>
              </div>
              <div className={styles.statValue}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className={styles.activityCard}>
          <div className={styles.activityHeader}>
            <div className={styles.activityIcon}><Clock size={20} strokeWidth={2} /></div>
            <h3 className={styles.activityTitle}>Recent Activity</h3>
          </div>

          {activities.length > 0 ? (
            <div className={styles.activityList}>
              {activities.map((activity, i) => (
                <div key={activity.id || i} className={styles.activityItem}>
                  <div className={styles.activityLeft}>
                    <div className={styles.activityRow}>
                      <div className={[styles.activityDot, activity.type === 'document' ? styles.dotDocument : styles.dotQuiz].join(' ')} />
                      <p className={styles.activityDesc}>
                        {activity.type === 'document' ? 'Accessed Document: ' : 'Attempted Quiz: '}
                        <span className={styles.activityDescSpan}>{activity.description}</span>
                      </p>
                    </div>
                    <p className={styles.activityTime}>{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                  {activity.link && (
                    <a href={activity.link} className={styles.activityLink}>View</a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.activityEmpty}>
              <div className={styles.activityEmptyIcon}><Clock size={32} /></div>
              <p className={styles.activityEmptyText}>No recent activity yet.</p>
              <p className={styles.activityEmptySubtext}>Start learning to see your progress here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
