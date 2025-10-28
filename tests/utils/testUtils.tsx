import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Persona, Scenario } from '../../types';

// Mock data factories
export const createMockPersona = (overrides?: Partial<Persona>): Persona => ({
  id: 'teacher',
  name: 'English Teacher',
  description: 'A professional English teacher',
  prompt: 'You are a helpful English teacher',
  icon: '👨‍🏫',
  ...overrides,
});

export const createMockScenario = (overrides?: Partial<Scenario>): Scenario => ({
  id: 'restaurant',
  name: 'At a Restaurant',
  description: 'Practice ordering food',
  prompt: 'You are at a restaurant',
  icon: '🍽️',
  ...overrides,
});

export const createMockFlashcard = (overrides?: any) => ({
  id: '1',
  front: 'Hello',
  back: 'Hola',
  repetition: 0,
  easinessFactor: 2.5,
  interval: 1,
  nextReviewAt: new Date().toISOString(),
  audioBase64: null,
  ...overrides,
});

export const createMockTranscriptEntry = (overrides?: any) => ({
  id: 1,
  speaker: 'user' as const,
  text: 'Hello world',
  isPartial: false,
  ...overrides,
});

export const createMockSession = (overrides?: any) => ({
  user: {
    id: 'user123',
    email: 'test@example.com',
  },
  ...overrides,
});

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };

// Helper function to wait for next tick
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock IntersectionObserver
global.IntersectionObserver = class MockIntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
} as any;