
'use server';

/**
 * @fileOverview AI agent for analyzing and extracting data from an invoice image.
 *
 * - analyzeInvoice - A function that analyzes an invoice image.
 * - AnalyzeInvoiceInput - The input type for the function.
 * - AnalyzeInvoiceOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeInvoiceInputSchema = z.object({
  invoiceImageUri: z
    .string()
    .describe(
      "An image of an invoice, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeInvoiceInput = z.infer<typeof AnalyzeInvoiceInputSchema>;

const InvoiceItemSchema = z.object({
    description: z.string().describe('The description of the line item.'),
    quantity: z.number().describe('The quantity of the item.'),
    unitPrice: z.number().describe('The price per unit of the item.'),
    total: z.number().describe('The total price for the line item.'),
});

const AnalyzeInvoiceOutputSchema = z.object({
  vendor: z.string().optional().describe('The name of the vendor or store.'),
  date: z.string().optional().describe('The date of the transaction in YYYY-MM-DD format.'),
  totalAmount: z.number().describe('The final total amount of the invoice.'),
  category: z.enum(['Seeds', 'Fertilizers', 'Feeds', 'Labor', 'Machinery', 'Utilities', 'Livestock Purchase', 'Other']).describe('The most likely category for this expense.'),
  items: z.array(InvoiceItemSchema).describe('A list of line items from the invoice.'),
  summary: z.string().describe('A brief summary of the invoice content.'),
});
export type AnalyzeInvoiceOutput = z.infer<typeof AnalyzeInvoiceOutputSchema>;

export async function analyzeInvoice(input: AnalyzeInvoiceInput): Promise<AnalyzeInvoiceOutput> {
  return analyzeInvoiceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeInvoicePrompt',
  input: {schema: AnalyzeInvoiceInputSchema},
  output: {schema: AnalyzeInvoiceOutputSchema},
  prompt: `You are an expert financial assistant with advanced OCR capabilities for agricultural businesses. Your task is to analyze the provided invoice image and extract key financial data.

Analyze the image and perform the following tasks:
1.  **Extract Vendor Name:** Identify the name of the store or vendor.
2.  **Extract Transaction Date:** Find the date of the invoice and format it as YYYY-MM-DD.
3.  **Extract Line Items:** For each item on the invoice, extract its description, quantity, unit price, and total price.
4.  **Extract Total Amount:** Identify the final, total amount due on the invoice.
5.  **Categorize Expense:** Based on the items, determine the most appropriate expense category from the provided list.
6.  **Summarize:** Provide a brief, one-sentence summary of the purchase.

Image to Analyze: {{media url=invoiceImageUri}}`,
});

const analyzeInvoiceFlow = ai.defineFlow(
  {
    name: 'analyzeInvoiceFlow',
    inputSchema: AnalyzeInvoiceInputSchema,
    outputSchema: AnalyzeInvoiceOutputSchema,
  },
  async input => {
    try {
        const {output} = await prompt(input);
        return output!;
    } catch (e: any) {
        console.error(e);
        return {
            vendor: 'Error',
            date: new Date().toISOString().split('T')[0],
            totalAmount: 0,
            category: 'Other',
            items: [],
            summary: 'The AI model could not process the invoice image. Please try again with a clearer picture.',
        }
    }
  }
);
