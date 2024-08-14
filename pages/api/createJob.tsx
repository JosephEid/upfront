import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import { put } from "@vercel/blob";
import { JobPostFormProps, JobPostStatus } from "../post-job";
import { NextResponse } from "next/server";
export interface CreateJobRequest {
    amount: number;
    values: JobPostFormProps;
    id: string;
    companyLogoUrl: string;
    status: JobPostStatus;
    paymentIntentId?: string;
    checkoutSessionId: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === "POST") {
        try {
            const createRequest: CreateJobRequest = req.body;

            const here = await sql`INSERT INTO job_posts (
                id, title, "companyLogo", "companyName", "companyWebsite", currency, 
                description, location, "minSalary", "maxSalary", "loginEmail", 
                "howToApply", "visaSponsorship", status, "planType", "planDuration", "totalAmount", "paymentIntentId", "checkoutSessionId", "createdAt", "updatedAt"
              ) VALUES (${createRequest.id}, ${createRequest.values.title}, ${
                createRequest.companyLogoUrl
            }, ${createRequest.values.companyName}, ${
                createRequest.values.companyWebsite
            }, ${createRequest.values.currency}, ${
                createRequest.values.description
            }, ${createRequest.values.location}, ${
                createRequest.values.minSalary
            }, ${createRequest.values.maxSalary}, ${
                createRequest.values.loginEmail
            }, ${createRequest.values.howToApply}, ${
                createRequest.values.visaSponsorship
            }, 'pending', ${createRequest.values.planType}, ${
                createRequest.values.planDuration
            }, ${createRequest.amount}, ${null}, ${
                createRequest.checkoutSessionId
            }, now() at time zone 'utc', now() at time zone 'utc'
              ) RETURNING *;
            `;

            const blobResponse = NextResponse.json(here);

            res.status(200).json(blobResponse);
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
