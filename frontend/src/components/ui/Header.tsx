'use client';

import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.title}>Untitled Model</div>
      <div className={styles.actions}>
        <button className="btn btn-ghost">Export</button>
        <button className="btn btn-primary">Share</button>
      </div>
    </header>
  );
}
