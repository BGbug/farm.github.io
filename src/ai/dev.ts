import { config } from 'dotenv';
config();

import '@/ai/flows/resource-usage-insights.ts';
import '@/ai/flows/spending-forecasts.ts';
import '@/ai/flows/suggest-crops-flow.ts';
import '@/ai/flows/diagnose-plant-health-flow.ts';
import '@/ai/flows/analyze-livestock-health-flow.ts';
import '@/ai/flows/analyze-invoice-flow.ts';
