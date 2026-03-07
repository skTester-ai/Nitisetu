import { useState, useRef, useCallback } from 'react';
import { transcribeAudio } from '../services/api';

export function useVoice(language = 'en') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript('');
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone access is not supported on this browser or requires HTTPS.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Select best supported mimeType (Chrome/Safari/Firefox compatibility)
      const supportedTypes = [
        'audio/webm;codecs=opus', 
        'audio/webm', 
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];
      
      const mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (e) {
      setError(`Microphone access error: ${e.message}`);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (mediaRecorderRef.current && isListening) {
        mediaRecorderRef.current.onstop = async () => {
          setIsListening(false);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

          try {
            const result = await transcribeAudio(audioBlob, language);
            if (result.success) {
              setTranscript(result.data.transcript);
              resolve(result.data.extractedProfile);
            } else {
              reject(new Error('Transcription failed'));
            }
          } catch (e) {
            setError(e.response?.data?.error || e.message || 'Transcription failed');
            reject(e);
          }
        };
        mediaRecorderRef.current.stop();
      } else {
        resolve(null);
      }
    });
  }, [isListening, language]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return { isListening, transcript, error, startListening, stopListening, resetTranscript };
}
