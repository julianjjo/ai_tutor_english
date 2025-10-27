import { Flashcard } from '../types';

interface SM2Result {
    repetition: number;
    easinessFactor: number;
    interval: number;
}

/**
 * Implements the SM-2 spaced repetition algorithm.
 * @param flashcard - The flashcard object with current SM-2 values.
 * @param quality - The user's rating of their recall quality (0-5).
 * @returns The updated SM-2 values for the flashcard.
 */
export const calculateSM2 = (flashcard: Flashcard, quality: number): SM2Result => {
    if (quality < 0 || quality > 5) {
        throw new Error("Quality must be between 0 and 5.");
    }

    let { repetition, easinessFactor, interval } = flashcard;

    if (quality < 3) {
        // Incorrect response: reset progress
        repetition = 0;
        interval = 1;
        return { repetition, easinessFactor, interval };
    }

    // Correct response: calculate new values
    easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easinessFactor < 1.3) {
        easinessFactor = 1.3; // Easiness factor should not be less than 1.3
    }

    repetition = repetition + 1;

    if (repetition === 1) {
        interval = 1;
    } else if (repetition === 2) {
        interval = 6;
    } else {
        // The interval is rounded up to the nearest integer
        interval = Math.ceil(interval * easinessFactor);
    }
    
    return { repetition, easinessFactor, interval };
};