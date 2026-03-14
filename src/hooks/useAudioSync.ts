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
  playNarration: (text: string) => void;
  playFillerLine: () => void;
  stopAllAudio: () => void;
}

/**
 * useAudioSync Hook
 * Manages the microphone input timer, suspense audio loop, and narration playback.
 */
export function useAudioSync({ onRecordingComplete }: UseAudioSyncProps = {}): UseAudioSyncReturn {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Refs for audio elements and recorder to persist across renders
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const heartbeatAudioRef = useRef<HTMLAudioElement | null>(null);
  const thudAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio elements on mount
  useEffect(() => {
    // Suspense Loop
    heartbeatAudioRef.current = new Audio('/sounds/heartbeat.mp3');
    heartbeatAudioRef.current.loop = true;
    heartbeatAudioRef.current.volume = 0.5; // Adjust volume as needed

    // Impact Sound
    thudAudioRef.current = new Audio('/sounds/thud.mp3');
    thudAudioRef.current.volume = 0.8;

    // Cleanup on unmount
    return () => {
      stopAllAudio();
    };
  }, []);

  /**
   * Stops all currently playing audio and speech synthesis.
   */
  const stopAllAudio = useCallback(() => {
    if (heartbeatAudioRef.current) {
      heartbeatAudioRef.current.pause();
      heartbeatAudioRef.current.currentTime = 0;
    }
    if (thudAudioRef.current) {
      thudAudioRef.current.pause();
      thudAudioRef.current.currentTime = 0;
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
        heartbeatAudioRef.current?.play().catch(e => console.warn("Audio play failed:", e));
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
  const playNarration = useCallback((text: string) => {
    // Stop Suspense Audio
    if (heartbeatAudioRef.current) {
      heartbeatAudioRef.current.pause();
      heartbeatAudioRef.current.currentTime = 0;
    }
    setIsProcessing(false);
    setIsSpeaking(true);

    // Play Impact Sound
    thudAudioRef.current?.play().catch(e => console.warn("Thud play failed:", e));

    // Start Speech Synthesis (Native Browser API)
    // We add a small delay to let the thud impact hit first
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice (optional: try to find a "Google" or "Microsoft" voice if available)
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Microsoft David'));
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.rate = 1.0; // Normal speed
      utterance.pitch = 0.9; // Slightly deeper for noir feel

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    }, 300); // 300ms delay for dramatic effect

  }, []);

  const playFillerLine = useCallback(() => {
    const lines = [
      "The threads of fate weave your choice...",
      "Let us see what the manuscript reveals...",
      "The ink dries on a new chapter...",
      "A new path unfolds before you..."
    ];
    const randomLine = lines[Math.floor(Math.random() * lines.length)];
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(randomLine);
    utterance.rate = 0.9;
    utterance.pitch = 0.9;
    window.speechSynthesis.speak(utterance);
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
