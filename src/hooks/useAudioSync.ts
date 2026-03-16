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
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize voices on mount
  useEffect(() => {
    const populateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;

    return () => {
      stopAllAudio();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  /**
   * Stops all currently playing audio and speech synthesis.
   */
  const stopAllAudio = useCallback(() => {
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
  const playNarration = useCallback((text: string, speaker: string = 'Narrator') => {
    setIsProcessing(false);
    setIsSpeaking(true);

    // Start Speech Synthesis (Native Browser API)
    // We add a small delay to let the thud impact hit first
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
      
      if (voices.length > 0) {
        // Filter to more premium/human-like cloud voices first (usually include 'Google' in Chrome, or 'Online'/'Premium' in Edge)
        const premiumVoices = voices.filter(v => v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural'));
        const activePool = premiumVoices.length > 0 ? premiumVoices : voices;

        // Simple string hash to deterministically pick a voice array index
        const hash = speaker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        
        if (speaker.toLowerCase() === 'narrator') {
          // Deep, clear voice
          const narratorVoice = activePool.find(v => v.name.includes('UK English Male') || v.name.includes('Male') || v.name.includes('Mark'));
          if (narratorVoice) utterance.voice = narratorVoice;
          utterance.pitch = 0.5;
          utterance.rate = 0.95;
        } else if (speaker.toLowerCase() === 'alex') {
          // Youthful active voice
          const alexVoice = activePool.find(v => v.name.includes('US English Male') || v.name.includes('Zira') || v.name.includes('Female'));
          if (alexVoice) utterance.voice = alexVoice;
          utterance.pitch = 1.0;
          utterance.rate = 1.05;
        } else {
          // For NPCs
          const index = hash % activePool.length;
          utterance.voice = activePool[index];
          
          utterance.pitch = 0.6 + ((hash % 10) / 10) * 0.8; // Range 0.6 - 1.4
          utterance.rate = 0.85 + ((hash % 5) / 10) * 0.3; // Range 0.85 - 1.15
        }
      }

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    }, 300); // 300ms delay for dramatic effect

  }, [availableVoices]);

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
    
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const premiumVoices = voices.filter(v => v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural'));
    const activePool = premiumVoices.length > 0 ? premiumVoices : voices;
    
    const narratorVoice = activePool.find(v => v.name.includes('UK English Male') || v.name.includes('Male') || v.name.includes('Mark'));
    if (narratorVoice) utterance.voice = narratorVoice;
    
    utterance.rate = 0.9;
    utterance.pitch = 0.5;
    window.speechSynthesis.speak(utterance);
  }, [availableVoices]);

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
