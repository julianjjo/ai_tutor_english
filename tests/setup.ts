import '@testing-library/jest-dom';

// Mock Web Audio API
global.AudioContext = class MockAudioContext {
  state = 'running';
  sampleRate = 24000;
  createBuffer() {
    return {
      getChannelData: () => new Float32Array(1024),
    };
  }
  createBufferSource() {
    return {
      connect: vi.fn(),
      start: vi.fn(),
    };
  }
  destination = {};
} as any;

// Mock MediaDevices
global.navigator.mediaDevices = {
  getUserMedia: vi.fn(() =>
    Promise.resolve({
      getTracks: () => [],
    })
  ),
} as any;

// Mock btoa/atob for Node environment
global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
global.atob = (b64: string) => Buffer.from(b64, 'base64').toString('binary');

// Mock window.getSelection
Object.defineProperty(window, 'getSelection', {
  value: vi.fn(() => ({
    toString: () => 'selected text',
    rangeCount: 1,
    getRangeAt: vi.fn(() => ({
      getBoundingClientRect: vi.fn(() => ({ top: 100, left: 100, width: 100, height: 20 })),
      commonAncestorContainer: { nodeType: Node.TEXT_NODE, parentElement: { closest: vi.fn(() => true) } },
    })),
  })),
  writable: true,
});

// Mock Supabase
vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null,
        })),
      })),
    })),
  },
}));

// Mock Google AI
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn(),
    },
  })),
}));

// Mock environment variables
vi.mock('../constants', () => ({
  personas: [
    {
      id: 'teacher',
      name: 'English Teacher',
      description: 'A professional English teacher',
      prompt: 'You are a helpful English teacher',
      icon: '👨‍🏫',
    },
  ],
  scenarios: [
    {
      id: 'restaurant',
      name: 'At a Restaurant',
      description: 'Practice ordering food',
      prompt: 'You are at a restaurant',
      icon: '🍽️',
    },
  ],
}));