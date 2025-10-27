'use server';

/**
 * @fileOverview Provides insights on optimizing resource usage (fertilizer, water) based on historical consumption patterns.
 *
 * - analyzeResourceUsage - A function that analyzes resource usage patterns and provides insights.
 * - AnalyzeResourceUsageInput - The input type for the analyzeResourceUsage function.
 * - AnalyzeResourceUsageOutput - The return type for the analyzeResourceUsage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeResourceUsageInputSchema = z.object({
  farmId: z.string().describe('The ID of the farm to analyze.'),
  startDate: z.string().describe('The start date for the analysis period (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date for the analysis period (YYYY-MM-DD).'),
});
export type AnalyzeResourceUsageInput = z.infer<typeof AnalyzeResourceUsageInputSchema>;

const AnalyzeResourceUsageOutputSchema = z.object({
  insights: z.string().describe('Insights on optimizing resource usage, including specific recommendations.'),
  overallAssessment: z.string().describe('Overall assessment of resource management practices.'),
});
export type AnalyzeResourceUsageOutput = z.infer<typeof AnalyzeResourceUsageOutputSchema>;

export async function analyzeResourceUsage(input: AnalyzeResourceUsageInput): Promise<AnalyzeResourceUsageOutput> {
  return analyzeResourceUsageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeResourceUsagePrompt',
  input: {schema: AnalyzeResourceUsageInputSchema},
  output: {schema: AnalyzeResourceUsageOutputSchema},
  prompt: `You are an expert in agricultural resource management. Analyze the historical resource consumption patterns (fertilizer, water) for the given farm and provide insights on optimizing usage to reduce waste and improve efficiency.

Farm ID: {{{farmId}}}
Start Date: {{{startDate}}}
End Date: {{{endDate}}}

Provide specific, actionable recommendations based on the data provided. Also, provide an overall assessment of the farm's current resource management practices.

Format your response with an overallAssessment and insights paragraph.
`,
});

const analyzeResourceUsageFlow = ai.defineFlow(
  {
    name: 'analyzeResourceUsageFlow',
    inputSchema: AnalyzeResourceUsageInputSchema,
    outputSchema: AnalyzeResourceUsageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

