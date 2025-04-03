"use client"
import styles from '../styles/Loading.module.css';

export const Loading = () => (
  <div className={styles.spinnerContainer}>
    <div className={styles.spinner}></div>
    <p className={styles.loadingText}>Loading...</p>
  </div>
);