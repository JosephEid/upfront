import { NextApiRequest, NextApiResponse } from "next";
import { JobPostItem } from "./checkout_session/[id]";
import { getCurrentUser } from "aws-amplify/auth";

export interface getRecruiterJobsResponse {
    jobs: JobPostItem[];
    email: string;
}

export async function getRecruiterJobs() {
    try {
        const currentUser = await getCurrentUser();
        const url = `https://m7kkswah50.execute-api.eu-west-2.amazonaws.com/prod/upfront/recruiter-posts/${
            currentUser.signInDetails?.loginId as string
        }`;

        const getRecruiterJobsResponse = await fetch(url, {
            method: "GET",
            headers: {
                "x-api-key": process.env.NEXT_PUBLIC_API_KEY as string,
                "Content-Type": "application/json",
            },
        });

        const data: JobPostItem[] = await getRecruiterJobsResponse.json();

        return {
            jobs: data,
            email: currentUser.signInDetails?.loginId as string,
        };
    } catch (err) {
        const errorMessage =
            err instanceof Error ? err.message : "Internal server error";
        throw new Error(errorMessage);
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const email = req.query["email"];

        const values = {
            email: email as string,
        };
        const jobsResponse: getRecruiterJobsResponse = await getRecruiterJobs();

        res.status(200).json(jobsResponse);
    } catch (err) {
        const errorMessage =
            err instanceof Error ? err.message : "Internal server error";
        res.status(500).json({ statusCode: 500, message: errorMessage });
    }
}
