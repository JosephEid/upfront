import type { AppProps } from "next/app";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import "../styles/index.css";

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
