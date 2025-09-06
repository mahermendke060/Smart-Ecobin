import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Volume2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const VoiceAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);

  const recognition = useRef<any>(null);

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        setTranscript(speechResult);
        handleSpeechInput(speechResult);
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Speech Recognition Error",
          description: "Could not process speech. Please try again.",
          variant: "destructive",
        });
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const startListening = () => {
    if (!recognition.current) {
      initializeSpeechRecognition();
    }
    
    if (recognition.current) {
      setIsListening(true);
      setTranscript('');
      recognition.current.start();
    } else {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (recognition.current && isListening) {
      recognition.current.stop();
    }
  };

  const handleSpeechInput = async (text: string) => {
    try {
      // Use ElevenLabs Conversational AI agent
      const { data, error } = await supabase.functions.invoke('elevenlabs-agent', {
        body: { 
          message: text,
          agent_id: 'agent_2501k49fw5tffb8tw0x104q2x8nz'
        }
      });

      if (error) {
        throw error;
      }

      // Set the response text for display
      if (data?.response) {
        setResponse(data.response);
      }

      // Play the audio response
      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audioRef.current = audio;
        setIsPlaying(true);
        
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          toast({
            title: "Audio Error",
            description: "Could not play audio response.",
            variant: "destructive",
          });
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Error processing speech:', error);
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    }
  };


  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg z-50"
          size="icon"
        >
          <Mic className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Voice Assistant Card */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-80 p-4 shadow-lg z-50 bg-background border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Voice Assistant</h3>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Transcript Display */}
            {transcript && (
              <div className="p-2 bg-muted rounded text-sm">
                <strong>You said:</strong> {transcript}
              </div>
            )}

            {/* Response Display */}
            {response && (
              <div className="p-2 bg-primary/10 rounded text-sm">
                <strong>Assistant:</strong> {response}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                onClick={isListening ? stopListening : startListening}
                disabled={isPlaying}
                variant={isListening ? "destructive" : "default"}
                size="sm"
              >
                {isListening ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Start Listening
                  </>
                )}
              </Button>

              {isPlaying && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Volume2 className="h-4 w-4 mr-1" />
                  Playing...
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Click "Start Listening" and speak your question about waste management, bin locations, or recycling.
            </p>
          </div>
        </Card>
      )}
    </>
  );
};

export default VoiceAssistant;