
'use server';
/**
 * @fileOverview Provides FHE-compliant salary management advice.
 *
 * - getSalaryManagementAdvice - A function that returns financial advice based on a salary range.
 * - SalaryManagementInput - The input type.
 * - SalaryManagementOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SalaryManagementInputSchema = z.object({
  salaryRange: z.string().describe('The user\'s monthly salary range in INR (e.g., "50000-70000").'),
});
export type SalaryManagementInput = z.infer<typeof SalaryManagementInputSchema>;

const AdviceItemSchema = z.object({
  title: z.string().describe("The bolded title for the advice point (e.g., 'Needs (50%)', 'Emergency Fund'). Do not include asterisks or markdown."),
  details: z.string().describe("The detailed explanation for the point, including calculated amounts (e.g., '₹60,000 - This covers essentials...').")
});

const AdviceSectionSchema = z.object({
  heading: z.string().describe("The main heading for this section of the plan (e.g., 'Budgeting Breakdown (50/30/20 Rule)', 'Savings & Investment Goals')."),
  items: z.array(AdviceItemSchema).describe("A list of advice points under this heading.")
});

const SalaryManagementOutputSchema = z.object({
  greeting: z.string().describe("A friendly and encouraging opening paragraph, addressing the user and their salary range."),
  plan: z.array(AdviceSectionSchema).describe("An array of structured advice sections that make up the financial plan."),
  closing: z.string().describe("A final encouraging closing statement."),
});
export type SalaryManagementOutput = z.infer<typeof SalaryManagementOutputSchema>;

const salaryAdvicePrompt = ai.definePrompt({
  name: 'salaryAdvicePrompt',
  input: { schema: SalaryManagementInputSchema },
  output: { schema: SalaryManagementOutputSchema },
  prompt: `You are a friendly and encouraging financial advisor in India. A user has provided their monthly salary range. Your task is to generate a structured financial plan based on this range. The user's exact salary is private, so base your advice on the provided range, specifically using the lower end for calculations.

Salary Range: {{{salaryRange}}} INR per month.

Please generate a response in the specified JSON format.

Here are the sections to include in the 'plan' array:
1.  **Budgeting Breakdown Section**:
    - \`heading\`: "Budgeting Breakdown (50/30/20 Rule based on [lower end of salary])"
    - \`items\`: An array with objects for "Needs (50%)", "Wants (30%)", and "Savings/Investments (20%)". Calculate amounts and provide descriptions.
2.  **Savings & Investment Goals Section**:
    - \`heading\`: "Savings & Investment Goals"
    - \`items\`: An array with one item for "Emergency Fund". Calculate the suggested amount (3-6x monthly 'Needs') and provide a description.
3.  **Investment Options Section**:
    - \`heading\`: "Investment Options"
    - \`items\`: An array with items for "Mutual Funds (SIP)" and "Public Provident Fund (PPF)", each with a detailed, helpful description.

Example Calculation for ₹1,20,001 - ₹2,00,000 range:
- Use ₹1,20,001 for calculations.
- Needs (50%): ~₹60,000
- Wants (30%): ~₹36,000
- Savings (20%): ~₹24,000
- Emergency Fund (3-6x Needs): ₹1,80,000 - ₹3,60,000

Fill the 'greeting' and 'closing' fields with warm, encouraging text. Ensure all monetary values are formatted with Indian comma style (e.g., ₹1,20,001).
`,
});

const getSalaryManagementAdviceFlow = ai.defineFlow(
  {
    name: 'getSalaryManagementAdviceFlow',
    inputSchema: SalaryManagementInputSchema,
    outputSchema: SalaryManagementOutputSchema,
  },
  async (input) => {
    const { output } = await salaryAdvicePrompt(input);
    if (!output) {
      // Create a structured fallback response
      return {
        greeting: "We couldn't generate detailed advice at the moment, but here's a general guide.",
        plan: [
          {
            heading: "General Financial Advice",
            items: [
              { title: "The 50/30/20 Rule", details: "A great starting point is to allocate 50% of your income to needs (essentials), 30% to wants (lifestyle), and 20% to savings and investments." },
              { title: "Emergency Fund", details: "Aim to build an emergency fund that covers 3-6 months of your essential living expenses." }
            ]
          }
        ],
        closing: "Start small, stay consistent, and you'll be on the path to financial wellness!"
      };
    }
    return output;
  }
);

export async function getSalaryManagementAdvice(
  input: SalaryManagementInput
): Promise<SalaryManagementOutput> {
  return getSalaryManagementAdviceFlow(input);
}
