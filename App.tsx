import React, { useState, useCallback } from 'react';
import type { Story, ToastMessage, Character, Subplot, Chapter } from './types';
import { View, AIProvider } from './types';
import { Sidebar } from './components/Sidebar';
import { StoryOverview } from './components/StoryOverview';
import { PlotManager } from './components/PlotManager';
import { CharacterManager } from './components/CharacterManager';
import { ChapterEditor } from './components/ChapterEditor';
import { Toast } from './components/common/Toast';
import { saveStoryToLocalDirectory, loadStoryFromLocalFile } from './services/fileService';

const initialStory: Story = {
  title: 'Untitled Story',
  overview: '',
  mainPlot: '',
  subplots: [],
  characters: [],
  chapters: [],
};

const App: React.FC = () => {
  const [story, setStory] = useState<Story>(initialStory);
  const [activeView, setActiveView] = useState<View>(View.Overview);
  const [aiProvider, setAiProvider] = useState<AIProvider>(AIProvider.Gemini);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };
  
  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  const handleSave = async () => {
    setIsSaving(true);
    const success = await saveStoryToLocalDirectory(story);
    if (success) {
      addToast('Story saved successfully!', 'success');
    } else {
      addToast('Failed to save story.', 'error');
    }
    setIsSaving(false);
  };

  const handleLoad = async () => {
    setIsLoading(true);
    const loadedStory = await loadStoryFromLocalFile();
    if (loadedStory) {
      setStory(loadedStory);
      addToast('Story loaded successfully!', 'success');
    } else {
      // Error/abort is handled in the service, toast could be added here if desired
    }
    setIsLoading(false);
  };
  
  const handleDeleteStory = () => {
    if (window.confirm("Are you sure you want to delete the entire story? This action cannot be undone.")) {
      setStory(initialStory);
      setActiveView(View.Overview);
      addToast("Story deleted.", 'success');
    }
  };

  const handleProviderChange = useCallback((provider: AIProvider) => {
    setAiProvider(provider);
    addToast(`Switched to ${provider === AIProvider.Gemini ? 'Gemini AI' : 'Mock AI (Offline)'}.`, 'success');
  }, []);

  const handleUpdateTitle = useCallback((title: string) => {
    setStory(s => ({...s, title}));
  }, []);

  const handleUpdateOverview = useCallback((overview: string) => {
      setStory(s => ({...s, overview}));
  }, []);
  
  const handleUpdateMainPlot = useCallback((mainPlot: string) => {
      setStory(s => ({...s, mainPlot}));
  }, []);
  
  const handleUpdateSubplots = useCallback((subplots: Subplot[]) => {
      setStory(s => ({...s, subplots}));
  }, []);

  const handleUpdateCharacters = useCallback((characters: Character[]) => {
      setStory(s => ({...s, characters}));
  }, []);
  
  const handleUpdateChapters = useCallback((chapters: Chapter[]) => {
      setStory(s => ({...s, chapters}));
  }, []);

  const renderActiveView = () => {
    switch (activeView) {
      case View.Overview:
        return <StoryOverview overview={story.overview} onUpdate={handleUpdateOverview} addToast={addToast} aiProvider={aiProvider} />;
      case View.Plot:
        return <PlotManager mainPlot={story.mainPlot} subplots={story.subplots} overview={story.overview} onUpdateMainPlot={handleUpdateMainPlot} onUpdateSubplots={handleUpdateSubplots} addToast={addToast} aiProvider={aiProvider} />;
      case View.Characters:
        const storyContext = `Title: ${story.title}\nOverview: ${story.overview}\nPlot: ${story.mainPlot}`;
        return <CharacterManager characters={story.characters} storyContext={storyContext} onUpdateCharacters={handleUpdateCharacters} addToast={addToast} aiProvider={aiProvider} />;
      case View.Chapters:
        return <ChapterEditor chapters={story.chapters} onUpdateChapters={handleUpdateChapters} addToast={addToast} aiProvider={aiProvider} />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex h-screen w-full font-sans">
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          onSave={handleSave}
          onLoad={handleLoad}
          onDeleteStory={handleDeleteStory}
          isSaving={isSaving}
          isLoading={isLoading}
          aiProvider={aiProvider}
          onProviderChange={handleProviderChange}
        />
        <main className="flex-1 bg-slate-900 h-full flex flex-col">
            <div className="px-8 pt-8 pb-4 flex-shrink-0">
                <input
                    type="text"
                    value={story.title}
                    onChange={(e) => handleUpdateTitle(e.target.value)}
                    placeholder="Story Title"
                    className="w-full bg-transparent text-4xl font-bold text-white focus:outline-none border-b-2 border-slate-800 focus:border-teal-500 transition-colors py-2"
                />
            </div>
            <div className="flex-grow overflow-hidden">
                {renderActiveView()}
            </div>
        </main>
      </div>
      <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
          <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
              {toasts.map(toast => (
                  <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
              ))}
          </div>
      </div>
    </>
  );
};

export default App;