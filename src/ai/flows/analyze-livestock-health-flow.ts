
'use server';

/**
 * @fileOverview AI agent for analyzing livestock health from a video frame.
 *
 * - analyzeLivestockHealth - A function that analyzes a snapshot of livestock.
 * - AnalyzeLivestockHealthInput - The input type for the function.
 * - AnalyzeLivestockHealthOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeLivestockHealthInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A snapshot from a camera feed of livestock, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  animalType: z.enum(['Cow', 'Goat', 'Chicken', 'Buffalo', 'Sheep', 'Other']).describe('The general type of animal in the image.'),
});
export type AnalyzeLivestockHealthInput = z.infer<typeof AnalyzeLivestockHealthInputSchema>;


const HealthObservationSchema = z.object({
    observation: z.string().describe('A specific observation about an animal or the group (e.g., "One cow is limping on its front-left leg", "Several chickens appear lethargic").'),
    recommendation: z.string().describe('An actionable recommendation based on the observation (e.g., "Isolate the cow and inspect its hoof for injury.", "Check for signs of respiratory illness in the flock.").'),
    urgency: z.enum(['High', 'Medium', 'Low']).describe('The urgency of the recommendation.'),
});

const AnalyzeLivestockHealthOutputSchema = z.object({
  animalCount: z.number().describe('The estimated number of animals detected in the image.'),
  healthAnalysis: z.array(HealthObservationSchema).describe('A list of health-related observations and recommendations.'),
  generalAdvice: z.string().describe('General preventative advice for the herd or flock. This should include proactive recommendations for medicine, supplements, vaccinations, deworming, or mating based on the animal type, common behaviors, and potential seasonal risks (e.g., "Consider a deworming protocol for your goats as they enter the wet season to prevent parasite load.", "Monitor chickens for signs of heat stress and ensure ample water during hot months.").'),
  visualDescription: z.string().optional().describe('A brief, one-sentence visual description of the main animal in the foreground, focusing on key features like color, markings, and breed characteristics.'),
  suggestedId: z.string().optional().describe('A suggested unique ID for the animal based on its type and visual description (e.g., COW-BLKWHT-01).')
});
export type AnalyzeLivestockHealthOutput = z.infer<typeof AnalyzeLivestockHealthOutputSchema>;

export async function analyzeLivestockHealth(input: AnalyzeLivestockHealthInput): Promise<AnalyzeLivestockHealthOutput> {
  return analyzeLivestockHealthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeLivestockHealthPrompt',
  input: {schema: AnalyzeLivestockHealthInputSchema},
  output: {schema: AnalyzeLivestockHealthOutputSchema},
  prompt: `You are an expert veterinarian and livestock management AI. Your task is to analyze an image from a farm's camera feed showing {{{animalType}}} animals.

Analyze the provided image and perform the following tasks:
1.  **Count the Animals:** Provide an estimated count of the animals visible in the image.
2.  **Assess Health:** Carefully examine the animals for any signs of injury, disease, or unusual behavior (e.g., limping, isolation, lethargy, physical abnormalities). For each specific observation, provide a clear, actionable recommendation and an urgency level.
3.  **Provide Preventative Advice:** Based on the animal type and general knowledge of animal husbandry, provide proactive 'generalAdvice'. This must include potential needs for medicine, supplements, vaccinations, deworming, or notes on mating readiness based on common seasonal concerns or animal behaviors. Be specific and actionable.
4.  **Describe Visually**: If there is a clear animal in the foreground, provide a brief, one-sentence 'visualDescription' of it. Focus on distinct features like color, markings, or apparent breed.
5.  **Suggest ID**: Based on the animal type and visual description, create a 'suggestedId'. The format should be a 3-letter abbreviation of the animal type, a 3-letter abbreviation of its main characteristics, and a number. For example, a black and white cow could be COW-BNW-01. A brown goat could be GOA-BRN-01.

Image to Analyze: {{media url=imageDataUri}}`,
});

const analyzeLivestockHealthFlow = ai.defineFlow(
  {
    name: 'analyzeLivestockHealthFlow',
    inputSchema: AnalyzeLivestockHealthInputSchema,
    outputSchema: AnalyzeLivestockHealthOutputSchema,
  },
  async input => {
    try {
        const {output} = await prompt(input);
        return output!;
    } catch (e: any) {
        console.error(e);
        return {
            animalCount: 0,
            healthAnalysis: [],
            generalAdvice: 'The AI model could not process the request. Please try again with a clearer image.',
            visualDescription: '',
            suggestedId: '',
        }
    }
  }
);
