import {
    CURRENCY,
    MAX_AMOUNT,
    MIN_AMOUNT,
    priceFactors,
} from "../../../config";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { v4 as uuidv4 } from "uuid";
import { JobPostFormProps } from "@/pages/post-job";
import { fetchPostJSON } from "@/lib/api-utils";
import { redirect } from "next/navigation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-06-20",
});

export interface CheckoutSessionRequest extends JobPostFormProps {
    successURL: string;
    cancelURL: string;
}

export interface CheckoutSessionResponse {
    url: string;
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
            const formProps: JobPostFormProps = req.body;
            const csRequest: CheckoutSessionRequest = {
                ...formProps,
                successURL: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancelURL: `${req.headers.origin}/post-job`,
            };
            const url = `https://jzyzxd9rfi.execute-api.eu-west-2.amazonaws.com/prod/upfront/checkout-session`;

            const checkoutSessionResponse: CheckoutSessionResponse =
                await fetchPostJSON(url, csRequest);

            // const id = generateUUID();
            // const totalAmount =
            //     (csRequest.planDuration * priceFactors[csRequest.planType]) /
            //     30;
            // // Validate the amount that was passed from the client.
            // if (!(totalAmount >= MIN_AMOUNT && totalAmount <= MAX_AMOUNT)) {
            //     throw new Error("Invalid amount.");
            // }
            // // Create Checkout Sessions from body params.
            // const params: Stripe.Checkout.SessionCreateParams = {
            //     submit_type: "pay",
            //     payment_method_types: ["card"],
            //     line_items: [
            //         {
            //             quantity: 1,
            //             price_data: {
            //                 currency: CURRENCY,
            //                 product_data: {
            //                     name: `${csRequest.planType} plan for ${csRequest.planDuration} days.`,
            //                 },
            //                 unit_amount: formatAmountForStripe(
            //                     totalAmount,
            //                     CURRENCY
            //                 ),
            //             },
            //         },
            //     ],
            //     mode: "payment",
            //     success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            //     cancel_url: `${req.headers.origin}/post-job`,
            //     customer_email: csRequest.loginEmail,
            //     client_reference_id: id,
            // };
            // const checkoutSession: Stripe.Checkout.Session =
            //     await stripe.checkout.sessions.create(params);
            // const reponse: CheckoutSessionResponse = {
            //     post_id: id,
            //     session: checkoutSession,
            // };
            res.status(200).json(checkoutSessionResponse);
        } catch (err) {
            console.log(err);
            const errorMessage =
                err instanceof Error ? err.message : "Internal server error";
            res.status(500).json({ statusCode: 500, message: errorMessage });
        }
    } else {
        res.setHeader("Allow", "POST");
        res.status(405).end("Method Not Allowed");
    }
}
