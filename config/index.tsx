import { PlanType } from "@/pages/post-job";

export const CURRENCY = "gbp";
// Set your amount limits: Use float for decimal currencies and
// Integer for zero-decimal currencies: https://stripe.com/docs/currencies#zero-decimal.
export const MIN_AMOUNT = 35.0;
export const MAX_AMOUNT = 540.0;
export const AMOUNT_STEP = 5.0;

export const priceFactors: Record<PlanType, number> = {
    Standard: 35,
    Premium: 90,
};
