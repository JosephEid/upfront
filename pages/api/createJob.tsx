import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import { put } from "@vercel/blob";
import { JobPostProps, JobPostStatus, PlanType } from "../job-post";
import { NextResponse } from "next/server";
export interface CreateJobRequest {
    amount: number;
    values: JobPostProps;
    planType: PlanType;
    id: string;
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

            const now = new Date().toISOString();

            const here = await sql`INSERT INTO job_posts (
                id, title, company_name, company_website, currency, 
                description, location, min_salary, max_salary, login_email, 
                how_to_apply, visa_sponsorship, status, plan_type, payment_intent_id, checkout_session_id, created_at, updated_at
              ) VALUES (${createRequest.id}, ${createRequest.values.title}, ${
                createRequest.values.companyName
            }, ${createRequest.values.companyWebsite}, ${
                createRequest.values.currency
            }, ${createRequest.values.description}, ${
                createRequest.values.location
            }, ${createRequest.values.minSalary}, ${
                createRequest.values.maxSalary
            }, ${createRequest.values.yourEmail}, ${
                createRequest.values.howToApply
            }, ${createRequest.values.visaSponsorship}, 'pending', ${
                createRequest.planType
            }, ${null}, ${
                createRequest.checkoutSessionId
            }, to_timestamp(${Date.now()}), to_timestamp(${Date.now()})
              ) RETURNING *;
            `;

            // Here's the code for Pages API Routes:
            const blob = await put(
                createRequest.id,
                createRequest.values.companyLogo,
                {
                    access: "public",
                }
            );

            const blobResponse = NextResponse.json(blob);

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
