
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type { Character, Subplot } from '../types';
import { AIProvider } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This check is important, but we only create the AI instance if the provider is Gemini
  console.info("API_KEY environment variable not set. Gemini provider will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

// --- Mock AI Implementations ---

const mockWait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockGenerateStoryOverview = async (prompt: string): Promise<string> => {
    await mockWait(500);
    return `This is a mock overview for: "${prompt}". It describes a world of wonder and danger, where our hero must make a difficult choice that will change their destiny forever. The stakes are high, and the clock is ticking.`;
};

const mockGenerateMainPlot = async (overview: string): Promise<string> => {
    await mockWait(600);
    return `This is a mock main plot based on the overview. It starts with an inciting incident, followed by rising action where the protagonist faces several challenges. The climax is a dramatic confrontation, leading to a satisfying resolution. Overview context: ${overview.substring(0, 50)}...`;
};

const mockGenerateSubplots = async (mainPlot: string): Promise<Omit<Subplot, 'id'>[]> => {
    await mockWait(700);
    return [
        { title: "Mock Subplot 1: A Secret Past", description: "A character's hidden history comes to light, complicating their relationships." },
        { title: "Mock Subplot 2: The Rival's Plan", description: "An antagonist works on a parallel scheme to thwart the hero." },
        { title: "Mock Subplot 3: A Budding Romance", description: "Two characters develop feelings for each other amidst the chaos." },
    ];
};

const mockGenerateCharacter = async (storyContext: string): Promise<Omit<Character, 'id' | 'imageUrl'>> => {
    await mockWait(800);
    const names = ["Alistair", "Brielle", "Kaelen", "Seraphina"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    return {
        name: `Mock ${randomName}`,
        description: `This is a mock character description for ${randomName}. They are brave, resourceful, and have a mysterious tattoo. Their loyalty is often tested.`,
        imagePrompt: `A mock character named ${randomName} with determined eyes and simple traveler's clothes.`
    };
};

const mockGenerateCharacterImage = async (prompt: string): Promise<string> => {
    await mockWait(1000);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 100 100"><rect width="100" height="100" fill="#4A5568"></rect><text x="50" y="55" font-family="sans-serif" font-size="12" fill="white" text-anchor="middle">Mock Image</text><style>text{font-weight:bold;}</style></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const mockContinueWritingChapter = async (chapterContent: string): Promise<string> => {
    await mockWait(500);
    return `This is a mock continuation. The hero, pondering their next move after the events of the previous paragraph, decides to venture into the Whispering Woods. They know the path is dangerous, but it is the only way to find the answers they seek.`;
};

const mockRefineText = async (text: string): Promise<string> => {
    await mockWait(500);
    if (!text) return "This is a refined suggestion for the empty text provided.";
    return `[AI Refinement]: Based on your input, here is a more polished version:\n\n"${text}" has been expanded with more evocative language and stronger narrative beats. We've added a layer of intrigue to the central conflict.`;
};


// --- Service Functions ---

export const generateStoryOverview = async (prompt: string, aiProvider: AIProvider): Promise<string> => {
  if (aiProvider === AIProvider.Mock) {
    return mockGenerateStoryOverview(prompt);
  }
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a compelling one-paragraph story overview based on this idea: "${prompt}"`,
      config: {
        systemInstruction: "You are a creative assistant for novelists, skilled at crafting engaging story summaries.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating story overview:", error);
    return "Failed to generate overview. Please try again.";
  }
};

export const generateMainPlot = async (overview: string, aiProvider: AIProvider): Promise<string> => {
    if (aiProvider === AIProvider.Mock) {
        return mockGenerateMainPlot(overview);
    }
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the following story overview, expand it into a detailed main plot, outlining the key events, conflicts, and resolutions in about 2-3 paragraphs:\n\nOVERVIEW:\n${overview}`,
            config: {
                systemInstruction: "You are a master storyteller who can flesh out story ideas into structured plots.",
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating main plot:", error);
        return "Failed to generate main plot. Please try again.";
    }
};

export const generateSubplots = async (mainPlot: string, aiProvider: AIProvider): Promise<Omit<Subplot, 'id'>[]> => {
    if (aiProvider === AIProvider.Mock) {
        return mockGenerateSubplots(mainPlot);
    }
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the following main plot, generate 3 distinct and interesting subplots that could enrich the story. For each subplot, provide a short title and a one-sentence description.\n\nMAIN PLOT:\n${mainPlot}`,
            config: {
                systemInstruction: "You are an expert in narrative structure, specializing in creating compelling subplots.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subplots: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                },
                                required: ["title", "description"]
                            }
                        }
                    },
                    required: ["subplots"]
                },
            }
        });
        const json = JSON.parse(response.text);
        return json.subplots || [];
    } catch (error) {
        console.error("Error generating subplots:", error);
        return [];
    }
};

export const refineMainPlot = async (mainPlot: string, aiProvider: AIProvider): Promise<string> => {
    if (aiProvider === AIProvider.Mock) {
        return mockRefineText(mainPlot);
    }
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Refine and enhance the following story plot. Improve the pacing, clarity, and emotional impact. Make it more engaging without changing the core events. \n\nPLOT:\n${mainPlot}`,
            config: {
                systemInstruction: "You are a master story editor, skilled at polishing and improving plot outlines.",
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error refining main plot:", error);
        return "Failed to refine main plot. Please try again.";
    }
};

export const refineSubplotDescription = async (title: string, description: string, aiProvider: AIProvider): Promise<string> => {
    if (aiProvider === AIProvider.Mock) {
        return mockRefineText(description);
    }
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Refine and expand the following subplot description. Add more detail, suggest a potential complication, or increase its connection to the main plot.\n\nSUBPLOT TITLE: ${title}\n\nDESCRIPTION:\n${description}`,
            config: {
                systemInstruction: "You are an expert in narrative structure, specializing in making subplots more compelling.",
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error refining subplot:", error);
        return "Failed to refine subplot. Please try again.";
    }
};


export const generateCharacter = async (storyContext: string, aiProvider: AIProvider): Promise<Omit<Character, 'id' | 'imageUrl'>> => {
    if (aiProvider === AIProvider.Mock) {
        return mockGenerateCharacter(storyContext);
    }
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a unique character profile based on the following story context. Provide a name, a detailed physical and personality description (around 50-70 words), and a simple visual prompt for an AI image generator (e.g., "A young woman with fiery red hair and green eyes, wearing leather armor").\n\nSTORY CONTEXT:\n${storyContext}`,
            config: {
                systemInstruction: "You are a character designer for fiction, creating memorable and vivid characters.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        imagePrompt: { type: Type.STRING },
                    },
                    required: ["name", "description", "imagePrompt"]
                },
            }
        });
        const json = JSON.parse(response.text);
        return json;
    } catch (error) {
        console.error("Error generating character:", error);
        return { name: 'Error', description: 'Failed to generate character.', imagePrompt: '' };
    }
};

