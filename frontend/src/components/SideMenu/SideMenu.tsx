import { NavLink } from 'react-router-dom';
import styles from './SideMenu.module.css';

type ItemProps = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

function Item({ to, label, icon }: ItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.label}>{label}</span>
    </NavLink>
  );
}

function BoardsIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.svg} aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <rect x="7" y="8" width="5" height="8" rx="1.3" className={styles.svgInner} />
      <rect x="13" y="8" width="4" height="5.5" rx="1.3" className={styles.svgInner} />
    </svg>
  );
}

function TemplatesIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.svg} aria-hidden="true">
      <rect x="4" y="6" width="16" height="14" rx="3" />
      <rect x="7" y="3" width="3" height="5" rx="1" />
      <rect x="14" y="3" width="3" height="5" rx="1" />
      <rect x="7" y="10" width="10" height="2.2" rx="1.1" className={styles.svgInner} />
      <rect x="7" y="14" width="7" height="2.2" rx="1.1" className={styles.svgInner} />
    </svg>
  );
}

export default function SideMenu() {
  return (
    <aside className={styles.container} aria-label="Sidebar">
      <nav className={styles.nav}>
        <Item to="/boards" label="Boards" icon={<BoardsIcon />} />
        <Item to="/templates" label="Templates" icon={<TemplatesIcon />} />
      </nav>
    </aside>
  );
}
