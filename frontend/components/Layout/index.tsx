import React, { ReactNode } from "react";
import Navbar from "../Navbar";
import { Container } from "@chakra-ui/react";
import { Abel } from "next/font/google";

const abel = Abel({
    subsets: ["latin"],
    display: "swap",
    weight: "400",
});

const Layout = ({ children }: { children: ReactNode }) => {
    return (
        <main>
            <Container
                maxWidth={{ base: "100%" }}
                className={`${abel.className} layout`}
                minHeight={"100%"}
            >
                <Navbar />
                <Container
                    maxWidth={{ base: "100%", md: "90%", lg: "70%" }}
                    px={{ base: 0, md: "1rem" }}
                >
                    {children}
                </Container>
            </Container>
        </main>
    );
};

export default Layout;
