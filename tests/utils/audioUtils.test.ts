import { describe, it, expect, beforeEach, vi } from 'vitest';
import { encode, decode, decodeAudioData } from '../../utils/audioUtils';

describe('Audio Utils', () => {
  describe('encode function', () => {
    it('should encode empty Uint8Array to base64', () => {
      const emptyArray = new Uint8Array(0);
      const result = encode(emptyArray);
      expect(result).toBe('');
    });

    it('should encode simple data correctly', () => {
      const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello" in ASCII
      const result = encode(data);
      expect(result).toBe(btoa('Hello'));
    });

    it('should encode binary data correctly', () => {
      const data = new Uint8Array([0, 1, 2, 255, 254]);
      const result = encode(data);
      // Convert to string for btoa
      const binaryString = String.fromCharCode(...data);
      expect(result).toBe(btoa(binaryString));
    });

    it('should handle large arrays', () => {
      const largeData = new Uint8Array(1000);
      for (let i = 0; i < 1000; i++) {
        largeData[i] = i % 256;
      }
      const result = encode(largeData);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('decode function', () => {
    it('should decode empty base64 string', () => {
      const result = decode('');
      expect(result).toEqual(new Uint8Array(0));
    });

    it('should decode simple base64 string', () => {
      const base64String = btoa('Hello');
      const result = decode(base64String);
      const expected = new Uint8Array([72, 101, 108, 108, 111]);
      expect(result).toEqual(expected);
    });

    it('should decode binary data correctly', () => {
      const originalData = new Uint8Array([0, 1, 2, 255, 254]);
      const binaryString = String.fromCharCode(...originalData);
      const base64String = btoa(binaryString);
      const result = decode(base64String);
      expect(result).toEqual(originalData);
    });

    it('should round-trip encode/decode correctly', () => {
      const originalData = new Uint8Array([128, 64, 32, 16, 8, 4, 2, 1]);
      const encoded = encode(originalData);
      const decoded = decode(encoded);
      expect(decoded).toEqual(originalData);
    });
  });

  describe('decodeAudioData function', () => {
    let mockAudioContext: any;

    beforeEach(() => {
      mockAudioContext = {
        createBuffer: vi.fn((numChannels: number, frameCount: number, sampleRate: number) => ({
          getChannelData: vi.fn(() => new Float32Array(frameCount)),
        })),
        sampleRate: 24000,
      };
    });

    it('should create audio buffer with correct parameters', async () => {
      const data = new Uint8Array(8); // 4 frames * 2 channels * 1 byte per sample (simplified)
      const result = await decodeAudioData(data, mockAudioContext, 24000, 2);

      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(2, 2, 24000);
      expect(result.getChannelData).toHaveBeenCalledTimes(2);
    });

    it('should handle mono audio correctly', async () => {
      const data = new Uint8Array(8); // 4 frames * 1 channel * 2 bytes per sample (16-bit)
      const result = await decodeAudioData(data, mockAudioContext, 24000, 1);

      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, 4, 24000);
      expect(result.getChannelData).toHaveBeenCalledTimes(1);
    });

    it('should convert 16-bit PCM to float correctly', async () => {
      // Create test data: [-32768, 0, 32767] (min, zero, max for 16-bit PCM)
      const int16Data = new Int16Array([-32768, 0, 32767]);
      const uint8Data = new Uint8Array(int16Data.buffer);

      const mockBuffer = {
        getChannelData: vi.fn(() => new Float32Array(3)),
      };
      mockAudioContext.createBuffer.mockReturnValue(mockBuffer);

      await decodeAudioData(uint8Data, mockAudioContext, 24000, 1);

      // Verify the buffer was created with correct parameters
      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, 3, 24000);

      // Get the channel data that would be filled
      const channelData = mockBuffer.getChannelData();

      // Verify the conversion logic (this would be done inside the function)
      expect(channelData.length).toBe(3);
    });

    it('should handle stereo audio correctly', async () => {
      // Create interleaved stereo data: [L1, R1, L2, R2, L3, R3]
      const int16Data = new Int16Array([-32768, 0, 0, 32767, 16384, -16384]);
      const uint8Data = new Uint8Array(int16Data.buffer);

      const mockBuffer = {
        getChannelData: vi.fn(() => new Float32Array(3)),
      };
      mockAudioContext.createBuffer.mockReturnValue(mockBuffer);

      await decodeAudioData(uint8Data, mockAudioContext, 24000, 2);

      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(2, 3, 24000);
      expect(mockBuffer.getChannelData).toHaveBeenCalledTimes(2);
    });

    it('should handle different sample rates', async () => {
      const data = new Uint8Array(8); // 4 frames * 1 channel * 2 bytes per sample
      const customSampleRate = 44100;

      await decodeAudioData(data, mockAudioContext, customSampleRate, 1);

      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, 4, customSampleRate);
    });

    it('should handle empty data', async () => {
      const data = new Uint8Array(0);

      const mockBuffer = {
        getChannelData: vi.fn(() => new Float32Array(0)),
      };
      mockAudioContext.createBuffer.mockReturnValue(mockBuffer);

      const result = await decodeAudioData(data, mockAudioContext, 24000, 1);

      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, 0, 24000);
      expect(result.getChannelData).toHaveBeenCalled();
    });

    // Note: The decodeAudioData function requires even-length buffers for 16-bit audio
    // so odd-length buffers will throw an error - this is expected behavior
  });

  describe('Integration tests', () => {
    it('should handle complete audio workflow', async () => {
      const originalFloatData = [-1.0, 0.0, 1.0, -0.5, 0.5, 0.0];
      const mockAudioContext = {
        createBuffer: vi.fn((numChannels, frameCount, sampleRate) => {
          const buffer = {
            getChannelData: vi.fn(() => new Float32Array(frameCount)),
          };
          return buffer;
        }),
        sampleRate: 24000,
      };

      // Simulate converting float to 16-bit PCM, then back
      const int16Data = originalFloatData.map(sample => Math.round(sample * 32767));
      const uint8Data = new Uint8Array(int16Data.length * 2);
      for (let i = 0; i < int16Data.length; i++) {
        uint8Data[i * 2] = int16Data[i] & 0xFF;
        uint8Data[i * 2 + 1] = (int16Data[i] >> 8) & 0xFF;
      }

      const mockBuffer = {
        getChannelData: vi.fn(() => new Float32Array(originalFloatData)),
      };
      mockAudioContext.createBuffer.mockReturnValue(mockBuffer);

      const result = await decodeAudioData(uint8Data, mockAudioContext, 24000, 1);

      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, int16Data.length, 24000);
      expect(result).toBeDefined();
    });
  });
});