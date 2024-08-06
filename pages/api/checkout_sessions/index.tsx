import { CURRENCY, MAX_AMOUNT, MIN_AMOUNT } from "../../../config";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { formatAmountForStripe } from "../../../utils/stripe-helpers";
import { v4 as uuidv4 } from "uuid";
import { JobPostProps } from "@/pages/job-post";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-06-20",
});

export interface CheckoutSessionRequest {
    amount: number;
    productName: string;
    values: JobPostProps;
}

export interface CheckoutSessionResponse {
    session: Stripe.Checkout.Session;
    post_id: string;
}

function generateUUID(): string {
    return uuidv4();
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === "POST") {
        try {
            const csRequest: CheckoutSessionRequest = req.body;
            const id = generateUUID();

            // Validate the amount that was passed from the client.
            if (
                !(
                    csRequest.amount >= MIN_AMOUNT &&
                    csRequest.amount <= MAX_AMOUNT
                )
            ) {
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
                                name: csRequest.productName,
                            },
                            unit_amount: formatAmountForStripe(
                                csRequest.amount,
                                CURRENCY
                            ),
                        },
                    },
                ],
                mode: "payment",
                success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${req.headers.origin}/job-post`,
                customer_email: csRequest.values.yourEmail,
                client_reference_id: id,
            };
            const checkoutSession: Stripe.Checkout.Session =
                await stripe.checkout.sessions.create(params);

            const reponse: CheckoutSessionResponse = {
                post_id: id,
                session: checkoutSession,
            };

            res.status(200).json(reponse);
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
