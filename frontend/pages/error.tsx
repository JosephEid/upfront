import Head from "next/head";
import { Box, Button, Center, Divider, Input, Text } from "@chakra-ui/react";
import Layout from "@/components/Layout";
import React, { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import { signIn, confirmSignIn, getCurrentUser } from "aws-amplify/auth";
import { Amplify } from "aws-amplify";

interface MagicLinkProps {
    email: string;
    token: string;
}

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: "eu-west-2_mXJEXo9bq",
            userPoolClientId: "4krvn7bk6oeg0vavpt73igam23",
            loginWith: {
                email: true,
            },
        },
    },
});

export default function Login(props: MagicLinkProps) {
    return (
        <>
            <Head>
                <title>Upfront - Login</title>
                <meta
                    name="description"
                    content="Generated by create next app"
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link
                    rel="icon"
                    href="/upfront/svg/favicon-no-background.svg"
                />
            </Head>
            <Layout>
                <Center>
                    <Text>Login successful, redirecting to dashboard...</Text>
                </Center>
            </Layout>
        </>
    );
}

export const getServerSideProps = (async (context) => {
    const props: MagicLinkProps = {
        email: context.query.email as string,
        token: context.query.token as string,
    };

    const cognitoUser = await signIn({
        username: props.email,
        options: { authFlowType: "CUSTOM_WITHOUT_SRP" },
    });
    try {
        const challengeResult = await confirmSignIn({
            challengeResponse: props.token,
        });
    } catch (err) {
        console.log(err);
    }

    return { props: props };
}) satisfies GetServerSideProps<MagicLinkProps>;