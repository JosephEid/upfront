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

    const displaySuggestions = (value: string) => {
        console.log("here");
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

    return (
        <Box>
            <Text fontWeight="700">Job Search:</Text>
            <FormControl>
                <Stack
                    direction={["column", "row"]}
                    justifyContent={"space-between"}
                >
                    <Input
                        type="text"
                        placeholder="Skills, Company"
                        onChange={(e) => setCriteria(e.target.value)}
                        minWidth={"27.5%"}
                    />
                    <VStack minWidth={"27.5%"}>
                        <Input
                            type="text"
                            placeholder="City, Country"
                            onChange={(e) =>
                                e.target.value.length > 1 &&
                                displaySuggestions(e.target.value.toLowerCase())
                            }
                        />
                        {locationSuggestions.length > 0 && (
                            <Box
                                borderRadius={"0.375rem"}
                                border={"1px solid"}
                                paddingInline={"1rem"}
                                width={"100%"}
                            >
                                {locationSuggestions.map((x) => (
                                    <Text>
                                        {x.city}, {x.country}
                                    </Text>
                                ))}
                            </Box>
                        )}
                    </VStack>

                    <Select minWidth={"27.5%"}>{getSalaries()}</Select>
                    <Button
                        minWidth={"17.5%"}
                        onClick={() => validateOrLoad()}
                        bg={"upfront.300"}
                        _hover={{
                            bg: "upfront.200",
                        }}
                    >
                        Submit
                    </Button>
                </Stack>
            </FormControl>
        </Box>
    );
}
