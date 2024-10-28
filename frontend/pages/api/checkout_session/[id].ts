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

export async function getCheckoutSession(id: string) {
    try {
        const url = `https://ol2h87cdyg.execute-api.eu-west-2.amazonaws.com/prod/upfront/validate-purchase/${id}`;
        const validateSessionResponse = await fetch(url, {
            method: "GET",
            headers: {
                "x-api-key": process.env.NEXT_PUBLIC_API_KEY as string,
                "Content-Type": "application/json",
            },
        });

        const data = await validateSessionResponse.json();
        return data;
    } catch (err) {
        const errorMessage =
            err instanceof Error ? err.message : "Internal server error";
        throw new Error(errorMessage);
    }
}
