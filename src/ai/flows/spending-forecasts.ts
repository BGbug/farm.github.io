// 'use server'; // Disabled for static export

/**
 * @fileOverview Spending forecast AI agent.
 *
 * - spendingForecast - A function that handles the spending forecast process.
 * - SpendingForecastInput - The input type for the spendingForecast function.
 * - SpendingForecastOutput - The return type for the spendingForecast function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpendingForecastInputSchema = z.object({
  currentResourceUsage: z
    .string()
    .describe('The current resource usage, including fertilizer, water, etc.'),
  plannedActivities: z
    .string()
    .describe('The planned activities, including planting, harvesting, etc.'),
  budget: z.number().describe('The allotted budget for the farm.'),
});
export type SpendingForecastInput = z.infer<typeof SpendingForecastInputSchema>;

const SpendingForecastOutputSchema = z.object({
  forecastedSpending: z
    .number()
    .describe('The forecasted spending based on current resource usage and planned activities.'),
  isWithinBudget: z
    .boolean()
    .describe('Whether the forecasted spending is within the allotted budget.'),
  recommendations: z
    .string()
    .describe(
      'Recommendations for adjusting resource usage or planned activities to stay within budget.'
    ),
});
export type SpendingForecastOutput = z.infer<typeof SpendingForecastOutputSchema>;

export async function spendingForecast(input: SpendingForecastInput): Promise<SpendingForecastOutput> {
  return spendingForecastFlow(input);
}

const prompt = ai.definePrompt({
  name: 'spendingForecastPrompt',
  input: {schema: SpendingForecastInputSchema},
  output: {schema: SpendingForecastOutputSchema},
  prompt: `You are an expert farm financial advisor. Based on the current resource usage, planned activities, and allotted budget, you will forecast spending and provide recommendations.

Current Resource Usage: {{{currentResourceUsage}}}
Planned Activities: {{{plannedActivities}}}
Budget: {{{budget}}}

Forecasted Spending: 
Is Within Budget: 
Recommendations: `,
});

const spendingForecastFlow = ai.defineFlow(
  {
    name: 'spendingForecastFlow',
    inputSchema: SpendingForecastInputSchema,
    outputSchema: SpendingForecastOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
