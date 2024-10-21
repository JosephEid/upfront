import {
    Box,
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Icon,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    Stack,
    Text,
} from "@chakra-ui/react";
import { useState } from "react";
import locations from "./locations.json";
import jobSkills from "./jobSkills.json";
import { FaMapPin, FaSearch } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { JobPostItem } from "@/pages/api/checkout_session/[id]";

interface Location {
    city: string;
    country: string;
}

interface JobSearchProps {
    setJobPosts: React.Dispatch<React.SetStateAction<JobPostItem[]>>;
}

export default function JobSearch(props: JobSearchProps) {
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

    const displayLocationSuggestions = (value: string) => {
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

    const {
        handleSubmit,
        register,
        formState: { errors, isSubmitting },
        setValue,
    } = useForm();

    async function onSubmit(values: any) {
        const jobsResponse = await fetch(
            `/api/all_jobs?salary=${values.salary ?? ""}&location=${
                values.location ?? ""
            }&title=${values.title ?? ""}`
        );

        const data = await jobsResponse.json();

        props.setJobPosts(data);
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Stack
                direction={["column", "row"]}
                gap={"0"}
                align="flex-start"
                marginTop="2rem"
            >
                <FormControl
                    width={{ base: "100%", md: "50%" }}
                    isInvalid={errors.criteria !== undefined}
                >
                    <FormLabel htmlFor="jobCriteria" display={"none"}>
                        Job Criteria
                    </FormLabel>

                    <InputGroup size={"lg"}>
                        <InputLeftElement pointerEvents="none">
                            <Icon as={FaSearch} color="gray.300" />
                        </InputLeftElement>
                        <Input
                            id="criteria"
                            {...register("criteria", {
                                minLength: {
                                    value: 2,
                                    message: "Minimum length should be 2",
                                },
                                onChange: (e) =>
                                    displayCriteriaSuggestions(e.target.value),
                            })}
                            type="text"
                            placeholder="What role are you looking for, e.g. Skills, Company?"
                            borderRightRadius={{ md: "0" }}
                        />
                    </InputGroup>
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
                                    key={x}
                                    onClick={() => {
                                        setValue("criteria", x);
                                        setCriteriaSuggestions([]);
                                    }}
                                >
                                    {x}
                                </Text>
                            ))}
                        </Box>
                    )}
                    <FormErrorMessage>
                        {errors.criteria?.message?.toString()}
                    </FormErrorMessage>
                </FormControl>
                <FormControl
                    width={{ base: "100%", md: "30%" }}
                    isInvalid={errors.location !== undefined}
                >
                    <FormLabel htmlFor="location" display="none">
                        Location
                    </FormLabel>
                    <InputGroup size={"lg"}>
                        <InputLeftElement pointerEvents="none">
                            <Icon as={FaMapPin} color="gray.300" />
                        </InputLeftElement>
                        <Input
                            type="text"
                            placeholder="Location"
                            id="location"
                            {...register("location", {
                                minLength: {
                                    value: 2,
                                    message: "Minimum length should be 2",
                                },
                                onChange: (e) => {
                                    displayLocationSuggestions(e.target.value);
                                },
                            })}
                            borderRadius={{
                                base: "0.375rem",
                                md: "0",
                            }}
                            mb={{ base: "1rem", md: "0" }}
                        />
                    </InputGroup>
                    {locationSuggestions.length > 0 && (
                        <Box
                            borderBottomRadius={"0.375rem"}
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
                                    key={x.city}
                                    onClick={() => {
                                        setValue(
                                            "location",
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
                    <FormErrorMessage>
                        {errors.location?.message?.toString()}
                    </FormErrorMessage>
                </FormControl>
                <FormControl
                    isInvalid={errors.salary !== undefined}
                    width={{ base: "100%", md: "30%" }}
                >
                    <FormLabel htmlFor="salary" display="none">
                        Salary
                    </FormLabel>
                    <InputGroup size={"lg"}>
                        <Select
                            id="salary"
                            borderRadius={{
                                base: "0.375rem",
                                md: "0",
                            }}
                            {...register("salary", {
                                required: "This is required",
                            })}
                            mb={{ base: "1rem", md: "0" }}
                        >
                            {getSalaries()}
                        </Select>
                    </InputGroup>
                    <FormErrorMessage>
                        {errors.salary?.message?.toString()}
                    </FormErrorMessage>
                </FormControl>
                <Button
                    type="submit"
                    backgroundColor="upfront.300"
                    color="white"
                    width={{ base: "100%", md: "20%" }}
                    borderLeftRadius={{ md: "0" }}
                    size={"lg"}
                    lineHeight={"3.5rem"}
                    fontSize={{ base: "1rem", md: "1.5rem" }}
                    isLoading={isSubmitting}
                >
                    Find Jobs
                </Button>
            </Stack>
        </form>
    );
}
