import type { AppProps } from "next/app";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import "../styles/index.css";
import { Amplify } from "aws-amplify";

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: "eu-west-2_Cm0yER0fG",
            userPoolClientId: "p63epfbef86asirih4ec51f8",
            loginWith: {
                email: true,
            },
        },
    },
});

export default function App({ Component, pageProps }: AppProps) {
    const theme = extendTheme({
        colors: {
            upfront: {
                200: "#9ad9d4",
                300: "#8cbdb8",
            },
            upfrontComp: {
                300: "#BD8C91",
            },
        },
    });
    return (
        <ChakraProvider theme={theme}>
            <Component {...pageProps} />
        </ChakraProvider>
    );
}
