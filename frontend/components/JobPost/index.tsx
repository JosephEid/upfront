import { JobPostItem } from "@/pages/api/checkout_session/[id]";
import { JobPostFormProps } from "@/pages/post-job";
import {
    Box,
    Button,
    Center,
    Divider,
    HStack,
    Icon,
    Image,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Stack,
    Text,
    useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";

import { FaClock, FaMapPin } from "react-icons/fa";

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
    createdAt,
}: JobPostItem) => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const currencySymbol = getCurrencySymbol(currency);
    const now = Date.now();
    const created = Date.parse(createdAt!);
    const diffTime = Math.abs(now - created);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let timeCreated;
    if (diffDays > 1) {
        timeCreated = diffDays + " days ago";
    } else if (diffDays === 1) {
        timeCreated = "1 day ago";
    } else {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours > 1) {
            timeCreated = diffHours + " hours ago";
        } else if (diffHours === 1) {
            timeCreated = "1 hour ago";
        } else {
            timeCreated = "Just Now";
        }
    }
    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {title} @ {companyName}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box
                            border="1px"
                            borderRadius={"5px"}
                            borderColor={"gray.200"}
                            p="0.5rem"
                        >
                            <Stack
                                alignItems={"left"}
                                direction={["column", "row"]}
                                textAlign={"left"}
                            >
                                <Center>
                                    <Box
                                        width={{ base: "75px", md: "100px" }}
                                        height={{ base: "75px", md: "100px" }}
                                    >
                                        <Image
                                            src={
                                                companyLogoURL === ""
                                                    ? "/upfront/svg/logo-color-small.svg"
                                                    : companyLogoURL
                                            }
                                            alt="Company logo"
                                            width={{
                                                base: "75px",
                                                md: "100px",
                                            }}
                                            height={{
                                                base: "75px",
                                                md: "100px",
                                            }}
                                            borderRadius={"5px"}
                                        />
                                    </Box>
                                </Center>
                                <Box>
                                    <Text fontSize="1rem">
                                        <Icon
                                            width="1rem"
                                            height="1rem"
                                            mr="0.5rem"
                                            mt="0.5rem"
                                            as={FaMapPin}
                                            color="upfront.300"
                                        />
                                        {location === ""
                                            ? "London, UK"
                                            : location}
                                    </Text>
                                    <Text fontSize="1rem">
                                        <Icon
                                            width="1rem"
                                            height="1rem"
                                            mr="0.5rem"
                                            mt="0.5rem"
                                            as={FaClock}
                                            color="upfront.300"
                                        />
                                        {timeCreated}
                                    </Text>

                                    <Text fontSize={"1rem"}>
                                        {`${currencySymbol}${formatNumberWithCommas(
                                            minSalary ?? 0
                                        )} to ${currencySymbol}${formatNumberWithCommas(
                                            maxSalary ?? 0
                                        )}`}{" "}
                                        per annum
                                    </Text>
                                </Box>
                            </Stack>
                            <Divider my="1rem" />
                            <Box>
                                <Text my="1rem">
                                    <Markdown className={"job-description"}>
                                        {description}
                                    </Markdown>
                                </Text>
                            </Box>
                        </Box>
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={onClose}>
                            Close
                        </Button>
                        <Button
                            as={"a"}
                            backgroundColor="upfront.300"
                            href={
                                howToApply +
                                "?utm_medium=website&utm_source=UpfrontJobs&ref=UpfrontJobs&source=UpfrontJobs"
                            }
                            target="_blank"
                            color={"white"}
                        >
                            Apply
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            <Box
                as={"button"}
                textAlign={"left"}
                onClick={onOpen}
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
                        width={{ base: "75px", md: "100px" }}
                        height={{ base: "75px", md: "100px" }}
                    >
                        <Image
                            src={
                                companyLogoURL === ""
                                    ? "/upfront/svg/logo-color-small.svg"
                                    : companyLogoURL
                            }
                            alt="Company logo"
                            width={{ base: "75px", md: "100px" }}
                            height={{ base: "75px", md: "100px" }}
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
                                <Text
                                    fontSize={{ base: "1rem", md: "1.25rem" }}
                                    as="span"
                                ></Text>
                            </Text>
                            <Text fontSize={{ base: "1rem", md: "1.25rem" }}>
                                <Icon
                                    width="1rem"
                                    height="1rem"
                                    mr="0.5rem"
                                    mt="0.5rem"
                                    as={FaMapPin}
                                    color="upfront.300"
                                />
                                {location === "" ? "London, UK" : location}
                            </Text>
                            <Text fontSize={{ base: "1rem", md: "1.25rem" }}>
                                <Icon
                                    width="1rem"
                                    height="1rem"
                                    mr="0.5rem"
                                    mt="0.5rem"
                                    as={FaClock}
                                    color="upfront.300"
                                />
                                {timeCreated}
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
        </>
    );
};
