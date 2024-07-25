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
            <Container maxWidth={{ base: "100%" }} className={abel.className}>
                <Navbar />
                <Container
                    maxWidth={{ base: "100%", md: "70%", sm: "60%" }}
                    height={"auto"}
                >
                    {children}
                </Container>
            </Container>
        </main>
    );
};

export default Layout;