export const generateCharacterImage = async (prompt: string, aiProvider: AIProvider): Promise<string> => {
  if (aiProvider === AIProvider.Mock) {
      return mockGenerateCharacterImage(prompt);
  }
  if (!prompt) return "";
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: `Portrait of a fantasy character: ${prompt}. Cinematic, detailed, fantasy art style.`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    return "";
  } catch (error) {
    console.error("Error generating character image:", error);
    return "";
  }
};

export const refineCharacterDescription = async (name: string, description: string, aiProvider: AIProvider): Promise<string> => {
    if (aiProvider === AIProvider.Mock) {
        return mockRefineText(description);
    }
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Refine and enrich the following character description. Add more depth, personality quirks, and vivid physical details. Hint at their backstory or motivations.\n\nCHARACTER NAME: ${name}\n\nDESCRIPTION:\n${description}`,
            config: {
                systemInstruction: "You are a character designer, skilled at bringing fictional characters to life with detail and depth.",
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error refining character:", error);
        return "Failed to refine character. Please try again.";
    }
};

export const refineChapterContent = async (chapterContent: string, aiProvider: AIProvider): Promise<string> => {
    if (aiProvider === AIProvider.Mock) {
        return mockRefineText(chapterContent);
    }
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Revise and enhance the following chapter excerpt. Improve the prose, pacing, and dialogue. Make it more immersive and engaging for the reader without altering the fundamental plot points.\n\nCHAPTER CONTENT:\n${chapterContent}`,
            config: {
                systemInstruction: "You are an expert developmental editor, polishing prose to a professional level.",
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error refining chapter:", error);
        return "\n\n[AI failed to refine the chapter. Please try again.]";
    }
};

export const continueWritingChapter = async (chapterContent: string, aiProvider: AIProvider): Promise<string> => {
    if (aiProvider === AIProvider.Mock) {
        return mockContinueWritingChapter(chapterContent);
    }
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Continue this story from where it left off. Add one or two paragraphs that logically follow the current text. Maintain the existing tone and style.\n\nSTORY SO FAR:\n${chapterContent}`,
            config: {
                systemInstruction: "You are a ghostwriter, seamlessly continuing a story.",
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error continuing chapter:", error);
        return "\n\n[AI failed to continue the story. Please try again.]";
    }
};