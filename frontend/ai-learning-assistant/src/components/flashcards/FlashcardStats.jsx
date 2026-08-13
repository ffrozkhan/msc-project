import React, { useState, useEffect, useRef } from 'react';
import { Brain, Calendar, TrendingUp, Zap } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import styles from './FlashcardStats.module.css';

const FlashcardStats = ({ sets, onStartReview }) => {
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const retentionRef = useRef(null);
  const calendarRef  = useRef(null);
  const intervalRef  = useRef(null);
  const streakRef    = useRef(null);

  // Default to first set on load
  useEffect(() => {
    if (sets?.length > 0 && !selectedSetId) {
      setSelectedSetId(sets[0]._id);
    }
  }, [sets]);

  // Fetch stats when selected set changes
  useEffect(() => {
    if (!selectedSetId) return;
    setLoading(true);
    setStats(null);
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get(
          API_PATHS.PROGRESS.GET_FLASHCARD_STATS(selectedSetId)
        );
        setStats(res.data.data);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedSetId]);

  // Draw charts when stats change
  useEffect(() => {
    if (!stats) return;
    setTimeout(() => {
      drawRetention();
      drawCalendar();
      drawIntervals();
      drawStreak();
    }, 50);
  }, [stats]);

  const isDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

  const COLORS = {
    danger:  '#e11d48',
    warning: '#d97706',
    accent:  '#3b82f6',
    success: '#059669',
    text:    isDark() ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
    grid:    isDark() ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    surface: isDark() ? '#2a2a2a' : '#f0f0f0',
  };

  const setup = (ref) => {
    const c = ref.current;
    if (!c) return null;
    const dpr = window.devicePixelRatio || 1;
    c.width  = c.offsetWidth  * dpr;
    c.height = c.offsetHeight * dpr;
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, W: c.offsetWidth, H: c.offsetHeight };
  };

  const drawRetention = () => {
    const s = setup(retentionRef);
    if (!s) return;
    const { ctx, W, H } = s;
    const pad = { l: 28, r: 8, t: 8, b: 22 };
    const iW = W - pad.l - pad.r;
    const iH = H - pad.t - pad.b;
    const ef = stats.avgEF || 2.5;
    const totalDays = 50;
    const reviews = [0, 1, 6, Math.round(6 * ef), Math.round(6 * ef * ef)];
    const segColors = [COLORS.danger, COLORS.warning, COLORS.accent, COLORS.success, COLORS.success];

    // Grid
    ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 0.5;
    [0, 25, 50, 75, 100].forEach((pct, i) => {
      const y = pad.t + iH * (1 - i / 4);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + iW, y); ctx.stroke();
      ctx.fillStyle = COLORS.text; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(pct + '%', pad.l - 3, y + 3);
    });

    // Curves
    reviews.forEach((rDay, seg) => {
      if (rDay > totalDays) return;
      const nextR = reviews[seg + 1] ?? totalDays + 5;
      ctx.strokeStyle = segColors[seg]; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let d = rDay; d <= Math.min(nextR, totalDays); d++) {
        const decay = Math.exp(-(d - rDay) * (0.08 / ef));
        const x = pad.l + (d / totalDays) * iW;
        const y = pad.t + iH * (1 - Math.max(0, Math.min(1, decay)));
        d === rDay ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      const decay0 = seg === 0 ? 1 : Math.exp(-((rDay - reviews[seg - 1]) * (0.08 / ef)));
      ctx.fillStyle = segColors[seg];
      ctx.beginPath();
      ctx.arc(
        pad.l + (rDay / totalDays) * iW,
        pad.t + iH * (1 - Math.max(0, Math.min(1, decay0))),
        3.5, 0, Math.PI * 2
      );
      ctx.fill();
    });

    ctx.fillStyle = COLORS.text; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Days since last review →', pad.l + iW / 2, H - 4);
  };

  const drawCalendar = () => {
    const s = setup(calendarRef);
    if (!s) return;
    const { ctx, W, H } = s;
    const pad = { l: 8, r: 8, t: 8, b: 22 };
    const iW = W - pad.l - pad.r;
    const iH = H - pad.t - pad.b;
    const data = stats.next30Days || [];
    const max  = Math.max(...data, 1);
    const bW   = iW / 30 - 1;

    data.forEach((count, i) => {
      const x   = pad.l + i * (iW / 30);
      const bH  = (count / max) * iH;
      const y   = pad.t + iH - bH;
      const col = i === 0 ? COLORS.danger : count > max * 0.6 ? COLORS.warning : COLORS.accent;
      ctx.fillStyle = col + (i === 0 ? 'ff' : '99');
      if (bH > 0) {
        ctx.beginPath();
        ctx.roundRect(x, y, bW, bH, 2);
        ctx.fill();
      } else {
        ctx.fillStyle = COLORS.grid;
        ctx.fillRect(x, pad.t + iH - 2, bW, 2);
      }
    });

    ctx.fillStyle = COLORS.text; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
    ['Today', 'Week 2', 'Week 3', 'Week 4'].forEach((l, i) => {
      ctx.fillText(l, pad.l + (i / 3) * iW, H - 4);
    });
  };

  const drawIntervals = () => {
    const s = setup(intervalRef);
    if (!s) return;
    const { ctx, W, H } = s;
    const pad = { l: 28, r: 8, t: 8, b: 22 };
    const iW = W - pad.l - pad.r;
    const iH = H - pad.t - pad.b;
    const ib = stats.intervalBuckets;
    const buckets = [
      { label: '1d',   count: ib.oneDay,        col: COLORS.danger  },
      { label: '2-6d', count: ib.twotoSix,      col: COLORS.warning },
      { label: '1-2w', count: ib.oneToTwo,      col: COLORS.accent  },
      { label: '3-4w', count: ib.threeToFour,   col: COLORS.success },
      { label: '1m+',  count: ib.oneMonthPlus,  col: COLORS.success },
    ];
    const max = Math.max(...buckets.map(b => b.count), 1);
    const bW  = iW / buckets.length - 6;

    buckets.forEach((b, i) => {
      const x  = pad.l + i * (iW / buckets.length) + 3;
      const bH = (b.count / max) * iH;
      const y  = pad.t + iH - bH;
      ctx.fillStyle = b.col + 'cc';
      if (bH > 0) {
        ctx.beginPath(); ctx.roundRect(x, y, bW, bH, 3); ctx.fill();
      }
      ctx.fillStyle = COLORS.text; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(b.label, x + bW / 2, H - 4);
      if (b.count > 0) {
        ctx.fillStyle = isDark() ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';
        ctx.fillText(b.count, x + bW / 2, y - 2);
      }
    });
  };

  const drawStreak = () => {
    const s = setup(streakRef);
    if (!s) return;
    const { ctx, W, H } = s;
    const streak = stats.streak || [];
    const cellW  = (W - 20) / 30;

    streak.forEach((active, i) => {
      const x = 10 + i * cellW;
      ctx.fillStyle = active ? COLORS.accent + (i >= 23 ? 'ff' : '88') : COLORS.surface;
      ctx.beginPath(); ctx.roundRect(x, 4, cellW - 2, H - 12, 3); ctx.fill();
    });

    ctx.fillStyle = COLORS.text; ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';  ctx.fillText('30 days ago', 10, H - 1);
    ctx.textAlign = 'right'; ctx.fillText('Today', W - 10, H - 1);
  };

  const currentStreak = (() => {
    if (!stats?.streak) return 0;
    let count = 0;
    for (let i = stats.streak.length - 1; i >= 0; i--) {
      if (stats.streak[i]) count++;
      else break;
    }
    return count;
  })();

  // No sets at all
  if (!sets || sets.length === 0) {
    return (
      <div className={styles.empty}>
        No flashcard sets found. Generate flashcards from a document first.
      </div>
    );
  }

  return (
    <div className={styles.container}>

      {/* Set selector */}
      {sets.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-slate-500)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
            Viewing stats for
          </label>
          <select
            value={selectedSetId || ''}
            onChange={(e) => setSelectedSetId(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-slate-200)',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              background: '#fff',
              color: 'var(--color-slate-900)',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            {sets.map((s, i) => (
              <option key={s._id} value={s._id}>
                Flashcard Set {i + 1} — {s.cards.length} cards
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className={styles.loading}>Loading stats...</div>
      )}

      {/* No stats yet */}
      {!loading && !stats && (
        <div className={styles.empty}>
          No review data yet for this set. Start reviewing cards to see your progress.
        </div>
      )}

      {/* Stats */}
      {!loading && stats && (
        <>
          {/* Header */}
          <div className={styles.header}>
            <div>
              <h3 className={styles.title}>Flashcard Progress</h3>
              <p className={styles.subtitle}>{stats.total} cards in this set</p>
            </div>
            {stats.dueToday > 0 && (
              <button
                className={styles.reviewBtn}
                onClick={() => onStartReview(sets.find(s => s._id === selectedSetId))}
              >
                Start Review ({stats.dueToday} due)
              </button>
            )}
          </div>

          {/* Stat cards */}
          <div className={styles.statGrid}>
            <div className={[styles.statCard, styles.statDanger].join(' ')}>
              <div className={styles.statLabel}>Due today</div>
              <div className={styles.statVal}>{stats.dueToday}</div>
              <div className={styles.statSub}>cards to review</div>
            </div>
            <div className={[styles.statCard, styles.statWarning].join(' ')}>
              <div className={styles.statLabel}>Due this week</div>
              <div className={styles.statVal}>{stats.dueThisWeek}</div>
              <div className={styles.statSub}>upcoming</div>
            </div>
            <div className={[styles.statCard, styles.statSuccess].join(' ')}>
              <div className={styles.statLabel}>Mastered</div>
              <div className={styles.statVal}>{stats.mastered}</div>
              <div className={styles.statSub}>interval &gt; 21d</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Avg interval</div>
              <div className={styles.statVal}>{stats.avgInterval}d</div>
              <div className={styles.statSub}>across all cards</div>
            </div>
          </div>

          {/* Charts row */}
          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <div className={styles.chartLabel}>
                <TrendingUp size={13} strokeWidth={2} /> Retention curve
              </div>
              <canvas ref={retentionRef} className={styles.canvas} />
            </div>
            <div className={styles.chartCard}>
              <div className={styles.chartLabel}>
                <Calendar size={13} strokeWidth={2} /> Upcoming reviews (30 days)
              </div>
              <canvas ref={calendarRef} className={styles.canvas} />
            </div>
          </div>

          {/* Difficulty + Interval */}
          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <div className={styles.chartLabel}>
                <Brain size={13} strokeWidth={2} /> Card difficulty
              </div>
              <div className={styles.efRows}>
                {[
                  { label: 'Struggling', sub: 'EF < 1.8',   count: stats.efBuckets.struggling, cls: styles.barDanger  },
                  { label: 'Learning',   sub: 'EF 1.8-2.4', count: stats.efBuckets.learning,   cls: styles.barWarning },
                  { label: 'Good',       sub: 'EF 2.4-2.8', count: stats.efBuckets.good,       cls: styles.barAccent  },
                  { label: 'Mastered',   sub: 'EF > 2.8',   count: stats.efBuckets.mastered,   cls: styles.barSuccess },
                ].map(row => (
                  <div key={row.label} className={styles.efRow}>
                    <div className={styles.efLeft}>
                      <span className={styles.efLabel}>{row.label}</span>
                      <span className={styles.efSub}>{row.sub}</span>
                    </div>
                    <div className={styles.efRight}>
                      <span className={styles.efCount}>{row.count}</span>
                      <div className={styles.efBar}>
                        <div
                          className={[styles.efFill, row.cls].join(' ')}
                          style={{ width: `${Math.round(((row.count || 0) / (stats.total || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.chartCard}>
              <div className={styles.chartLabel}>
                <Zap size={13} strokeWidth={2} /> Interval distribution
              </div>
              <canvas ref={intervalRef} className={styles.canvas} />
            </div>
          </div>

          {/* Streak */}
          <div className={styles.chartCard}>
            <div className={styles.chartLabel} style={{ justifyContent: 'space-between' }}>
              <span>Study streak</span>
              <span className={styles.streakCount}>
                {currentStreak > 0 ? `${currentStreak} day streak` : 'No active streak'}
              </span>
            </div>
            <canvas ref={streakRef} className={styles.streakCanvas} />
          </div>
        </>
      )}
    </div>
  );
};

export default FlashcardStats;
