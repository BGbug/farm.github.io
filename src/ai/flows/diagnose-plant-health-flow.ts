
'use server';

/**
 * @fileOverview A plant problem diagnosis AI agent.
 *
 * - diagnosePlantHealth - A function that handles the plant diagnosis process.
 * - DiagnosePlantHealthInput - The input type for the diagnosePlantHealth function.
 * - DiagnosePlantHealthOutput - The return type for the diagnosePlantHealth function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiagnosePlantHealthInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().optional().describe('An optional description of the plant and its surroundings.'),
});
export type DiagnosePlantHealthInput = z.infer<typeof DiagnosePlantHealthInputSchema>;

const DiagnosePlantHealthOutputSchema = z.object({
  isPlant: z.boolean().describe('Whether or not the input is a plant.'),
  plantType: z.string().describe('The type or species of the plant.'),
  isHealthy: z.boolean().describe('Whether or not the plant is healthy.'),
  diagnosis: z.string().describe("The diagnosis of the plant's health, including any diseases or pests found."),
  recommendations: z.string().describe('Recommendations for treating the plant, including detailed watering advice, soil adjustments, and pest control measures.'),
});
export type DiagnosePlantHealthOutput = z.infer<typeof DiagnosePlantHealthOutputSchema>;

export async function diagnosePlantHealth(input: DiagnosePlantHealthInput): Promise<DiagnosePlantHealthOutput> {
  return diagnosePlantHealthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnosePlantHealthPrompt',
  input: {schema: DiagnosePlantHealthInputSchema},
  output: {schema: DiagnosePlantHealthOutputSchema},
  prompt: `You are an expert botanist and plant pathologist. Your task is to analyze an image of a plant and an optional description of its condition to diagnose its health.

Based on the photo and description (if provided), identify the plant, determine if it is healthy, and provide a detailed diagnosis. If the plant is unhealthy, identify the disease, pest, or nutrient deficiency. 

Also provide actionable recommendations for treatment. This must include:
1.  **Watering Advice:** Specific instructions on how much and how often to water the plant based on its condition.
2.  **Soil Adjustments:** Recommendations for soil type, pH, and necessary amendments.
3.  **Pest/Disease Control:** Specific measures to control any identified issues.
{{#if description}}
Description: {{{description}}}
{{/if}}
Photo: {{media url=photoDataUri}}`,
});

const diagnosePlantHealthFlow = ai.defineFlow(
  {
    name: 'diagnosePlantHealthFlow',
    inputSchema: DiagnosePlantHealthInputSchema,
    outputSchema: DiagnosePlantHealthOutputSchema,
  },
  async input => {
    try {
        const {output} = await prompt(input);
        return output!;
    } catch (e: any) {
        console.error(e);
        return {
            isPlant: false,
            plantType: 'Unknown',
            isHealthy: false,
            diagnosis: 'The AI model could not process the request.',
            recommendations: 'Please try again with a different image or description. If the problem persists, the model may be temporarily unavailable.',
        }
    }
  }
);
