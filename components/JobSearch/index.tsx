import {
    Box,
    Button,
    Flex,
    FormControl,
    FormLabel,
    HStack,
    Input,
    Select,
    Stack,
    Text,
    VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import locations from "./locations.json";
import jobSkills from "./jobSkills.json";

interface Location {
    city: string;
    country: string;
}

export default function JobSearch() {
    const [criteria, setCriteria] = useState("");
    const [location, setLocation] = useState("");
    const [locationSuggestions, setLocationSuggestions] = useState<Location[]>(
        []
    );
    const [criteriaSuggestions, setCriteriaSuggestions] = useState<string[]>(
        []
    );

    const getSalaries = () => {
        const salaryOpts = [];

        for (let i = 1; i <= 14; i++) {
            salaryOpts.push(
                <option key={i * 10000} value={i * 10000}>{`£${
                    i * 10
                },000 or more`}</option>
            );
        }

        return salaryOpts;
    };

    const validateOrLoad = () => {
        if (criteria === "") {
            console.log("error criteria");
        }

        if (criteria === "") {
            console.log("error location");
        }
    };

    const displayLocationSuggestions = (value: string) => {
        setLocation(value);
        value = value.toLowerCase();
        if (value.length <= 1) {
            setLocationSuggestions([]);
            return;
        }

        const suggestions = (locations as Location[]).filter(
            (x: Location) =>
                x.city.toLowerCase().includes(value) ||
                x.country.toLowerCase().includes(value)
        );

        setLocationSuggestions(suggestions);
    };

    const displayCriteriaSuggestions = (value: string) => {
        setCriteria(value);
        value = value.toLowerCase();
        if (value.length <= 1) {
            setCriteriaSuggestions([]);
            return;
        }

        const suggestions = (jobSkills as string[]).filter((x) =>
            x.toLowerCase().includes(value)
        );

        setCriteriaSuggestions(suggestions);
    };

    return (
        <Box>
            <Text fontWeight="700" mb="1rem">
                Job Search:
            </Text>
            <FormControl>
                <Stack
                    direction={["column", "row"]}
                    justifyContent={"space-between"}
                >
                    <Box width="100%">
                        <Input
                            type="text"
                            placeholder="Skills, Company"
                            onChange={(e) =>
                                displayCriteriaSuggestions(e.target.value)
                            }
                            value={criteria}
                        />
                        {criteriaSuggestions.length > 0 && (
                            <Box
                                borderRadius={"0.375rem"}
                                border={"1px solid"}
                                borderColor={"#e2e8f0"}
                                width={"100%"}
                            >
                                {criteriaSuggestions.map((x) => (
                                    <Text
                                        as="button"
                                        _hover={{
                                            bg: "gray.200",
                                        }}
                                        width={"100%"}
                                        paddingInline={"0.5rem"}
                                        my="0.25rem"
                                        onClick={() => {
                                            setCriteria(x);
                                            setCriteriaSuggestions([]);
                                        }}
                                    >
                                        {x}
                                    </Text>
                                ))}
                            </Box>
                        )}
                    </Box>

                    <Box width="100%">
                        <VStack gap="0.25rem">
                            <Input
                                type="text"
                                placeholder="City, Country"
                                onChange={(e) =>
                                    displayLocationSuggestions(e.target.value)
                                }
                                value={location}
                            />
                            {locationSuggestions.length > 0 && (
                                <Box
                                    borderRadius={"0.375rem"}
                                    border={"1px solid"}
                                    borderColor={"#e2e8f0"}
                                    width={"100%"}
                                >
                                    {locationSuggestions.map((x) => (
                                        <Text
                                            as="button"
                                            _hover={{
                                                bg: "gray.200",
                                            }}
                                            width={"100%"}
                                            paddingInline={"0.5rem"}
                                            my="0.25rem"
                                            onClick={() => {
                                                setLocation(
                                                    `${x.city}, ${x.country}`
                                                );
                                                setLocationSuggestions([]);
                                            }}
                                        >
                                            {x.city}, {x.country}
                                        </Text>
                                    ))}
                                </Box>
                            )}
                        </VStack>
                    </Box>

                    <Box width="100%">
                        <Select>{getSalaries()}</Select>
                    </Box>
                    <Box>
                        <Button
                            onClick={() => validateOrLoad()}
                            bg={"upfront.300"}
                            _hover={{
                                bg: "upfront.200",
                            }}
                            minWidth={"4rem"}
                            width={"100%"}
                        >
                            Submit
                        </Button>
                    </Box>
                </Stack>
            </FormControl>
        </Box>
    );
}
