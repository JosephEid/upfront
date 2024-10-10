import { Lucia, User } from "lucia";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBAdapter } from "lucia-dynamodb-adapter";

const client = new DynamoDBClient();

async function getUser(userId: string): Promise<User | null> {
    //Get the user from your own user table
    const user = await getUserFromDb(userId);

    //If the user does not exist, return null
    if (!user) {
        return null;
    }

    //Return the user as a Lucia user. This example assumes that the attributes field has been customised to include a username. See more in this tutorial https://lucia-auth.com/tutorials/username-and-password/
    return {
        id: user.id,
        // attributes: {
        //     username: user.username,
        // },
    };
}

const adapter: any = new DynamoDBAdapter({
    client,
    sessionTableName: "lucia-sessions",
    sessionUserIndexName: "lucia-sessions-user-index",
    getUser: getUser,
});

export const lucia = new Lucia(adapter, {
    sessionCookie: {
        attributes: {
            // set to `true` when using HTTPS
            secure: process.env.NODE_ENV === "production",
        },
    },
});

// IMPORTANT!
declare module "lucia" {
    interface Register {
        Lucia: typeof lucia;
    }
}
