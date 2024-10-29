import { getCurrentUser } from "aws-amplify/auth";
import { NextApiRequest, NextApiResponse } from "next";

export async function isSignedIn(): Promise<boolean> {
    try {
        const signedIn = await getCurrentUser();
        if (signedIn) {
            return true;
        }
    } catch (err) {
        return false;
    }
    return false;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const signedIn = await isSignedIn();

    res.status(200).json(signedIn);
}
