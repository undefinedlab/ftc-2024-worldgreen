// components/Modals/Fund.js
import React from 'react';
import styles from './Modals.module.css';

export function Fund() {
  return (
    <div className={styles.overlay}>
      <h2>Fund</h2>
      {/* Add your fund content here */}
      <div>
        <p>Fund content goes here...</p>
      </div>
    </div>
  );
}