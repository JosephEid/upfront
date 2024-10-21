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
            const url = `https://pycl29s0vd.execute-api.eu-west-2.amazonaws.com/prod/upfront/start-challenge`;

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
                body: req.body, // body data type must match "Content-Type" header
            });

            const data: StartChallengeResponse =
                await checkoutSessionResponse.json();
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
