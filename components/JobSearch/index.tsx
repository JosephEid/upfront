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
} from "@chakra-ui/react";
import { useState } from "react";

export default function JobSearch() {
    const [criteria, setCriteria] = useState("");
    const [location, setLocation] = useState("");
    const [locationSuggestions, setLocationSuggestions] = useState([]);

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
                    />
                    <Input
                        type="text"
                        placeholder="City, Country"
                        onChange={(e) => setLocation(e.target.value)}
                    />
                    {locationSuggestions.length > 0 && (
                        <Box>
                            <Text>Here</Text>
                        </Box>
                    )}
                    <Select>{getSalaries()}</Select>
                    <Button
                        width="30%"
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
