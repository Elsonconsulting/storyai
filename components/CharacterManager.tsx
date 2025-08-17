
import React, { useState } from 'react';
import type { Character, AIProvider } from '../types';
import { Button } from './common/Button';
import { SparklesIcon, TrashIcon, PlusIcon, ImageIcon } from '../constants';
import { Spinner } from './common/Spinner';
import { generateCharacter, generateCharacterImage, refineCharacterDescription } from '../services/geminiService';
import { SuggestionBox } from './common/SuggestionBox';

interface CharacterManagerProps {
  characters: Character[];
  storyContext: string;
  onUpdateCharacters: (characters: Character[]) => void;
  addToast: (message: string, type: 'success' | 'error') => void;
  aiProvider: AIProvider;
}

type SuggestedCharacter = Omit<Character, 'id' | 'imageUrl'>;

const CharacterCard: React.FC<{
    character: Character;
    onUpdate: (id: string, field: keyof Character, value: string) => void;
    onDelete: (id: string) => void;
    onGenerateImage: (id: string, prompt: string) => Promise<void>;
    onRefineDescription: (id: string, name: string, description: string) => Promise<void>;
    isGeneratingImage: boolean;
    isRefiningDescription: boolean;
}> = ({ character, onUpdate, onDelete, onGenerateImage, onRefineDescription, isGeneratingImage, isRefiningDescription }) => {
    return (
        <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-700 flex flex-col">
            <div className="w-full h-56 bg-slate-900 flex items-center justify-center">
                {isGeneratingImage && character.imageUrl === '' ? <Spinner/> : 
                    character.imageUrl ? (
                        <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-slate-500"><ImageIcon /></div>
                    )
                }
            </div>
            <div className="p-4 flex-grow flex flex-col">
                <input
                    type="text"
                    value={character.name}
                    onChange={(e) => onUpdate(character.id, 'name', e.target.value)}
                    className="text-xl font-bold bg-transparent focus:outline-none w-full text-white mb-2"
                    aria-label="Character Name"
                />
                <textarea
                    value={character.description}
                    onChange={(e) => onUpdate(character.id, 'description', e.target.value)}
                    placeholder="Character description..."
                    className="w-full flex-grow bg-transparent text-slate-300 resize-none focus:outline-none mb-2 text-sm"
                    rows={4}
                    aria-label="Character Description"
                />
                 <input
                    type="text"
                    value={character.imagePrompt}
                    onChange={(e) => onUpdate(character.id, 'imagePrompt', e.target.value)}
                    placeholder="Visual prompt for image generation..."
                    className="w-full bg-slate-900 border border-slate-700 text-xs rounded-md p-2 text-slate-400 mb-3 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    aria-label="Character Image Prompt"
                />
                <div className="mt-auto grid grid-cols-2 gap-2">
                     <Button onClick={() => onRefineDescription(character.id, character.name, character.description)} isLoading={isRefiningDescription} variant="secondary" className="text-xs col-span-2" icon={<SparklesIcon/>} disabled={!character.description}>
                        Refine Description
                    </Button>
                    <Button onClick={() => onGenerateImage(character.id, character.imagePrompt)} isLoading={isGeneratingImage} variant="secondary" className="text-xs" icon={<ImageIcon/>}>
                        {character.imageUrl ? 'Regenerate' : 'Generate'} Image
                    </Button>
                    <Button onClick={() => onDelete(character.id)} variant="danger" className="p-2 h-9 w-9 !bg-slate-700 hover:!bg-red-600 justify-self-end" aria-label={`Delete ${character.name}`}>
                        <TrashIcon />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const CharacterManager: React.FC<CharacterManagerProps> = ({ characters, storyContext, onUpdateCharacters, addToast, aiProvider }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
    const [suggestedCharacter, setSuggestedCharacter] = useState<SuggestedCharacter | null>(null);
    const [refiningCharacterId, setRefiningCharacterId] = useState<string | null>(null);
    const [suggestedDescription, setSuggestedDescription] = useState<{ id: string, description: string } | null>(null);


    const handleAddCharacter = () => {
        onUpdateCharacters([
            ...characters,
            { id: crypto.randomUUID(), name: 'New Character', description: '', imageUrl: '', imagePrompt: '' },
        ]);
    };

    const handleGenerateCharacter = async () => {
        setIsGenerating(true);
        setSuggestedCharacter(null);
        try {
            const newCharData = await generateCharacter(storyContext, aiProvider);
            if (newCharData.name !== 'Error') {
                setSuggestedCharacter(newCharData);
                addToast("Character suggestion generated!", 'success');
            } else {
                addToast("Failed to generate character.", 'error');
            }
        } catch(e) {
            addToast("An error occurred while generating character.", 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAcceptCharacter = () => {
        if(suggestedCharacter) {
            onUpdateCharacters([...characters, { ...suggestedCharacter, id: crypto.randomUUID(), imageUrl: '' }]);
            setSuggestedCharacter(null);
            addToast("Character added to story.", "success");
        }
    };

    const handleRefineDescription = async (id: string, name: string, description: string) => {
        if (!description) {
            addToast("Character description is empty.", 'error');
            return;
        }
        setRefiningCharacterId(id);
        setSuggestedDescription(null);
        try {
            const result = await refineCharacterDescription(name, description, aiProvider);
            if (!result.startsWith("Failed")) {
                setSuggestedDescription({ id, description: result });
                addToast("Description refinement generated!", 'success');
            } else {
                addToast(result, 'error');
            }
        } catch(e) {
            addToast("An error occurred while refining description.", 'error');
        } finally {
            setRefiningCharacterId(null);
        }
    };

    const handleAcceptRefinedDescription = () => {
        if (suggestedDescription) {
            handleUpdateCharacter(suggestedDescription.id, 'description', suggestedDescription.description);
            setSuggestedDescription(null);
            addToast("Character description updated.", 'success');
        }
    }
    
    const handleUpdateCharacter = (id: string, field: keyof Character, value: string) => {
        onUpdateCharacters(characters.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const handleDeleteCharacter = (id: string) => {
        onUpdateCharacters(characters.filter(c => c.id !== id));
    };

    const handleGenerateImage = async (id: string, prompt: string) => {
        if (!prompt) {
            addToast("Please provide a visual prompt for the image.", 'error');
            return;
        }
        setGeneratingImageId(id);
        try {
            const imageUrl = await generateCharacterImage(prompt, aiProvider);
            if (imageUrl) {
                handleUpdateCharacter(id, 'imageUrl', imageUrl);
                addToast("Image generated successfully!", 'success');
            } else {
                addToast("Failed to generate image.", 'error');
            }
        } catch(e) {
            addToast("An error occurred while generating image.", 'error');
        } finally {
            setGeneratingImageId(null);
        }
    };

    return (
        <div className="px-8 pb-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">Characters</h2>
                <div className="flex gap-2">
                    <Button onClick={handleAddCharacter} variant="secondary" icon={<PlusIcon />}>Add Manually</Button>
                    <Button onClick={handleGenerateCharacter} isLoading={isGenerating} icon={<SparklesIcon />}>Generate with AI</Button>
                </div>
            </div>

            {suggestedCharacter && (
                <div className="mb-6">
                    <SuggestionBox
                        onAccept={handleAcceptCharacter}
                        onDismiss={() => setSuggestedCharacter(null)}
                        title="Suggested Character"
                        acceptLabel="Add Character"
                    >
                        <div className="text-slate-300">
                            <h5 className="text-lg font-bold text-teal-400">{suggestedCharacter.name}</h5>
                            <p className="my-2">{suggestedCharacter.description}</p>
                            <p className="text-xs text-slate-500 italic">Image Prompt: "{suggestedCharacter.imagePrompt}"</p>
                        </div>
                    </SuggestionBox>
                </div>
            )}

            {suggestedDescription && (
                <div className="mb-6">
                    <SuggestionBox
                        onAccept={handleAcceptRefinedDescription}
                        onDismiss={() => setSuggestedDescription(null)}
                        title={`Refinement for ${characters.find(c => c.id === suggestedDescription.id)?.name}`}
                        acceptLabel="Update Description"
                    >
                        <p className="text-slate-300 whitespace-pre-wrap">{suggestedDescription.description}</p>
                    </SuggestionBox>
                </div>
            )}

            <div className="flex-grow overflow-y-auto">
                {characters.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {characters.map(char => (
                            <CharacterCard
                                key={char.id}
                                character={char}
                                onUpdate={handleUpdateCharacter}
                                onDelete={handleDeleteCharacter}
                                onGenerateImage={handleGenerateImage}
                                isGeneratingImage={generatingImageId === char.id}
                                onRefineDescription={handleRefineDescription}
                                isRefiningDescription={refiningCharacterId === char.id}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-slate-400 py-16">
                        <p>No characters yet.</p>
                        <p>Add one manually or use the AI to generate a new character!</p>
                    </div>
                )}
            </div>
        </div>
    );
};