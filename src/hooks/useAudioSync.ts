import { useState, useRef, useEffect, useCallback } from 'react';

interface UseAudioSyncProps {
  /**
   * Callback fired when the 4-second recording timer completes.
   * Returns the recorded audio blob.
   */
  onRecordingComplete?: (audioBlob: Blob) => void;
}

interface UseAudioSyncReturn {
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  startRecording: () => Promise<void>;
  playNarration: (text: string, speaker?: string) => void;
  playFillerLine: () => void;
  stopAllAudio: () => void;
}

/**
 * useAudioSync Hook
 * Manages the microphone input timer, suspense audio loop, and narration playback.
 */
export function useAudioSync({ onRecordingComplete }: UseAudioSyncProps = {}): UseAudioSyncReturn {
  // State variables back to just audio/recording hooks since we are handling audio via API
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize voices on mount (kept empty for clean unmount)
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  /**
   * Stops all currently playing audio and speech synthesis.
   */
  const stopAllAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }
    window.speechSynthesis.cancel();
    
    setIsProcessing(false);
    setIsSpeaking(false);
    setIsRecording(false);

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
  }, []);

  /**
   * Starts the microphone recording with a strict 4-second timer.
   */
  const startRecording = useCallback(async () => {
    try {
      // Stop any previous audio
      stopAllAudio();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Trigger callback
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob);
        }

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Transition to Processing State (Suspense Buffer)
        setIsRecording(false);
        setIsProcessing(true);
      };

      // Start Recording
      mediaRecorder.start();
      setIsRecording(true);

      // Set strict 4-second timer
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 4000);

    } catch (error) {
      console.error("Error accessing microphone:", error);
      setIsRecording(false);
    }
  }, [onRecordingComplete, stopAllAudio]);

  /**
   * Handles the Voice Handoff: Stops suspense, plays impact, speaks text.
   */
  const playNarration = useCallback(async (text: string, speaker: string = 'Narrator') => {
    setIsProcessing(false);
    setIsSpeaking(true);

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speaker }),
      });
      const data = await response.json();
      
      if (data.audioBase64) {
        const audioSrc = `data:${data.mimeType};base64,${data.audioBase64}`;
        const audio = new Audio(audioSrc);
        currentAudioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        await audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
    }
  }, []);

  const playFillerLine = useCallback(async () => {
    const lines = [
      "The threads of fate weave your choice...",
      "Let us see what the manuscript reveals...",
      "The ink dries on a new chapter...",
      "A new path unfolds before you..."
    ];
    const randomLine = lines[Math.floor(Math.random() * lines.length)];
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    
    setIsSpeaking(true);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: randomLine, speaker: 'Narrator' }),
      });
      const data = await response.json();
      
      if (data.audioBase64) {
        const audioSrc = `data:${data.mimeType};base64,${data.audioBase64}`;
        const audio = new Audio(audioSrc);
        currentAudioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        await audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
    }
  }, []);

  return {
    isRecording,
    isProcessing,
    isSpeaking,
    startRecording,
    playNarration,
    playFillerLine,
    stopAllAudio
  };
}
