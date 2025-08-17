import React, { useState } from 'react';
import { Button } from './common/Button';
import { SparklesIcon } from '../constants';
import { generateStoryOverview } from '../services/geminiService';
import { SuggestionBox } from './common/SuggestionBox';
import type { AIProvider } from '../types';

interface StoryOverviewProps {
  overview: string;
  onUpdate: (newOverview: string) => void;
  addToast: (message: string, type: 'success' | 'error') => void;
  aiProvider: AIProvider;
}

export const StoryOverview: React.FC<StoryOverviewProps> = ({ overview, onUpdate, addToast, aiProvider }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) {
      addToast("Please enter a prompt to generate an overview.", 'error');
      return;
    }
    setIsLoading(true);
    setSuggestion(null);
    try {
      const result = await generateStoryOverview(prompt, aiProvider);
      if (result.startsWith("Failed")) {
        addToast(result, 'error');
      } else {
        setSuggestion(result);
        addToast("Suggestion generated successfully!", 'success');
      }
    } catch (e) {
      addToast("Failed to generate suggestion.", 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAcceptSuggestion = () => {
    if (suggestion) {
      onUpdate(suggestion);
      setSuggestion(null);
      addToast("Overview updated.", 'success');
    }
  };

  return (
    <div className="px-8 pb-8 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold mb-6 text-white">Story Overview</h2>
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
        <p className="text-slate-400 mb-4">
          Start with a core idea or a theme. Our AI can help you flesh it out into a compelling story overview.
        </p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A detective in a cyberpunk city hunts a rogue AI"
            className="flex-grow bg-slate-900 border border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <Button onClick={handleGenerate} isLoading={isLoading} icon={<SparklesIcon />}>
            Generate
          </Button>
        </div>
        <textarea
          value={overview}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Describe the overall theme, tone, and summary of your story here..."
          className="w-full h-96 bg-slate-900 border border-slate-700 rounded-md p-4 text-slate-200 resize-none focus:ring-2 focus:ring-teal-500 focus:outline-none"
          aria-label="Story Overview"
        />

        {suggestion && (
            <SuggestionBox
                title="Suggested Overview"
                onAccept={handleAcceptSuggestion}
                onDismiss={() => setSuggestion(null)}
            >
                <p className="text-slate-300 whitespace-pre-wrap">{suggestion}</p>
            </SuggestionBox>
        )}
      </div>
    </div>
  );
};