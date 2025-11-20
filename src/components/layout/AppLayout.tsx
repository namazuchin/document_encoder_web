import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Settings, FileText, List } from 'lucide-react';
import styles from './AppLayout.module.css';
import { useApp } from '../../contexts/AppContext';

export const AppLayout: React.FC = () => {
    const { t } = useApp();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link to="/" className={styles.brand}>
                    <FileText className={styles.logo} size={24} />
                    <h1 className={styles.title}>{t.layout.appTitle}</h1>
                </Link>
                <nav className={styles.nav}>
                    <Link to="/prompts" className={styles.navItem} title={t.layout.promptPresetsTooltip}>
                        <List size={20} />
                    </Link>
                    <Link to="/settings" className={styles.navItem} title={t.layout.settingsTooltip}>
                        <Settings size={20} />
                    </Link>
                </nav>
            </header>
            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
};
