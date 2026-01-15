import { useEffect } from 'react';
import { apiFetch } from '@/api/fetcher';

import TopBar from '../../components/TopBar/TopBar';
import SideMenu from '../../components/SideMenu/SideMenu';
import styles from './TemplatesPage.module.css';

export default function TemplatesPage() {
  useEffect(() => {
    apiFetch('/api/me').catch(() => {
      // Error handled in fetcher
    });
  }, []);

  return (
    <div className={styles.page}>
      <TopBar />
      <div className={styles.shell}>
        <SideMenu />
        <main className={styles.main}>{/* vide */}</main>
      </div>
    </div>
  );
}
