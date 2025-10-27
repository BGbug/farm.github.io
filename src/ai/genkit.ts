
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // The model specified here is a default, but it can be overridden in specific flows.
  model: 'google-genai/gemini-1.5-flash',
});

    