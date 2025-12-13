'use client';

import { Box, Layers, MessageSquare, Settings, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { clsx } from 'clsx';

import { useUI } from '@/context/UIContext';

const navItems = [
  { icon: Box, label: 'Model', href: '/' },
  { icon: Shield, label: 'DFMEA', href: '/dfmea' },
  { icon: Layers, label: 'Requirements', href: '/requirements' },
  { icon: MessageSquare, label: 'AI Assistant', href: '#' }, // Changed href to #
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { toggleChat, isChatOpen } = useUI();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logo}>AISE</div>
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.label === 'AI Assistant' && isChatOpen);

          if (item.label === 'AI Assistant') {
            return (
              <button
                key={item.href}
                onClick={() => toggleChat()}
                className={clsx(styles.navItem, isActive && styles.navItemActive)}
                title={item.label}
              >
                <Icon size={24} />
                <span className={styles.tooltip}>{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(styles.navItem, isActive && styles.navItemActive)}
            >
              <Icon size={24} />
              <span className={styles.tooltip}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
