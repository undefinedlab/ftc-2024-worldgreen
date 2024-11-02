// components/Modals/Meet.js
import React from 'react';
import styles from './Modals.module.css';

export function Meet() {
  return (
    <div className={styles.overlay}>
      <h2>Fan Meet</h2>
      {/* Add your meet content here */}
      <div>
        <p>Fan meet content goes here...</p>
      </div>
    </div>
  );
}