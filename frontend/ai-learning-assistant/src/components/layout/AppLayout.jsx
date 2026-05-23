import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import styles from './AppLayout.module.css';

const AppLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={styles.layout}>
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={styles.content}>
        <Header toggleSidebar={toggleSidebar} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
