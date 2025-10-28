import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { createMockSession, createMockFlashcard, createMockTranscriptEntry } from '../utils/testUtils';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
};

vi.mock('../../supabaseClient', () => ({
  supabase: mockSupabase,
}));

describe('useSupabaseData Hook', () => {
  let mockSession: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = createMockSession();
  });

  describe('Data fetching', () => {
    it('should initialize with empty state when no session', () => {
      const { result } = renderHook(() => useSupabaseData(null));

      expect(result.current.history).toEqual([]);
      expect(result.current.flashcards).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should fetch data when session is provided', async () => {
      const mockHistoryData = [
        {
          id: '1',
          title: 'Test Conversation',
          timestamp: '2023-01-01T00:00:00Z',
          transcript: [createMockTranscriptEntry()],
          personaId: 'teacher',
          scenarioId: 'restaurant',
        },
      ];

      const mockFlashcardsData = [
        {
          id: '1',
          front: 'Hello',
          back: 'Hola',
          repetition: 0,
          easiness_factor: 2.5,
          interval: 1,
          next_review_at: '2023-01-01T00:00:00Z',
          audio_base_64: null,
        },
      ];

      const mockHistoryQuery = {
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockHistoryData,
            error: null,
          }),
        }),
      };

      const mockFlashcardsQuery = {
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockFlashcardsData,
            error: null,
          }),
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockHistoryQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockFlashcardsQuery),
        });

      const { result } = renderHook(() => useSupabaseData(mockSession));

      await waitFor(() => {
        expect(result.current.history).toHaveLength(1);
        expect(result.current.flashcards).toHaveLength(1);
        expect(result.current.error).toBeNull();
      });

      expect(result.current.history[0]).toMatchObject({
        id: '1',
        title: 'Test Conversation',
        timestamp: new Date('2023-01-01T00:00:00Z').getTime(),
      });

      expect(result.current.flashcards[0]).toMatchObject({
        id: '1',
        front: 'Hello',
        back: 'Hola',
        easinessFactor: 2.5,
        audioBase64: null,
      });
    });

    it('should handle fetch errors gracefully', async () => {
      const mockHistoryQuery = {
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        }),
      };

      const mockFlashcardsQuery = {
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockHistoryQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockFlashcardsQuery),
        });

      const { result } = renderHook(() => useSupabaseData(mockSession));

      await waitFor(() => {
        expect(result.current.error).toBe('No se pudo cargar el historial o las flashcards.');
      });
    });
  });

  describe('saveConversation', () => {
    it('should save conversation successfully', async () => {
      const mockConversationData = {
        id: '1',
        title: 'New Conversation',
        timestamp: '2023-01-01T00:00:00Z',
        personaId: 'teacher',
        scenarioId: 'restaurant',
      };

      const mockInsert = {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockConversationData,
            error: null,
          }),
        }),
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue(mockInsert),
      });

      const { result } = renderHook(() => useSupabaseData(mockSession));

      const transcript = [createMockTranscriptEntry()];

      await act(async () => {
        await result.current.saveConversation(
          transcript,
          'teacher',
          'restaurant',
          'New Conversation'
        );
      });

      await waitFor(() => {
        expect(result.current.history).toHaveLength(1);
        expect(result.current.history[0]).toMatchObject({
          id: '1',
          title: 'New Conversation',
          timestamp: new Date('2023-01-01T00:00:00Z').getTime(),
        });
      });
    });

    it('should not save conversation without session', async () => {
      const { result } = renderHook(() => useSupabaseData(null));

      await act(async () => {
        await result.current.saveConversation(
          [createMockTranscriptEntry()],
          'teacher',
          'restaurant',
          'Test'
        );
      });

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should not save empty transcript', async () => {
      const { result } = renderHook(() => useSupabaseData(mockSession));

      await act(async () => {
        await result.current.saveConversation(
          [],
          'teacher',
          'restaurant',
          'Test'
        );
      });

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation successfully', async () => {
      const mockDelete = {
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue(mockDelete),
      });

      // Start with one conversation
      const { result } = renderHook(() => useSupabaseData(mockSession));
      act(() => {
        result.current.history = [
          {
            id: '1',
            title: 'Test',
            timestamp: Date.now(),
            transcript: [],
            personaId: 'teacher',
            scenarioId: 'restaurant',
          },
        ];
      });

      await act(async () => {
        await result.current.deleteConversation('1');
      });

      expect(result.current.history).toHaveLength(0);
    });

    it('should handle delete errors gracefully', async () => {
      const mockDelete = {
        eq: vi.fn().mockResolvedValue({
          error: new Error('Delete error'),
        }),
      };

      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue(mockDelete),
      });

      const { result } = renderHook(() => useSupabaseData(mockSession));

      await act(async () => {
        await result.current.deleteConversation('1');
      });

      expect(result.current.error).toBe('No se pudo borrar la conversación.');
    });
  });

  describe('createFlashcard', () => {
    it('should create flashcard successfully', async () => {
      const mockCardData = {
        id: '1',
        front: 'Hello',
        back: 'Hola',
        repetition: 0,
        easiness_factor: 2.5,
        interval: 0,
        next_review_at: null,
        audio_base_64: null,
      };

      const mockInsert = {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockCardData,
            error: null,
          }),
        }),
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue(mockInsert),
      });

      const { result } = renderHook(() => useSupabaseData(mockSession));

      await act(async () => {
        await result.current.createFlashcard({
          front: 'Hello',
          back: 'Hola',
        });
      });

      await waitFor(() => {
        expect(result.current.flashcards).toHaveLength(1);
        expect(result.current.flashcards[0]).toMatchObject({
          id: '1',
          front: 'Hello',
          back: 'Hola',
          easinessFactor: 2.5,
        });
      });
    });

    it('should not create flashcard without session', async () => {
      const { result } = renderHook(() => useSupabaseData(null));

      await act(async () => {
        await result.current.createFlashcard({
          front: 'Hello',
          back: 'Hola',
        });
      });

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('updateFlashcardReview', () => {
    it('should update flashcard with SM2 values', async () => {
      const card = createMockFlashcard();
      const mockUpdateData = {
        id: '1',
        repetition: 1,
        easiness_factor: 2.6,
        interval: 1,
        next_review_at: new Date().toISOString(),
      };

      const mockUpdate = {
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUpdateData,
              error: null,
            }),
          }),
        }),
      };

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue(mockUpdate),
      });

      const { result } = renderHook(() => useSupabaseData(mockSession));

      // Start with one flashcard
      act(() => {
        result.current.flashcards = [card];
      });

      await act(async () => {
        await result.current.updateFlashcardReview(card, 4);
      });

      await waitFor(() => {
        const updatedCard = result.current.flashcards[0];
        expect(updatedCard.repetition).toBe(1);
        expect(updatedCard.easinessFactor).toBe(2.6);
        expect(updatedCard.interval).toBe(1);
      });
    });
  });

  describe('saveFlashcardAudio', () => {
    it('should save audio to flashcard', async () => {
      const card = createMockFlashcard();
      const mockUpdate = {
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue(mockUpdate),
      });

      const { result } = renderHook(() => useSupabaseData(mockSession));

      // Start with one flashcard
      act(() => {
        result.current.flashcards = [card];
      });

      const audioBase64 = 'base64encodedaudio';

      await act(async () => {
        await result.current.saveFlashcardAudio('1', audioBase64);
      });

      await waitFor(() => {
        expect(result.current.flashcards[0].audioBase64).toBe(audioBase64);
      });
    });
  });

  describe('deleteFlashcard', () => {
    it('should delete flashcard successfully', async () => {
      const mockDelete = {
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue(mockDelete),
      });

      const { result } = renderHook(() => useSupabaseData(mockSession));

      // Start with one flashcard
      act(() => {
        result.current.flashcards = [createMockFlashcard()];
      });

      await act(async () => {
        await result.current.deleteFlashcard('1');
      });

      expect(result.current.flashcards).toHaveLength(0);
    });
  });

  describe('Session changes', () => {
    it('should clear data when session is removed', async () => {
      // First fetch data with session
      const mockHistoryQuery = {
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [{ id: '1', title: 'Test', timestamp: '2023-01-01T00:00:00Z' }],
            error: null,
          }),
        }),
      };

      const mockFlashcardsQuery = {
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockHistoryQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockFlashcardsQuery),
        });

      const { result, rerender } = renderHook(
        ({ session }) => useSupabaseData(session),
        { initialProps: { session: mockSession } }
      );

      await waitFor(() => {
        expect(result.current.history).toHaveLength(1);
      });

      // Remove session
      rerender({ session: null });

      expect(result.current.history).toEqual([]);
      expect(result.current.flashcards).toEqual([]);
    });
  });
});