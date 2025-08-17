
import type { Story } from '../types';

/**
 * Triggers a browser download of the entire story object as a single JSON file.
 * This method is compatible with all browsers and environments, including sandboxed iframes.
 * @param story The story object to save.
 * @returns A promise that resolves to true if the download was initiated, false otherwise.
 */
export const saveStoryToLocalDirectory = async (story: Story): Promise<boolean> => {
  try {
    const storyJson = JSON.stringify(story, null, 2);
    const blob = new Blob([storyJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    // Create a safe filename from the story title, or use a default.
    const fileName = `${story.title.replace(/[^a-z0-9]/gi, '_') || 'story_forge_project'}.json`;
    a.download = fileName;
    
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error saving story:', error);
    return false;
  }
};

/**
 * Prompts the user to select a local JSON file to load a story from.
 * This uses a standard file input element for maximum compatibility.
 * @returns A promise that resolves with the loaded Story object, or null if the process is cancelled or fails.
 */
export const loadStoryFromLocalFile = async (): Promise<Story | null> => {
  return new Promise((resolve) => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const contents = e.target?.result as string;
            const storyData = JSON.parse(contents);

            // Basic validation to ensure it's a story file
            if ('title' in storyData && 'overview' in storyData && 'mainPlot' in storyData && 'characters' in storyData) {
              resolve(storyData as Story);
            } else {
              alert("Invalid story file format.");
              resolve(null);
            }
          } catch (jsonError) {
            console.error('Error parsing story file:', jsonError);
            alert("Failed to parse story file. It may be corrupt or not a valid story project.");
            resolve(null);
          }
        };
        
        reader.onerror = () => {
          console.error('Error reading file:', reader.error);
          alert("Failed to read the selected file.");
          resolve(null);
        };

        reader.readAsText(file);
      };
      
      // The user cancelling the file dialog is a normal operation, not an error.
      // We handle it by doing nothing and letting the promise resolve with null eventually.
      input.click();

    } catch (error) {
      console.error('Error creating file input for loading:', error);
      alert('An error occurred while trying to open the file picker.');
      resolve(null);
    }
  });
};
