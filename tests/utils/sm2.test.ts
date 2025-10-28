import { describe, it, expect, beforeEach } from 'vitest';
import { calculateSM2 } from '../../utils/sm2';
import { createMockFlashcard } from '../utils/testUtils';

describe('SM2 Algorithm', () => {
  let flashcard: any;

  beforeEach(() => {
    flashcard = createMockFlashcard({
      repetition: 0,
      easinessFactor: 2.5,
      interval: 0,
    });
  });

  describe('Input validation', () => {
    it('should throw error for quality less than 0', () => {
      expect(() => calculateSM2(flashcard, -1)).toThrow('Quality must be between 0 and 5.');
    });

    it('should throw error for quality greater than 5', () => {
      expect(() => calculateSM2(flashcard, 6)).toThrow('Quality must be between 0 and 5.');
    });

    it('should accept quality values from 0 to 5', () => {
      expect(() => calculateSM2(flashcard, 0)).not.toThrow();
      expect(() => calculateSM2(flashcard, 1)).not.toThrow();
      expect(() => calculateSM2(flashcard, 2)).not.toThrow();
      expect(() => calculateSM2(flashcard, 3)).not.toThrow();
      expect(() => calculateSM2(flashcard, 4)).not.toThrow();
      expect(() => calculateSM2(flashcard, 5)).not.toThrow();
    });
  });

  describe('Incorrect responses (quality < 3)', () => {
    it('should reset repetition to 0 for quality 0', () => {
      const result = calculateSM2(flashcard, 0);
      expect(result.repetition).toBe(0);
      expect(result.interval).toBe(1);
    });

    it('should reset repetition to 0 for quality 1', () => {
      const result = calculateSM2(flashcard, 1);
      expect(result.repetition).toBe(0);
      expect(result.interval).toBe(1);
    });

    it('should reset repetition to 0 for quality 2', () => {
      const result = calculateSM2(flashcard, 2);
      expect(result.repetition).toBe(0);
      expect(result.interval).toBe(1);
    });

    it('should not change easiness factor for incorrect responses', () => {
      const initialEasiness = flashcard.easinessFactor;
      const result = calculateSM2(flashcard, 1);
      expect(result.easinessFactor).toBe(initialEasiness);
    });
  });

  describe('Correct responses (quality >= 3)', () => {
    it('should increment repetition for quality 3', () => {
      const result = calculateSM2(flashcard, 3);
      expect(result.repetition).toBe(1);
    });

    it('should increment repetition for quality 5', () => {
      const result = calculateSM2(flashcard, 5);
      expect(result.repetition).toBe(1);
    });

    it('should set interval to 1 for first correct response', () => {
      flashcard.repetition = 0;
      const result = calculateSM2(flashcard, 4);
      expect(result.interval).toBe(1);
    });

    it('should set interval to 6 for second correct response', () => {
      flashcard.repetition = 1;
      const result = calculateSM2(flashcard, 4);
      expect(result.interval).toBe(6);
    });

    it('should calculate interval using easiness factor for third+ correct response', () => {
      flashcard.repetition = 2;
      flashcard.interval = 6;
      flashcard.easinessFactor = 2.5;
      const result = calculateSM2(flashcard, 4);
      expect(result.interval).toBe(Math.ceil(6 * 2.5)); // 15
    });
  });

  describe('Easiness factor calculations', () => {
    it('should increase easiness factor for quality 5', () => {
      const initialEasiness = flashcard.easinessFactor;
      const result = calculateSM2(flashcard, 5);
      expect(result.easinessFactor).toBeGreaterThan(initialEasiness);
    });

    it('should decrease easiness factor for quality 3', () => {
      const initialEasiness = flashcard.easinessFactor;
      const result = calculateSM2(flashcard, 3);
      expect(result.easinessFactor).toBeLessThan(initialEasiness);
    });

    it('should not allow easiness factor below 1.3', () => {
      flashcard.easinessFactor = 1.2;
      const result = calculateSM2(flashcard, 3);
      expect(result.easinessFactor).toBe(1.3);
    });

    it('should calculate easiness factor correctly for quality 4', () => {
      flashcard.easinessFactor = 2.5;
      const result = calculateSM2(flashcard, 4);
      // EF = EF + (0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02))
      // EF = 2.5 + (0.1 - 1 * (0.08 + 1 * 0.02))
      // EF = 2.5 + (0.1 - 0.1) = 2.5
      expect(result.easinessFactor).toBe(2.5);
    });
  });

  describe('Progressive learning scenarios', () => {
    it('should follow correct progression for perfect responses', () => {
      let currentCard = { ...flashcard };

      // First review (quality 5)
      let result = calculateSM2(currentCard, 5);
      expect(result.repetition).toBe(1);
      expect(result.interval).toBe(1);
      currentCard = { ...currentCard, ...result };

      // Second review (quality 5)
      result = calculateSM2(currentCard, 5);
      expect(result.repetition).toBe(2);
      expect(result.interval).toBe(6);
      currentCard = { ...currentCard, ...result };

      // Third review (quality 5)
      result = calculateSM2(currentCard, 5);
      expect(result.repetition).toBe(3);
      expect(result.interval).toBe(Math.ceil(6 * result.easinessFactor));
    });

    it('should reset correctly after failed response', () => {
      let currentCard = { ...flashcard };

      // First few successful reviews
      currentCard = { ...currentCard, ...calculateSM2(currentCard, 5) };
      currentCard = { ...currentCard, ...calculateSM2(currentCard, 5) };
      currentCard = { ...currentCard, ...calculateSM2(currentCard, 5) };

      expect(currentCard.repetition).toBe(3);
      expect(currentCard.interval).toBeGreaterThan(1);

      // Failed response
      const result = calculateSM2(currentCard, 1);
      expect(result.repetition).toBe(0);
      expect(result.interval).toBe(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle minimum easiness factor correctly', () => {
      flashcard.easinessFactor = 1.31;
      const result = calculateSM2(flashcard, 3);
      expect(result.easinessFactor).toBe(1.3);
    });

    it('should handle very high intervals', () => {
      flashcard.repetition = 3;
      flashcard.interval = 100;
      flashcard.easinessFactor = 3.0;
      const result = calculateSM2(flashcard, 5);
      expect(result.interval).toBe(Math.ceil(100 * result.easinessFactor));
    });

    it('should handle decimal intervals correctly', () => {
      flashcard.repetition = 2;
      flashcard.interval = 6;
      flashcard.easinessFactor = 1.5;
      const result = calculateSM2(flashcard, 4);
      expect(result.interval).toBe(Math.ceil(6 * 1.5)); // Should be 9
    });
  });
});