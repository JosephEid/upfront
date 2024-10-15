import { JobPostFormProps } from "@/pages/post-job";
import { Box, HStack, Icon, Image, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FaMapPin } from "react-icons/fa";

export type Currency =
    | "GBP"
    | "USD"
    | "EUR"
    | "AUD"
    | "CAD"
    | "SGD"
    | "CHF"
    | "INR"
    | "JPY";

const currencySymbols: Record<Currency, string> = {
    GBP: "£",
    USD: "$",
    EUR: "€",
    AUD: "A$",
    CAD: "C$",
    SGD: "S$",
    CHF: "CHF",
    INR: "₹",
    JPY: "¥",
};

function getCurrencySymbol(currency: Currency): string {
    return currencySymbols[currency];
}

function formatNumberWithCommas(number: number): string {
    // Format number with commas
    return new Intl.NumberFormat("en-US").format(number);
}

export interface JobPostProps extends JobPostFormProps {
    id?: string;
    paymentIntendId?: string;
    checkoutSessionId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface JobPostRecord extends JobPostFormProps {
    id?: string;
    paymentIntendId?: string;
    checkoutSessionId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export const JobPost = ({
    companyLogoURL,
    companyName,
    companyWebsite,
    currency,
    description,
    howToApply,
    location,
    maxSalary,
    minSalary,
    title,
    visaSponsorship,
    loginEmail,
}: JobPostProps) => {
    const currencySymbol = getCurrencySymbol(currency);
    return (
        <Box
            border={"1px solid"}
            borderRadius="5px"
            borderColor={"upfront.300"}
            boxShadow={"lg"}
            padding="1rem"
            width={{ base: "100%", xl: "60%" }}
        >
            <HStack gap={{ base: "0.5rem", md: "1rem" }}>
                <Box
                    borderRadius="5px"
                    width={{ base: "50px", md: "100px" }}
                    height={{ base: "50px", md: "100px" }}
                >
                    <Image
                        src={
                            companyLogoURL === ""
                                ? "/upfront/svg/logo-color-small.svg"
                                : companyLogoURL
                        }
                        alt="Company logo"
                        width={{ base: "50px", md: "100px" }}
                        height={{ base: "50px", md: "100px" }}
                        borderRadius={"5px"}
                    />
                </Box>

                <Stack alignItems={"left"} direction={["column", "row"]}>
                    <Box>
                        <Text fontSize={{ base: "1rem", md: "2rem" }}>
                            <Text
                                as="span"
                                fontWeight="800"
                                color={"upfront.300"}
                            >
                                {title === "" ? "Job Title" : title}
                            </Text>
                            {` @ `}
                            <Text
                                as="span"
                                fontWeight="800"
                                color={"upfront.300"}
                            >
                                {companyName === ""
                                    ? "Company Name"
                                    : companyName}
                            </Text>
                        </Text>
                        <Text fontSize={{ base: "1rem", md: "1.25rem" }}>
                            <Icon
                                width="0.5em"
                                as={FaMapPin}
                                color="upfront.300"
                                mr="0.5rem"
                            />
                            {location === "" ? "London, UK" : location} | 1 hour
                            ago
                        </Text>
                        <Text fontSize={{ base: "1rem", md: "1.5rem" }}>
                            {`${currencySymbol}${formatNumberWithCommas(
                                minSalary ?? 0
                            )} to ${currencySymbol}${formatNumberWithCommas(
                                maxSalary ?? 0
                            )}`}{" "}
                            per annum
                        </Text>
                    </Box>
                </Stack>
            </HStack>
        </Box>
    );
};
