import { useEffect } from 'react';

/**
 * Hook to handle ESC key press for closing modals
 * @param onEscape Callback function to execute when ESC is pressed
 * @param enabled Whether the hook should be active (default: true)
 */
export function useEscapeKey(onEscape: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onEscape();
      }
    };

    // Add event listener to document with capture phase to ensure it triggers first
    document.addEventListener('keydown', handleEscapeKey, { capture: true });

    return () => {
      document.removeEventListener('keydown', handleEscapeKey, { capture: true });
    };
  }, [onEscape, enabled]);
}