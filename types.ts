export interface Character {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imagePrompt: string;
}

export interface Subplot {
  id:string;
  title: string;
  description: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
}

export interface Story {
  title: string;
  overview: string;
  mainPlot: string;
  subplots: Subplot[];
  characters: Character[];
  chapters: Chapter[];
}

export enum View {
  Overview = 'overview',
  Plot = 'plot',
  Characters = 'characters',
  Chapters = 'chapters'
}

export enum AIProvider {
  Gemini = 'gemini',
  Mock = 'mock'
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}