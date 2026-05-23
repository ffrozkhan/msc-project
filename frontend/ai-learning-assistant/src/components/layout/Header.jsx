import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Bell, User, Menu } from 'lucide-react';
import styles from './Header.module.css';

const Header = ({ toggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <button onClick={toggleSidebar} className={styles.menuBtn} aria-label="Toggle sidebar">
          <Menu size={24} />
        </button>

        <div className={styles.spacer} />

        <div className={styles.actions}>
          <button className={styles.bellBtn}>
            <Bell size={20} strokeWidth={2} />
            <span className={styles.bellDot} />
          </button>

          <div className={styles.profile}>
            <div className={styles.profileInner}>
              <div className={styles.avatar}>
                <User size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className={styles.profileName}>{user?.username || 'User'}</p>
                <p className={styles.profileEmail}>{user?.email || 'user@example.com'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
