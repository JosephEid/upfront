import Head from "next/head";
import { Box, Button, Center, Divider, Input, Text } from "@chakra-ui/react";
import Layout from "@/components/Layout";
import React, { useState } from "react";

export default function Login() {
    const [email, setEmail] = useState("");
    const submitClicked = () => {
        fetch("/api/start_challenge", {
            body: JSON.stringify({ email: email.toLocaleLowerCase() }),
            method: "POST",
        });
    };
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
                    <Box>
                        <Text fontSize={"2.5rem"} fontWeight={700} my="1rem">
                            Login
                        </Text>
                        <Text>
                            Log in below to manage and view Jobs that you have
                            posted.
                        </Text>
                        <Input
                            type="email"
                            placeholder="Enter your email address."
                            my="1rem"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Divider mb="1rem" />
                        <Button width="100%" onClick={() => submitClicked()}>
                            Submit
                        </Button>
                    </Box>
                </Center>
            </Layout>
        </>
    );
}
