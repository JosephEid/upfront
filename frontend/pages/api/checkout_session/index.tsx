import { NextApiRequest, NextApiResponse } from "next";
import { JobPostFormProps } from "@/pages/post-job";
import { fetchPostJSON } from "@/lib/api-utils";

export interface CheckoutSessionRequest extends JobPostFormProps {
    successURL: string;
    cancelURL: string;
}

export interface CheckoutSessionResponse {
    url: string;
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
                successURL: `${req.headers.origin}/success`,
                cancelURL: `${req.headers.origin}/post-job`,
            };
            const url = `https://pycl29s0vd.execute-api.eu-west-2.amazonaws.com/prod/upfront/checkout-session`;

            const checkoutSessionResponse: CheckoutSessionResponse =
                await fetchPostJSON(url, csRequest);

            res.status(200).json(checkoutSessionResponse);
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
