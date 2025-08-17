
import React, { useState, useEffect } from 'react';
import type { Chapter, AIProvider } from '../types';
import { Button } from './common/Button';
import { PlusIcon, SparklesIcon, TrashIcon } from '../constants';
import { continueWritingChapter, refineChapterContent } from '../services/geminiService';
import { SuggestionBox } from './common/SuggestionBox';

interface ChapterEditorProps {
  chapters: Chapter[];
  onUpdateChapters: (chapters: Chapter[]) => void;
  addToast: (message: string, type: 'success' | 'error') => void;
  aiProvider: AIProvider;
}

export const ChapterEditor: React.FC<ChapterEditorProps> = ({ chapters, onUpdateChapters, addToast, aiProvider }) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [isContinuing, setIsContinuing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [suggestion, setSuggestion] = useState<{type: 'continue' | 'refine', content: string} | null>(null);

  useEffect(() => {
    if (!selectedChapterId && chapters.length > 0) {
      setSelectedChapterId(chapters[0].id);
    }
    if (selectedChapterId && !chapters.some(c => c.id === selectedChapterId)) {
        setSelectedChapterId(chapters.length > 0 ? chapters[0].id : null);
    }
  }, [chapters, selectedChapterId]);

  const selectedChapter = chapters.find(c => c.id === selectedChapterId);

  const handleAddChapter = () => {
    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      title: `Chapter ${chapters.length + 1}`,
      content: '',
    };
    onUpdateChapters([...chapters, newChapter]);
    setSelectedChapterId(newChapter.id);
  };
  
  const handleDeleteChapter = (id: string) => {
    onUpdateChapters(chapters.filter(c => c.id !== id));
  }

  const handleUpdateChapter = (id: string, field: 'title' | 'content', value: string) => {
    if (field === 'content') {
        setSuggestion(null);
    }
    onUpdateChapters(chapters.map(c => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleContinue = async () => {
    if (!selectedChapter) return;
    setIsContinuing(true);
    setSuggestion(null);
    try {
        const continuation = await continueWritingChapter(selectedChapter.content, aiProvider);
        if (!continuation.includes("[AI failed")) {
            setSuggestion({type: 'continue', content: continuation});
            addToast("Suggestion generated successfully!", "success");
        } else {
            addToast("Failed to continue chapter.", "error");
        }
    } catch(e) {
        addToast("Failed to continue chapter.", "error");
    } finally {
        setIsContinuing(false);
    }
  };
  
  const handleRefine = async () => {
    if (!selectedChapter || !selectedChapter.content) {
        addToast("There is no content to refine.", 'error');
        return;
    };
    setIsRefining(true);
    setSuggestion(null);
    try {
        const refinedContent = await refineChapterContent(selectedChapter.content, aiProvider);
        if (!refinedContent.includes("[AI failed")) {
            setSuggestion({type: 'refine', content: refinedContent});
            addToast("Refinement generated successfully!", "success");
        } else {
            addToast("Failed to refine chapter.", "error");
        }
    } catch(e) {
        addToast("Failed to refine chapter.", "error");
    } finally {
        setIsRefining(false);
    }
  }

  const handleAcceptSuggestion = () => {
    if (suggestion && selectedChapter) {
        if (suggestion.type === 'continue') {
            const currentContent = selectedChapter.content.trim();
            const separator = currentContent ? '\n\n' : '';
            handleUpdateChapter(selectedChapter.id, 'content', currentContent + separator + suggestion.content);
            addToast("Chapter updated.", "success");
        } else { // type === 'refine'
            handleUpdateChapter(selectedChapter.id, 'content', suggestion.content);
            addToast("Chapter content replaced.", "success");
        }
        setSuggestion(null);
    }
  }

  return (
    <div className="h-full flex">
      <aside className="w-1/4 bg-slate-800 p-4 border-r border-slate-700 flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Chapters</h3>
            <Button onClick={handleAddChapter} className="p-2 h-9 w-9" aria-label="Add New Chapter">
                <PlusIcon />
            </Button>
        </div>
        <ul className="space-y-2 overflow-y-auto flex-grow">
          {chapters.map(chap => (
            <li key={chap.id}>
              <button
                onClick={() => {
                    setSelectedChapterId(chap.id);
                    setSuggestion(null);
                }}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  selectedChapterId === chap.id ? 'bg-teal-600 text-white' : 'hover:bg-slate-700'
                }`}
              >
                <span className="font-semibold block truncate">{chap.title}</span>
                <span className="text-xs text-slate-400 block truncate">{chap.content.substring(0, 40) || 'Empty chapter'}...</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <main className="w-3/4 px-8 pb-8 flex flex-col bg-slate-900">
        {selectedChapter ? (
          <>
            <div className='flex justify-between items-center my-4'>
                <input
                type="text"
                value={selectedChapter.title}
                onChange={e => handleUpdateChapter(selectedChapter.id, 'title', e.target.value)}
                className="text-3xl font-bold bg-transparent focus:outline-none w-full text-white"
                aria-label="Chapter Title"
                />
                <Button onClick={() => handleDeleteChapter(selectedChapter.id)} variant="danger" className="p-2 h-9 w-9 !bg-transparent !text-slate-400 hover:!bg-red-500 hover:!text-white" aria-label={`Delete ${selectedChapter.title}`}>
                    <TrashIcon />
                </Button>
            </div>
            
            <div className="flex-grow flex flex-col">
                <textarea
                value={selectedChapter.content}
                onChange={e => handleUpdateChapter(selectedChapter.id, 'content', e.target.value)}
                placeholder="Begin your chapter here..."
                className="w-full h-full flex-grow bg-slate-800 border border-slate-700 rounded-md p-4 text-slate-200 resize-none focus:ring-2 focus:ring-teal-500 focus:outline-none"
                aria-label="Chapter Content"
                />
            </div>
            <div className="mt-4 flex justify-end gap-2">
                 <Button onClick={handleRefine} isLoading={isRefining} variant="secondary" icon={<SparklesIcon />} disabled={!selectedChapter?.content}>
                    Refine with AI
                </Button>
                <Button onClick={handleContinue} isLoading={isContinuing} icon={<SparklesIcon />}>
                    Continue with AI
                </Button>
            </div>
            {suggestion && (
              <div className="flex-shrink-0 mt-4">
                  <SuggestionBox
                    onAccept={handleAcceptSuggestion}
                    onDismiss={() => setSuggestion(null)}
                    title={suggestion.type === 'continue' ? "Suggested Continuation" : "Suggested Refinement"}
                    acceptLabel={suggestion.type === 'continue' ? "Append to Chapter" : "Replace Content"}
                  >
                      <p className="text-slate-300 whitespace-pre-wrap">{suggestion.content}</p>
                  </SuggestionBox>
              </div>
            )}
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center text-slate-500">
            <div className="text-center">
              <h2 className="text-2xl font-semibold">No Chapter Selected</h2>
              <p>Add or select a chapter to start writing.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};