
// // 'use server'; // Disabled for static export // Disabled for static export

/**
 * @fileOverview AI agent for suggesting crops based on environmental factors.
 *
 * - suggestCrops - A function that suggests crops.
 * - SuggestCropsInput - The input type for the suggestCrops function.
 * - SuggestCropsOutput - The return type for the suggestCrops function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCropsInputSchema = z.object({
  soilPhotoDataUri: z.string().describe(
      "A photo of the soil, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  currentMonth: z.string().describe('The current month to determine the planting season in India (e.g., January, July).'),
  waterResourceNotes: z.string().optional().describe('Optional notes on water availability, like "well-fed irrigation" or "rain-fed only".')
});
export type SuggestCropsInput = z.infer<typeof SuggestCropsInputSchema>;

const CropSuggestionSchema = z.object({
    name: z.string().describe('The name of the suggested crop.'),
    type: z.enum(['Vegetable', 'Paddy', 'Pulse', 'Fruit', 'Other']).describe('The category of the crop.'),
    reasoning: z.string().describe('Why this crop is a good choice for the given environment, considering soil, climate, and water.'),
    estimatedGrowthDays: z.number().describe('The estimated number of days from planting to harvest.'),
    wateringNeeds: z.string().describe('General guidance on how much water the crop needs.')
});

const SuggestCropsOutputSchema = z.object({
  suggestions: z.array(CropSuggestionSchema).describe('A list of up to three suitable crop suggestions.'),
  soilAnalysis: z.string().describe('A brief analysis of the soil type and quality based on the provided image.'),
});
export type SuggestCropsOutput = z.infer<typeof SuggestCropsOutputSchema>;

export async function suggestCrops(input: SuggestCropsInput): Promise<SuggestCropsOutput> {
  return suggestCropsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCropsPrompt',
  input: {schema: SuggestCropsInputSchema},
  output: {schema: SuggestCropsOutputSchema},
  prompt: `You are an expert agronomist specializing in Indian agriculture. Your task is to analyze an image of soil and other factors to suggest suitable crops for planting in India.

First, analyze the provided soil image and provide a brief 'soilAnalysis' describing its likely type (e.g., sandy, clay, loam) and quality.

Then, based on your soil analysis, the current month, and water availability, suggest up to three suitable crops. You must consider the Indian cropping seasons (Kharif, Rabi, Zaid) based on the month. For each suggestion, provide the crop name, its type (Vegetable, Paddy, Pulse, Fruit, or Other), a brief reasoning for why it's a good fit, the estimated growth duration in days, and general watering advice.

Factors to consider:
- Soil Photo: {{media url=soilPhotoDataUri}}
- Planting Month in India: {{{currentMonth}}}
{{#if waterResourceNotes}}
- Water Availability: {{{waterResourceNotes}}}
{{/if}}
`,
});

const suggestCropsFlow = ai.defineFlow(
  {
    name: 'suggestCropsFlow',
    inputSchema: SuggestCropsInputSchema,
    outputSchema: SuggestCropsOutputSchema,
  },
  async input => {
    try {
        const {output} = await prompt(input);
        return output!;
    } catch (e: any) {
        console.error(e);
        return {
            suggestions: [],
            soilAnalysis: 'The AI model could not process the request. Please try again with a different image or description.',
        }
    }
  }
);
