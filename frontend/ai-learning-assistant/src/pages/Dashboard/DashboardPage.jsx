import React, { useState, useEffect, useRef } from 'react';
import Spinner from '../../components/common/Spinner';
import progressService from '../../services/progressService';
import toast from 'react-hot-toast';
import { FileText, BookOpen, Brain, TrendingUp, Clock, Flame, Star, CheckCircle } from 'lucide-react';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const scoreRef    = useRef(null);
  const activityRef = useRef(null);

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

  useEffect(() => {
    if (dashboardData?.analytics) {
      setTimeout(() => {
        drawScoreChart();
        drawActivityChart();
      }, 50);
    }
  }, [dashboardData]);

  const isDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

  const setupCanvas = (ref) => {
    const c = ref.current;
    if (!c) return null;
    const dpr = window.devicePixelRatio || 1;
    c.width  = c.offsetWidth  * dpr;
    c.height = c.offsetHeight * dpr;
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, W: c.offsetWidth, H: c.offsetHeight };
  };

  const drawScoreChart = () => {
    const s = setupCanvas(scoreRef);
    if (!s) return;
    const { ctx, W, H } = s;
    const pad = { l: 30, r: 10, t: 10, b: 24 };
    const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
    const scores = dashboardData.analytics.scoreOverTime;
    if (scores.length === 0) {
      ctx.fillStyle = isDark() ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
      ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('No quiz attempts yet', W/2, H/2);
      return;
    }
    const vals = scores.map(s => s.score);
    const min = Math.max(0, Math.min(...vals) - 10);
    const max = 100;
    const gridCol  = isDark() ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textCol  = isDark() ? 'rgba(255,255,255,0.3)'  : 'rgba(0,0,0,0.3)';

    // Grid
    ctx.strokeStyle = gridCol; ctx.lineWidth = 0.5;
    [0, 25, 50, 75, 100].forEach((v, i) => {
      const y = pad.t + iH * (1 - (v - min) / (max - min));
      if (y < pad.t || y > pad.t + iH) return;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + iW, y); ctx.stroke();
      ctx.fillStyle = textCol; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(v + '%', pad.l - 3, y + 3);
    });

    // Area
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + iH);
    grad.addColorStop(0, 'rgba(99,102,241,0.25)');
    grad.addColorStop(1, 'rgba(99,102,241,0)');
    ctx.beginPath();
    vals.forEach((v, i) => {
      const x = pad.l + (i / (vals.length - 1 || 1)) * iW;
      const y = pad.t + iH * (1 - (v - min) / (max - min));
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.l + iW, pad.t + iH); ctx.lineTo(pad.l, pad.t + iH);
    ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

    // Line
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2;
    ctx.beginPath();
    vals.forEach((v, i) => {
      const x = pad.l + (i / (vals.length - 1 || 1)) * iW;
      const y = pad.t + iH * (1 - (v - min) / (max - min));
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots
    vals.forEach((v, i) => {
      const x = pad.l + (i / (vals.length - 1 || 1)) * iW;
      const y = pad.t + iH * (1 - (v - min) / (max - min));
      ctx.fillStyle = '#6366f1';
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
    });

    ctx.fillStyle = textCol; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Quiz attempts over time →', pad.l + iW / 2, H - 6);
  };

  const drawActivityChart = () => {
    const s = setupCanvas(activityRef);
    if (!s) return;
    const { ctx, W, H } = s;
    const days = dashboardData.analytics.activityDays || [];
    const cols = 10, rows = 3;
    const cw = (W - 20) / cols;
    const ch = (H - 30) / rows;
    const surfCol = isDark() ? '#2a2a2a' : '#f0f0f0';
    const textCol = isDark() ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';

    days.forEach((day, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = 10 + col * cw, y = 10 + row * ch;
      ctx.fillStyle = day.active ? '#6366f1' : surfCol;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, cw - 3, ch - 6, 4);
      ctx.fill();
    });

    ctx.fillStyle = textCol; ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';  ctx.fillText('30 days ago', 10, H - 4);
    ctx.textAlign = 'right'; ctx.fillText('Today', W - 10, H - 4);
  };

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

  const { overview, recentActivity, analytics } = dashboardData;

  const stats = [
    { label: 'Total Documents',  value: overview.totalDocuments,  icon: FileText,      gradient: styles.gradientBlue    },
    { label: 'Total Flashcards', value: overview.totalFlashcards, icon: BookOpen,      gradient: styles.gradientPurple  },
    { label: 'Total Quizzes',    value: overview.totalQuizzes,    icon: Brain,         gradient: styles.gradientEmerald },
    { label: 'Study Streak',     value: `${overview.studyStreak}d`, icon: Flame,       gradient: styles.gradientOrange  },
    { label: 'Avg Quiz Score',   value: `${overview.averageScore}%`, icon: TrendingUp, gradient: styles.gradientBlue    },
    { label: 'Cards Mastered',   value: overview.cardsMastered || 0, icon: Star,       gradient: styles.gradientPurple  },
    { label: 'Cards Due Today',  value: overview.globalCardsDue || 0, icon: CheckCircle, gradient: overview.globalCardsDue > 0 ? styles.gradientRed : styles.gradientEmerald },
  ];

  const activities = [
    ...(recentActivity?.documents || []).map(doc => ({
      id: doc._id, description: doc.title, timestamp: doc.lastAccessed,
      link: `/documents/${doc._id}`, type: 'document',
    })),
    ...(recentActivity?.quizzes || []).map(quiz => ({
      id: quiz._id, description: quiz.title, timestamp: quiz.lastAttempted,
      link: `/quizzes/${quiz._id}`, type: 'quiz',
    })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const getStatusClass = (status) => {
    if (status === 'on track')        return styles.statusOnTrack;
    if (status === 'needs attention') return styles.statusNeeds;
    if (status === 'good')            return styles.statusGood;
    return styles.statusNoData;
  };

  const getStatusLabel = (status) => {
    if (status === 'on track')        return 'On track';
    if (status === 'needs attention') return 'Needs attention';
    if (status === 'good')            return 'Good';
    return 'No data';
  };

  return (
    <div className={styles.page}>
      <div className={styles.dotPattern} />
      <div className={styles.inner}>

        {/* Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>Track your learning progress and activity</p>
        </div>

        {/* Stats grid */}
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

        {/* Analytics charts */}
        {analytics && (
          <div className={styles.analyticsGrid}>

            {/* Score over time */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div className={styles.chartTitle}>Quiz Score Over Time</div>
                <div className={styles.chartSub}>Your last {analytics.scoreOverTime.length} quiz attempts</div>
              </div>
              <canvas ref={scoreRef} className={styles.canvas} />
            </div>

            {/* Activity heatmap */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div className={styles.chartTitle}>Study Activity</div>
                <div className={styles.chartSub}>Last 30 days — reviews and quizzes</div>
              </div>
              <canvas ref={activityRef} className={styles.canvas} />
            </div>

          </div>
        )}

        {/* Document performance table */}
        {analytics?.docPerformance?.length > 0 && (
          <div className={styles.docTable}>
            <div className={styles.docTableHeader}>
              <h3 className={styles.docTableTitle}>Document Performance</h3>
            </div>
            <div className={styles.docTableHead}>
              <span>Document</span>
              <span>Avg Score</span>
              <span>Quizzes</span>
              <span>Cards Due</span>
              <span>Status</span>
            </div>
            {analytics.docPerformance.map((doc) => (
              <div key={doc.documentId} className={styles.docRow}>
                <div>
                  <div className={styles.docName}>{doc.title}</div>
                  <div className={styles.docSub}>{doc.totalCards} cards</div>
                </div>
                <div>
                  {doc.avgScore !== null
                    ? <span className={[styles.scoreBadge, doc.avgScore >= 75 ? styles.scoreHigh : doc.avgScore >= 60 ? styles.scoreMid : styles.scoreLow].join(' ')}>
                        {doc.avgScore}%
                      </span>
                    : <span className={styles.scoreNoData}>No quizzes</span>
                  }
                </div>
                <div className={styles.docQuizCount}>{doc.quizCount}</div>
                <div className={[styles.docCardsDue, doc.cardsDue > 0 ? styles.cardsDueRed : ''].join(' ')}>
                  {doc.cardsDue}
                </div>
                <div>
                  <span className={[styles.statusBadge, getStatusClass(doc.status)].join(' ')}>
                    {getStatusLabel(doc.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent activity */}
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