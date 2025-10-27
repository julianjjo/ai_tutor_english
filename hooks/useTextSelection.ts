import { useState, useEffect, useCallback } from 'react';

interface SelectionToolbarState {
    isVisible: boolean;
    text: string;
    top: number;
    left: number;
}

export const useTextSelection = () => {
    const [selectionToolbar, setSelectionToolbar] = useState<SelectionToolbarState | null>(null);

    const hideSelectionToolbar = useCallback(() => {
        setSelectionToolbar(null);
    }, []);

    useEffect(() => {
        const handleMouseUp = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.closest('.selection-toolbar')) {
                return;
            }

            const selection = window.getSelection();
            const selectedText = selection?.toString().trim();

            if (selectedText && selection?.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const commonAncestor = range.commonAncestorContainer;
                const parentElement = commonAncestor.nodeType === Node.TEXT_NODE ? commonAncestor.parentElement : commonAncestor as HTMLElement;
                
                // Only show toolbar for AI messages
                if (parentElement?.closest('.ai-message-bubble')) {
                    const rect = range.getBoundingClientRect();
                    const top = rect.top + window.scrollY - 50; // Position above selection
                    const left = rect.left + window.scrollX + (rect.width / 2) - 100; // Center toolbar
                    setSelectionToolbar({ isVisible: true, text: selectedText, top, left });
                } else {
                    hideSelectionToolbar();
                }
            } else {
                hideSelectionToolbar();
            }
        };

        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, [hideSelectionToolbar]);

    return { selectionToolbar, hideSelectionToolbar };
};
