
import React, { useState } from 'react';
import type { Subplot, AIProvider } from '../types';
import { Button } from './common/Button';
import { SparklesIcon, TrashIcon, PlusIcon } from '../constants';
import { generateMainPlot, generateSubplots, refineMainPlot, refineSubplotDescription } from '../services/geminiService';
import { SuggestionBox } from './common/SuggestionBox';

interface PlotManagerProps {
  mainPlot: string;
  subplots: Subplot[];
  overview: string;
  onUpdateMainPlot: (plot: string) => void;
  onUpdateSubplots: (subplots: Subplot[]) => void;
  addToast: (message: string, type: 'success' | 'error') => void;
  aiProvider: AIProvider;
}

export const PlotManager: React.FC<PlotManagerProps> = ({
  mainPlot,
  subplots,
  overview,
  onUpdateMainPlot,
  onUpdateSubplots,
  addToast,
  aiProvider
}) => {
  const [plotLoading, setPlotLoading] = useState(false);
  const [plotRefining, setPlotRefining] = useState(false);
  const [subplotsLoading, setSubplotsLoading] = useState(false);
  const [subplotsRefiningId, setSubplotsRefiningId] = useState<string | null>(null);
  
  const [suggestedMainPlot, setSuggestedMainPlot] = useState<string | null>(null);
  const [suggestedRefinedPlot, setSuggestedRefinedPlot] = useState<string | null>(null);
  const [suggestedSubplots, setSuggestedSubplots] = useState<Omit<Subplot, 'id'>[] | null>(null);
  const [suggestedRefinedSubplot, setSuggestedRefinedSubplot] = useState<{id: string, description: string} | null>(null);


  const handleGeneratePlot = async () => {
    if (!overview) {
        addToast("Please write an overview first to generate a plot.", 'error');
        return;
    }
    setPlotLoading(true);
    setSuggestedMainPlot(null);
    setSuggestedRefinedPlot(null);
    try {
      const result = await generateMainPlot(overview, aiProvider);
      setSuggestedMainPlot(result);
      addToast("Main plot suggestion generated!", 'success');
    } catch(e) {
      addToast("Failed to generate main plot.", 'error');
    } finally {
      setPlotLoading(false);
    }
  };

  const handleAcceptPlot = () => {
    if(suggestedMainPlot) {
        onUpdateMainPlot(suggestedMainPlot);
        setSuggestedMainPlot(null);
        addToast("Main plot updated.", "success");
    }
  }

  const handleRefinePlot = async () => {
    if (!mainPlot) {
        addToast("The main plot is empty. There's nothing to refine.", 'error');
        return;
    }
    setPlotRefining(true);
    setSuggestedRefinedPlot(null);
    setSuggestedMainPlot(null);
    try {
        const result = await refineMainPlot(mainPlot, aiProvider);
        setSuggestedRefinedPlot(result);
        addToast("Main plot refinement suggestion generated!", 'success');
    } catch (e) {
        addToast("Failed to refine main plot.", 'error');
    } finally {
        setPlotRefining(false);
    }
  }

  const handleAcceptRefinedPlot = () => {
    if (suggestedRefinedPlot) {
        onUpdateMainPlot(suggestedRefinedPlot);
        setSuggestedRefinedPlot(null);
        addToast("Main plot updated with refinement.", 'success');
    }
  }

  const handleGenerateSubplots = async () => {
    if (!mainPlot) {
        addToast("Please write a main plot first to generate subplots.", 'error');
        return;
    }
    setSubplotsLoading(true);
    setSuggestedSubplots(null);
    try {
      const newSubplotsData = await generateSubplots(mainPlot, aiProvider);
      setSuggestedSubplots(newSubplotsData);
      addToast("Subplot suggestions generated successfully!", 'success');
    } catch(e) {
      addToast("Failed to generate subplots.", 'error');
    } finally {
      setSubplotsLoading(false);
    }
  };
  
  const handleAcceptSubplots = () => {
    if(suggestedSubplots) {
        const newSubplotsWithIds = suggestedSubplots.map(sp => ({ ...sp, id: crypto.randomUUID() }));
        onUpdateSubplots([...subplots, ...newSubplotsWithIds]);
        setSuggestedSubplots(null);
        addToast("Subplots added.", "success");
    }
  }

  const handleRefineSubplot = async (subplot: Subplot) => {
    if (!subplot.description) {
        addToast("Subplot description is empty.", 'error');
        return;
    }
    setSubplotsRefiningId(subplot.id);
    setSuggestedRefinedSubplot(null);
    try {
        const result = await refineSubplotDescription(subplot.title, subplot.description, aiProvider);
        setSuggestedRefinedSubplot({ id: subplot.id, description: result });
        addToast("Subplot refinement generated!", 'success');
    } catch (e) {
        addToast("Failed to refine subplot.", 'error');
    } finally {
        setSubplotsRefiningId(null);
    }
  }

  const handleAcceptRefinedSubplot = () => {
    if (suggestedRefinedSubplot) {
        handleUpdateSubplot(suggestedRefinedSubplot.id, 'description', suggestedRefinedSubplot.description);
        setSuggestedRefinedSubplot(null);
        addToast("Subplot updated.", "success");
    }
  }

  const handleAddSubplot = () => {
    onUpdateSubplots([...subplots, {id: crypto.randomUUID(), title: 'New Subplot', description: ''}]);
  };
  
  const handleUpdateSubplot = (id: string, field: 'title' | 'description', value: string) => {
    onUpdateSubplots(subplots.map(sp => sp.id === id ? {...sp, [field]: value} : sp));
  };
  
  const handleDeleteSubplot = (id: string) => {
    onUpdateSubplots(subplots.filter(sp => sp.id !== id));
  };


  return (
    <div className="px-8 pb-8 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold mb-6 text-white">Plot & Subplots</h2>
      
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-teal-400">Main Plot</h3>
          <div className="flex gap-2">
            <Button onClick={handleRefinePlot} isLoading={plotRefining} variant="secondary" icon={<SparklesIcon />} disabled={!mainPlot}>Refine with AI</Button>
            <Button onClick={handleGeneratePlot} isLoading={plotLoading} icon={<SparklesIcon />}>Generate from Overview</Button>
          </div>
        </div>
        <textarea
          value={mainPlot}
          onChange={(e) => onUpdateMainPlot(e.target.value)}
          placeholder="Outline the main sequence of events in your story..."
          className="w-full h-60 bg-slate-900 border border-slate-700 rounded-md p-4 text-slate-200 resize-y focus:ring-2 focus:ring-teal-500 focus:outline-none"
          aria-label="Main Plot"
        />
        {suggestedMainPlot && (
            <SuggestionBox onAccept={handleAcceptPlot} onDismiss={() => setSuggestedMainPlot(null)} title="Suggested Main Plot">
                <p className="text-slate-300 whitespace-pre-wrap">{suggestedMainPlot}</p>
            </SuggestionBox>
        )}
        {suggestedRefinedPlot && (
            <SuggestionBox onAccept={handleAcceptRefinedPlot} onDismiss={() => setSuggestedRefinedPlot(null)} title="Refined Main Plot Suggestion" acceptLabel="Replace Plot">
                <p className="text-slate-300 whitespace-pre-wrap">{suggestedRefinedPlot}</p>
            </SuggestionBox>
        )}
      </div>

      <div className="bg-slate-800 p-6 rounded-lg shadow-lg mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-teal-400">Subplots</h3>
          <div className="flex gap-2">
            <Button onClick={handleAddSubplot} variant="secondary" icon={<PlusIcon />}>Add Manually</Button>
            <Button onClick={handleGenerateSubplots} isLoading={subplotsLoading} icon={<SparklesIcon />}>Generate from Plot</Button>
          </div>
        </div>
        <div className="space-y-4">
          {subplots.map((subplot) => (
            <div key={subplot.id} className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <input
                  type="text"
                  value={subplot.title}
                  onChange={(e) => handleUpdateSubplot(subplot.id, 'title', e.target.value)}
                  className="text-lg font-bold bg-transparent focus:outline-none w-full text-white"
                  aria-label={`Subplot Title for ${subplot.title}`}
                />
                <div className="flex items-center">
                    <Button onClick={() => handleRefineSubplot(subplot)} variant="secondary" className="p-1 h-8 w-8 !bg-transparent !text-slate-400 hover:!bg-teal-600 hover:!text-white" isLoading={subplotsRefiningId === subplot.id} disabled={!subplot.description} aria-label={`Refine ${subplot.title}`}>
                        <SparklesIcon />
                    </Button>
                    <Button onClick={() => handleDeleteSubplot(subplot.id)} variant="danger" className="p-1 h-8 w-8 !bg-transparent !text-slate-400 hover:!bg-red-500 hover:!text-white" aria-label={`Delete ${subplot.title}`}>
                        <TrashIcon />
                    </Button>
                </div>
              </div>
              <textarea
                value={subplot.description}
                onChange={(e) => handleUpdateSubplot(subplot.id, 'description', e.target.value)}
                placeholder="Describe this subplot..."
                className="w-full bg-transparent text-slate-300 resize-none focus:outline-none"
                rows={2}
                aria-label={`Subplot Description for ${subplot.title}`}
              />
            </div>
          ))}
          {subplots.length === 0 && <p className="text-slate-400 text-center py-4">No subplots yet. Add one manually or generate with AI!</p>}
        </div>
        {suggestedRefinedSubplot && (
            <SuggestionBox onAccept={handleAcceptRefinedSubplot} onDismiss={() => setSuggestedRefinedSubplot(null)} title={`Refinement for "${subplots.find(s => s.id === suggestedRefinedSubplot.id)?.title}"`} acceptLabel="Update Subplot">
                <p className="text-slate-300 whitespace-pre-wrap">{suggestedRefinedSubplot.description}</p>
            </SuggestionBox>
        )}
        {suggestedSubplots && (
            <SuggestionBox onAccept={handleAcceptSubplots} onDismiss={() => setSuggestedSubplots(null)} title="Suggested Subplots" acceptLabel="Add to Story">
                <div className="space-y-3">
                    {suggestedSubplots.map((sp, index) => (
                        <div key={index} className="bg-slate-900 p-3 rounded-md">
                            <h5 className="font-semibold text-teal-400">{sp.title}</h5>
                            <p className="text-slate-400 text-sm">{sp.description}</p>
                        </div>
                    ))}
                </div>
            </SuggestionBox>
        )}
      </div>
    </div>
  );
};