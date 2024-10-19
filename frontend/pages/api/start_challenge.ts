import { fetchPostJSON } from "@/lib/api-utils";
import { NextApiRequest, NextApiResponse } from "next";

interface StartChallengeResponse {
    challengeStarted: boolean;
    jobsFound: boolean;
}
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === "POST") {
        try {
            const reqBody: { email: string } = req.body;

            const url = `https://pycl29s0vd.execute-api.eu-west-2.amazonaws.com/prod/upfront/start-challenge`;

            const checkoutSessionResponse: StartChallengeResponse =
                await fetchPostJSON(url, reqBody);

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
