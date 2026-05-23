import React from "react";
import styles from "./Tabs.module.css";

const Tabs = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className={styles.tabs}>
      <div className={styles.tabList}>
        <nav style={{ display: 'flex', gap: '8px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={[
                styles.tabBtn,
                activeTab === tab.name ? styles.tabBtnActive : '',
              ].join(' ')}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
              {activeTab === tab.name && (
                <div className={styles.tabIndicator} />
              )}
              {activeTab === tab.name && (
                <div className={styles.tabBg} />
              )}
            </button>
          ))}
        </nav>
      </div>
      <div className={styles.tabContent}>
        {tabs.map((tab) =>
          tab.name === activeTab ? (
            <div key={tab.name} className={styles.tabPanel}>
              {tab.content}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
};

export default Tabs;
