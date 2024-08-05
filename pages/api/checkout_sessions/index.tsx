import { CURRENCY, MAX_AMOUNT, MIN_AMOUNT } from "../../../config";
import { NextApiRequest, NextApiResponse } from "next";

import Stripe from "stripe";
import { formatAmountForStripe } from "../../../utils/stripe-helpers";
import { secret } from "@aws-amplify/backend";

const stripe = new Stripe(secret("stripeSecretKey").toString(), {
    // https://github.com/stripe/stripe-node#configuration
    apiVersion: "2024-06-20",
});

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    console.log(process.env.secrets);
    if (req.method === "POST") {
        const amount: number = req.body.amount;
        const productName: string = req.body.productName;
        try {
            // Validate the amount that was passed from the client.
            if (!(amount >= MIN_AMOUNT && amount <= MAX_AMOUNT)) {
                throw new Error("Invalid amount.");
            }
            // Create Checkout Sessions from body params.
            const params: Stripe.Checkout.SessionCreateParams = {
                submit_type: "pay",
                payment_method_types: ["card"],
                line_items: [
                    {
                        quantity: 1,
                        price_data: {
                            currency: CURRENCY,
                            product_data: {
                                name: productName,
                            },
                            unit_amount: formatAmountForStripe(
                                amount,
                                CURRENCY
                            ),
                        },
                    },
                ],
                mode: "payment",
                success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${req.headers.origin}/job-post`,
            };
            const checkoutSession: Stripe.Checkout.Session = await stripe.checkout.sessions.create(
                params
            );

            res.status(200).json(checkoutSession);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Internal server error";
            res.status(500).json({ statusCode: 500, message: errorMessage });
        }
    } else {
        res.setHeader("Allow", "POST");
        res.status(405).end("Method Not Allowed");
    }
}
