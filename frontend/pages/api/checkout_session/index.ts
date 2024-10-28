import { NextApiRequest, NextApiResponse } from "next";
import { JobPostFormProps } from "@/pages/post-job";

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
            const formProps: JobPostFormProps = JSON.parse(req.body);
            formProps.companyLogoURL =
                formProps.companyLogoURL.toLocaleLowerCase();
            formProps.companyWebsite =
                formProps.companyWebsite.toLocaleLowerCase();
            formProps.loginEmail = formProps.loginEmail.toLocaleLowerCase();

            const csRequest: CheckoutSessionRequest = {
                ...formProps,
                successURL: `${req.headers.origin}/success`,
                cancelURL: `${req.headers.origin}/post-job`,
            };
            console.log(csRequest);
            const url = `https://dqc40odta0.execute-api.eu-west-2.amazonaws.com/prod/upfront/checkout-session`;

            const checkoutSessionResponse = await fetch(url, {
                method: "POST", // *GET, POST, PUT, DELETE, etc.
                mode: "cors", // no-cors, *cors, same-origin
                cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
                credentials: "same-origin", // include, *same-origin, omit
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": process.env.NEXT_PUBLIC_API_KEY as string,
                    // 'Content-Type': 'application/x-www-form-urlencoded',
                },
                redirect: "follow", // manual, *follow, error
                referrerPolicy: "no-referrer", // no-referrer, *client
                body: JSON.stringify(csRequest || {}), // body data type must match "Content-Type" header
            });

            const data = await checkoutSessionResponse.json();
            res.status(200).json(data);
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
