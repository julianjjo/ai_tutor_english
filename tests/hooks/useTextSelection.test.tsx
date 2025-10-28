import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTextSelection } from '../../hooks/useTextSelection';

describe('useTextSelection Hook', () => {
  let mockSelection: any;
  let mockRange: any;
  let mockGetSelection: any;

  beforeEach(() => {
    // Reset DOM mocks
    vi.clearAllMocks();

    // Mock window.getSelection
    mockGetSelection = vi.fn();
    Object.defineProperty(window, 'getSelection', {
      value: mockGetSelection,
      writable: true,
    });

    // Mock selection and range
    mockRange = {
      getBoundingClientRect: vi.fn(() => ({
        top: 100,
        left: 200,
        width: 150,
        height: 20,
      })),
      commonAncestorContainer: {
        nodeType: Node.TEXT_NODE,
        parentElement: {
          closest: vi.fn((selector: string) => selector === '.ai-message-bubble'),
        },
      },
    };

    mockSelection = {
      toString: vi.fn(() => 'selected text'),
      rangeCount: 1,
      getRangeAt: vi.fn(() => mockRange),
    };

    // Mock window.scrollY and window.scrollX
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    Object.defineProperty(window, 'scrollX', { value: 0, writable: true });

    // Mock document.addEventListener
    const mockAddEventListener = vi.fn();
    const mockRemoveEventListener = vi.fn();
    Object.defineProperty(document, 'addEventListener', {
      value: mockAddEventListener,
      writable: true,
    });
    Object.defineProperty(document, 'removeEventListener', {
      value: mockRemoveEventListener,
      writable: true,
    });
  });

  it('should initialize with no selection toolbar', () => {
    const { result } = renderHook(() => useTextSelection());

    expect(result.current.selectionToolbar).toBeNull();
    expect(typeof result.current.hideSelectionToolbar).toBe('function');
  });

  it('should set up and clean up event listeners', () => {
    const { unmount } = renderHook(() => useTextSelection());

    expect(document.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));

    unmount();

    expect(document.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
  });

  it('should show toolbar when text is selected in AI message', async () => {
    mockGetSelection.mockReturnValue(mockSelection);

    const { result } = renderHook(() => useTextSelection());

    // Simulate mouse up event
    const mouseUpEvent = new MouseEvent('mouseup', {
      bubbles: true,
    });

    act(() => {
      document.addEventListener('mouseup', expect.any(Function));
      const addedCalls = (document.addEventListener as any).mock.calls;
      const mouseUpHandler = addedCalls.find(call => call[0] === 'mouseup')?.[1];
      mouseUpHandler(mouseUpEvent);
    });

    await waitFor(() => {
      expect(result.current.selectionToolbar).not.toBeNull();
      expect(result.current.selectionToolbar?.isVisible).toBe(true);
      expect(result.current.selectionToolbar?.text).toBe('selected text');
    });
  });

  it('should position toolbar correctly above selection', async () => {
    mockGetSelection.mockReturnValue(mockSelection);
    Object.defineProperty(window, 'scrollY', { value: 50, writable: true });
    Object.defineProperty(window, 'scrollX', { value: 10, writable: true });

    const { result } = renderHook(() => useTextSelection());

    const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true });

    act(() => {
      const addedCalls = (document.addEventListener as any).mock.calls;
      const mouseUpHandler = addedCalls.find(call => call[0] === 'mouseup')?.[1];
      mouseUpHandler(mouseUpEvent);
    });

    await waitFor(() => {
      const toolbar = result.current.selectionToolbar;
      expect(toolbar?.top).toBe(100 + 50 - 50); // rect.top + scrollY - 50
      expect(toolbar?.left).toBe(200 + 10 + (150 / 2) - 100); // rect.left + scrollX + (width/2) - 100
    });
  });

  it('should not show toolbar when text is selected outside AI message', async () => {
    // Mock selection outside AI message
    mockRange.commonAncestorContainer.parentElement.closest.mockReturnValue(false);
    mockGetSelection.mockReturnValue(mockSelection);

    const { result } = renderHook(() => useTextSelection());

    const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true });

    act(() => {
      const addedCalls = (document.addEventListener as any).mock.calls;
      const mouseUpHandler = addedCalls.find(call => call[0] === 'mouseup')?.[1];
      mouseUpHandler(mouseUpEvent);
    });

    await waitFor(() => {
      expect(result.current.selectionToolbar).toBeNull();
    });
  });

  it('should not show toolbar when clicking on selection toolbar', async () => {
    // Mock click on toolbar
    const mockTarget = { closest: vi.fn((selector: string) => selector === '.selection-toolbar') };
    mockGetSelection.mockReturnValue(mockSelection);

    const { result } = renderHook(() => useTextSelection());

    const mouseUpEvent = new MouseEvent('mouseup', {
      bubbles: true,
      target: mockTarget,
    } as any);

    act(() => {
      const addedCalls = (document.addEventListener as any).mock.calls;
      const mouseUpHandler = addedCalls.find(call => call[0] === 'mouseup')?.[1];
      mouseUpHandler(mouseUpEvent);
    });

    // Should not show toolbar when clicking on toolbar itself
    expect(result.current.selectionToolbar).toBeNull();
  });

  it('should hide toolbar when no text is selected', async () => {
    // First show toolbar
    mockGetSelection.mockReturnValue(mockSelection);
    const { result } = renderHook(() => useTextSelection());

    const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true });

    act(() => {
      const addedCalls = (document.addEventListener as any).mock.calls;
      const mouseUpHandler = addedCalls.find(call => call[0] === 'mouseup')?.[1];
      mouseUpHandler(mouseUpEvent);
    });

    await waitFor(() => {
      expect(result.current.selectionToolbar).not.toBeNull();
    });

    // Then hide it with no selection
    mockGetSelection.mockReturnValue({
      toString: () => '',
      rangeCount: 0,
    });

    act(() => {
      const addedCalls = (document.addEventListener as any).mock.calls;
      const mouseUpHandler = addedCalls.find(call => call[0] === 'mouseup')?.[1];
      mouseUpHandler(mouseUpEvent);
    });

    await waitFor(() => {
      expect(result.current.selectionToolbar).toBeNull();
    });
  });

  it('should hide toolbar when selection is empty after trimming', async () => {
    // Mock selection with only whitespace
    mockSelection.toString.mockReturnValue('   ');
    mockGetSelection.mockReturnValue(mockSelection);

    const { result } = renderHook(() => useTextSelection());

    const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true });

    act(() => {
      const addedCalls = (document.addEventListener as any).mock.calls;
      const mouseUpHandler = addedCalls.find(call => call[0] === 'mouseup')?.[1];
      mouseUpHandler(mouseUpEvent);
    });

    // Should not show toolbar for whitespace-only selection
    expect(result.current.selectionToolbar).toBeNull();
  });

  it('should handle element common ancestor (not text node)', async () => {
    // Mock element common ancestor
    mockRange.commonAncestorContainer = {
      nodeType: Node.ELEMENT_NODE,
      closest: vi.fn((selector: string) => selector === '.ai-message-bubble'),
    };
    mockGetSelection.mockReturnValue(mockSelection);

    const { result } = renderHook(() => useTextSelection());

    const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true });

    act(() => {
      const addedCalls = (document.addEventListener as any).mock.calls;
      const mouseUpHandler = addedCalls.find(call => call[0] === 'mouseup')?.[1];
      mouseUpHandler(mouseUpEvent);
    });

    await waitFor(() => {
      expect(result.current.selectionToolbar).not.toBeNull();
    });
  });

  it('should manually hide toolbar when hideSelectionToolbar is called', async () => {
    // First show toolbar
    mockGetSelection.mockReturnValue(mockSelection);
    const { result } = renderHook(() => useTextSelection());

    const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true });

    act(() => {
      const addedCalls = (document.addEventListener as any).mock.calls;
      const mouseUpHandler = addedCalls.find(call => call[0] === 'mouseup')?.[1];
      mouseUpHandler(mouseUpEvent);
    });

    await waitFor(() => {
      expect(result.current.selectionToolbar).not.toBeNull();
    });

    // Manually hide toolbar
    act(() => {
      result.current.hideSelectionToolbar();
    });

    expect(result.current.selectionToolbar).toBeNull();
  });

  it('should handle selection with no range count', async () => {
    mockSelection.rangeCount = 0;
    mockGetSelection.mockReturnValue(mockSelection);

    const { result } = renderHook(() => useTextSelection());

    const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true });

    act(() => {
      const addedCalls = (document.addEventListener as any).mock.calls;
      const mouseUpHandler = addedCalls.find(call => call[0] === 'mouseup')?.[1];
      mouseUpHandler(mouseUpEvent);
    });

    // Should not show toolbar when rangeCount is 0
    expect(result.current.selectionToolbar).toBeNull();
  });

  it('should handle missing parentElement gracefully', async () => {
    mockRange.commonAncestorContainer = {
      nodeType: Node.TEXT_NODE,
      parentElement: null, // No parent element
    };
    mockGetSelection.mockReturnValue(mockSelection);

    const { result } = renderHook(() => useTextSelection());

    const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true });

    act(() => {
      const addedCalls = (document.addEventListener as any).mock.calls;
      const mouseUpHandler = addedCalls.find(call => call[0] === 'mouseup')?.[1];
      mouseUpHandler(mouseUpEvent);
    });

    // Should handle gracefully without throwing error
    expect(result.current.selectionToolbar).toBeNull();
  });
});