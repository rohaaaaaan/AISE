'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
    onSearch: (query: string) => void;
    onClose: () => void;
    onNext: () => void;
    onPrevious: () => void;
    matchCount: number;
    currentMatchIndex: number;
}

export function SearchBar({ onSearch, onClose, onNext, onPrevious, matchCount, currentMatchIndex }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        onSearch(query);
    }, [query, onSearch]);

    const handleClear = () => {
        setQuery('');
        inputRef.current?.focus();
    };

    return (
        <div className={styles.searchBarContainer}>
            <Search size={16} />
            <input
                ref={inputRef}
                type="text"
                placeholder="Search nodes..."
                className={styles.searchInput}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
                <>
                    <span className={styles.searchCount}>
                        {matchCount > 0 ? `${currentMatchIndex + 1} of ${matchCount}` : 'No results'}
                    </span>
                    <div className={styles.divider} />
                    <button className={styles.iconButton} onClick={onPrevious} disabled={matchCount === 0}>
                        <ChevronUp size={16} />
                    </button>
                    <button className={styles.iconButton} onClick={onNext} disabled={matchCount === 0}>
                        <ChevronDown size={16} />
                    </button>
                    <div className={styles.divider} />
                    <button className={styles.iconButton} onClick={onClose}>
                        <X size={16} />
                    </button>
                </>
            )}
        </div>
    );
}
