import { signOut } from "aws-amplify/auth";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const signOutRes = await signOut();
        res.status(200).json(signOutRes);
    } catch (error) {
        console.log("failed to sign out");
        res.status(500);
    }
}
