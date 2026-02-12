/**
 * Converts Float32Array PCM data (from Web Audio API) to a base64 encoded string
 * representing 16-bit PCM, which is required by Gemini Live API.
 */
export function float32To16BitPCMBase64(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp values between -1 and 1
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    // Scale to 16-bit integer range
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  // Convert Int16Array to binary string
  let binary = '';
  const bytes = new Uint8Array(int16Array.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}

/**
 * Decodes base64 string to AudioBuffer for playback
 */
export async function decodeAudioData(
  base64String: string,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Create an AudioBuffer (assuming 24kHz for Gemini output usually, or we can check header if provided, but raw PCM doesn't have header)
  // Gemini Live text-to-speech usually outputs 24kHz.
  // However, for raw PCM, we manually construct it.
  
  const int16Data = new Int16Array(bytes.buffer);
  const float32Data = new Float32Array(int16Data.length);
  
  for (let i = 0; i < int16Data.length; i++) {
    float32Data[i] = int16Data[i] / 32768.0;
  }
  
  const buffer = audioContext.createBuffer(1, float32Data.length, 24000);
  buffer.getChannelData(0).set(float32Data);
  return buffer;
}
