import { useEffect, useState, useCallback } from 'react';
import type { Email } from '../types';

interface KeyboardConfig {
    emails: Email[];
    onSelect: (email: Email | null) => void;
    onArchive: (email: Email) => void;
    onDelete: (email: Email) => void;
    onReply: (email: Email) => void;
    isOpen: boolean; // if detail view is open
}

export function useKeyboardNavigation({ emails, onSelect, onArchive, onDelete, onReply, isOpen }: KeyboardConfig) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Reset selection when list changes significantly (optional, but good for filtering)
    useEffect(() => {
        if (selectedIndex !== 0) {
            // eslint-disable-next-line
            setSelectedIndex(0);
        }
    }, [emails.length, selectedIndex]); // Simple dependency

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Ignore if input/textarea is focused
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

        // Ignore modifiers (except Shift which might be useful, but for now strict)
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        switch (e.key) {
            case 'j':
            case 'ArrowDown':
                setSelectedIndex(prev => Math.min(prev + 1, emails.length - 1));
                break;
            case 'k':
            case 'ArrowUp':
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                if (!isOpen && emails[selectedIndex]) {
                    onSelect(emails[selectedIndex]);
                }
                break;
            case 'Escape':
                if (isOpen) {
                    onSelect(null);
                } else {
                    setSelectedIndex(0);
                }
                break;
            case 'e':
                if (emails[selectedIndex]) {
                    onArchive(emails[selectedIndex]);
                    // Auto-advance is handled by the list shrinking, but we might want to clamp index
                }
                break;
            case '#':
            case 'Backspace':
                if (emails[selectedIndex]) {
                    onDelete(emails[selectedIndex]);
                }
                break;
            case 'r':
                if (isOpen && emails[selectedIndex]) {
                    e.preventDefault(); // Prevent type
                    onReply(emails[selectedIndex]);
                }
                break;
            default:
                break;
        }
    }, [emails, selectedIndex, isOpen, onSelect, onArchive, onDelete, onReply]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return { selectedIndex };
}
