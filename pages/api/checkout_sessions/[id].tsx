import { sql } from "@vercel/postgres";
import { NextApiRequest, NextApiResponse } from "next";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // https://github.com/stripe/stripe-node#configuration
    apiVersion: "2024-06-20",
});

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const id: string = req.query.id as string;
    try {
        if (!id.startsWith("cs_")) {
            throw Error("Incorrect CheckoutSession ID.");
        }
        const checkout_session: Stripe.Checkout.Session =
            await stripe.checkout.sessions.retrieve(id, {
                expand: ["payment_intent"],
            });

        const update =
            await sql`UPDATE job_posts SET status = 'active', "updatedAt" = CURRENT_TIMESTAMP WHERE id = ${checkout_session.client_reference_id} RETURNING *`;

        res.status(200).json(update.rows[0]);
    } catch (err) {
        const errorMessage =
            err instanceof Error ? err.message : "Internal server error";
        res.status(500).json({ statusCode: 500, message: errorMessage });
    }
}
