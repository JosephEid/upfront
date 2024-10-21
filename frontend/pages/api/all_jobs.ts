import { NextApiRequest, NextApiResponse } from "next";
import { JobPostItem } from "./checkout_session/[id]";

interface searchParams {
    salary: string;
    title: string;
    location: string;
}
// get checkout session to validate payment
export async function getAllJobs(values?: searchParams) {
    try {
        const url = `https://pycl29s0vd.execute-api.eu-west-2.amazonaws.com/prod/upfront/job-posts?salary=${
            values?.salary ?? ""
        }&title=${values?.title ?? ""}&location=${values?.location ?? ""}`;
        const getAllJobsResponse = await fetch(url, {
            method: "GET",
            headers: {
                "x-api-key": process.env.NEXT_PUBLIC_API_KEY as string,
                "Content-Type": "application/json",
            },
        });

        const data: JobPostItem[] = await getAllJobsResponse.json();
        return data;
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
        const salary = req.query["salary"];
        const location = req.query["location"];
        const title = req.query["title"];

        const values: searchParams = {
            salary: salary as string,
            location: location as string,
            title: title as string,
        };
        const jobsResponse: JobPostItem[] = await getAllJobs(values);

        res.status(200).json(jobsResponse);
    } catch (err) {
        const errorMessage =
            err instanceof Error ? err.message : "Internal server error";
        res.status(500).json({ statusCode: 500, message: errorMessage });
    }
}
