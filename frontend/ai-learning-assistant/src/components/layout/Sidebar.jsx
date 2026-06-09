import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, FileText, User, LogOut, Brain, BookOpen, X } from "lucide-react";
import styles from './Sidebar.module.css';

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { to: '/dashboard', icon: LayoutDashboard, text: 'Dashboard' },
    { to: '/documents', icon: FileText, text: 'Documents' },
    { to: '/flashcards', icon: BookOpen, text: 'Flashcards' },
    { to: '/profile', icon: User, text: 'Profile' },
  ];

  return (
    <>
      <div
        className={[styles.overlay, isSidebarOpen ? styles.overlayVisible : styles.overlayHidden].join(' ')}
        onClick={toggleSidebar}
        aria-hidden="true"
      />

      <aside className={[styles.aside, isSidebarOpen ? styles.asideOpen : styles.asideClosed].join(' ')}>
        <div className={styles.logoRow}>
          <div className={styles.logoInner}>
            <div className={styles.logoIcon}>
              <Brain size={20} strokeWidth={2.5} />
            </div>
            <h1 className={styles.logoText}>AI Learning Assistant</h1>
          </div>
          <button onClick={toggleSidebar} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={toggleSidebar}
              className={({ isActive }) =>
                [styles.navLink, isActive ? styles.navLinkActive : ''].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <link.icon size={18} strokeWidth={2.5} />
                  {link.text}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={18} strokeWidth={2.5} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
