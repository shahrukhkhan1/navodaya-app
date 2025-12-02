import React, { useState, useCallback, useEffect } from 'react';
import { nanoid } from 'nanoid';
import Header from './components/Header';
import TutorConfig from './components/TutorConfig';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import type { TutorConfigData, ChatMessage } from './types';
import { MessageAuthor, TUTOR_LEVEL_OPTIONS } from './types';
import { extractProblemFromImage, startTutorChat, continueTutorChat } from './services/geminiService';

const LOCAL_STORAGE_KEY = 'jnvTutorSession';

interface SessionState {
  config: TutorConfigData;
  history: ChatMessage[];
  problem: string | null;
  isSolved: boolean;
}

const getInitialState = (): SessionState => {
  try {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      // Ensure config has a valid level, otherwise reset to default
      if (TUTOR_LEVEL_OPTIONS.includes(parsedState.config.level)) {
        return parsedState;
      }
    }
  } catch (error) {
    console.error("Failed to parse saved state:", error);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
  return {
    config: {
      level: TUTOR_LEVEL_OPTIONS[0],
    },
    history: [],
    problem: null,
    isSolved: false,
  };
};


// Helper to read file as base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove the data URL prefix
    };
    reader.onerror = (error) => reject(error);
  });
};

const App: React.FC = () => {
  const [session, setSession] = useState<SessionState>(getInitialState);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  const addMessage = (author: MessageAuthor, content: string) => {
    setSession(prev => ({
      ...prev,
      history: [...prev.history, { id: nanoid(), author, content }],
    }));
  };

  const resetSession = useCallback(() => {
    const newSession = getInitialState();
    // Keep user's config settings on reset
    newSession.config = session.config; 
    setSession(newSession);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, [session.config]);

  const handleAIResponse = (text: string) => {
    // Handle new problem generation
    if (text.includes('[NEW_PROBLEM]')) {
      const newProblemText = text.match(/\[NEW_PROBLEM\](.*)\[\/NEW_PROBLEM\]/s)?.[1] || "एक नया प्रश्न";
      setSession(prev => ({ ...prev, problem: newProblemText, history: [], isSolved: false }));
      addMessage(MessageAuthor.AI, `बहुत अच्छे! आपके लिए यह रहा नया प्रश्न:\n\n**${newProblemText}**`);
      addMessage(MessageAuthor.AI, "मैं पहला कदम तैयार कर रहा हूँ... 🤔");
      startTutorChat(session.config, newProblemText)
        .then(firstStep => addMessage(MessageAuthor.AI, firstStep))
        .catch(error => {
            console.error(error);
            addMessage(MessageAuthor.AI, "एक त्रुटि हुई। कृपया दोबारा प्रयास करें।");
        });
      return;
    }

    // Handle problem solved
    if (text.includes('[SOLVED]')) {
      const cleanedText = text.replace('[SOLVED]', '').trim();
      addMessage(MessageAuthor.AI, cleanedText);
      setSession(prev => ({ ...prev, isSolved: true }));
    } else {
      addMessage(MessageAuthor.AI, text);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (isLoading) return;
    
    resetSession();
    setIsLoading(true);

    try {
      addMessage(MessageAuthor.AI, "चित्र का विश्लेषण किया जा रहा है... 🧐");
      const base64 = await fileToBase64(file);
      
      const problemText = await extractProblemFromImage(base64, file.type);
      
      if (problemText.includes("माफ़ कीजिए, मुझे चित्र में दिया गया प्रश्न समझ नहीं आया।")) {
         addMessage(MessageAuthor.AI, problemText);
         setIsLoading(false);
         return;
      }

      setSession(prev => ({ ...prev, problem: problemText }));
      addMessage(MessageAuthor.AI, `ठीक है, मुझे प्रश्न मिल गया है:\n\n**${problemText}**`);
      addMessage(MessageAuthor.AI, "चलिए इसे मिलकर हल करते हैं! मैं आपके लिए पहला कदम तैयार कर रहा हूँ... 🤔");
      
      const firstStep = await startTutorChat(session.config, problemText);
      handleAIResponse(firstStep);
    } catch (error) {
      console.error(error);
      addMessage(MessageAuthor.AI, "एक त्रुटि हुई। कृपया अपनी छवि फिर से अपलोड करने का प्रयास करें।");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading || session.isSolved) return;

    addMessage(MessageAuthor.USER, message);
    setIsLoading(true);

    try {
        const aiResponse = await continueTutorChat(message);
        handleAIResponse(aiResponse);
    } catch (error) {
        console.error(error);
        addMessage(MessageAuthor.AI, "माफ़ कीजिए, मुझे जवाब देने में समस्या हुई। कृपया दोबारा प्रयास करें।");
    } finally {
        setIsLoading(false);
    }
  };

  const handleRequestPracticeProblem = () => {
    handleSendMessage("कृपया मुझे पिछले प्रश्न से संबंधित एक नया अभ्यास प्रश्न दें।");
  }

  const isSessionActive = session.problem !== null;

  return (
    <div className="flex flex-col h-screen font-sans">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-gray-900">
        <div className="max-w-4xl mx-auto h-full">
            {!isSessionActive ? (
                <div className="space-y-6 bg-gray-800 p-8 rounded-lg shadow-xl">
                    <TutorConfig 
                        value={session.config} 
                        onChange={(newConfig) => setSession(s => ({...s, config: newConfig}))}
                        disabled={isLoading}
                    />
                    <FileUpload 
                        onFileUpload={handleImageUpload}
                        disabled={isLoading}
                    />
                    {isLoading && session.history.length > 0 && (
                        <div className="text-center text-cyan-400 font-medium">
                            {session.history[session.history.length - 1].content}
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-full" style={{height: 'calc(100% - 1rem)'}}>
                     <ChatInterface 
                        messages={session.history} 
                        onSendMessage={handleSendMessage} 
                        isLoading={isLoading}
                        onReset={resetSession}
                        isSolved={session.isSolved}
                        onRequestPracticeProblem={handleRequestPracticeProblem}
                    />
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default App;
