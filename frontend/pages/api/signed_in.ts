import { getCurrentUser } from "aws-amplify/auth";
import { NextApiRequest, NextApiResponse } from "next";

export async function isSignedIn(): Promise<boolean> {
    try {
        const signedIn = await getCurrentUser();
        console.log("signed in!");
        if (signedIn) {
            return true;
        }
    } catch (err) {
        console.log("not signed in");
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
