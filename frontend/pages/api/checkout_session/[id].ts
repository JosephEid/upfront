import { fetchGetJSON } from "@/lib/api-utils";
import { JobPostFormProps } from "@/pages/post-job";
import { NextApiRequest, NextApiResponse } from "next";

export interface JobPostItem extends JobPostFormProps {
    PK: string;
    SK: string;
    jobID: string;
    sessionID: string;
    createdAt: string;
    updatedAt: string;
    status: Status;
}

type Status = "Active" | "Expired" | "PendingPayment";

// get checkout session to validate payment
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const id: string = req.query.id as string;
    try {
        const url = `https://pycl29s0vd.execute-api.eu-west-2.amazonaws.com/prod/upfront/validate-purchase/${id}`;
        const validateSessionResponse: JobPostItem = await fetchGetJSON(url);

        res.status(200).json(validateSessionResponse);
    } catch (err) {
        const errorMessage =
            err instanceof Error ? err.message : "Internal server error";
        res.status(500).json({ statusCode: 500, message: errorMessage });
    }
}
