import {
    Box,
    Button,
    Checkbox,
    Flex,
    FormControl,
    FormErrorMessage,
    FormLabel,
    HStack,
    Icon,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    Stack,
    Text,
    VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import locations from "./locations.json";
import jobSkills from "./jobSkills.json";
import { Field, Formik } from "formik";
import { SearchIcon } from "@chakra-ui/icons";
import { FaMapPin, FaSearch } from "react-icons/fa";

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
        <Formik
            initialValues={{
                jobCriteria: "",
                location: "",
            }}
            onSubmit={(values) => {
                alert(JSON.stringify(values, null, 2));
            }}
        >
            {({ handleSubmit, errors, touched }) => (
                <form onSubmit={handleSubmit}>
                    <Stack
                        direction={["column", "row"]}
                        gap={"0"}
                        align="flex-start"
                        height="3rem"
                        marginTop="2rem"
                    >
                        <FormControl width={{ base: "100%", md: "50%" }}>
                            <FormLabel htmlFor="jobCriteria" display={"none"}>
                                Job Criteria
                            </FormLabel>
                            <Field name="jobCriteria">
                                {({
                                    field, // { name, value, onChange, onBlur }
                                    form: { touched, errors }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
                                    meta,
                                }: any) => (
                                    <>
                                        <InputGroup size={"lg"}>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon
                                                    as={FaSearch}
                                                    color="gray.300"
                                                />
                                            </InputLeftElement>
                                            <Input
                                                type="text"
                                                placeholder="What role are you looking for, e.g. Skills, Company?"
                                                onChange={(e) =>
                                                    displayCriteriaSuggestions(
                                                        e.target.value
                                                    )
                                                }
                                                value={criteria}
                                                borderRightRadius={{ md: "0" }}
                                                mb={{ base: "1rem", md: "0" }}
                                            />
                                            {criteriaSuggestions.length > 0 && (
                                                <Box
                                                    borderRadius={"0.375rem"}
                                                    border={"1px solid"}
                                                    borderColor={"#e2e8f0"}
                                                    width={"100%"}
                                                >
                                                    {criteriaSuggestions.map(
                                                        (x) => (
                                                            <Text
                                                                as="button"
                                                                _hover={{
                                                                    bg: "gray.200",
                                                                }}
                                                                width={"100%"}
                                                                paddingInline={
                                                                    "0.5rem"
                                                                }
                                                                my="0.25rem"
                                                                key={x}
                                                                onClick={() => {
                                                                    setCriteria(
                                                                        x
                                                                    );
                                                                    setCriteriaSuggestions(
                                                                        []
                                                                    );
                                                                }}
                                                            >
                                                                {x}
                                                            </Text>
                                                        )
                                                    )}
                                                </Box>
                                            )}
                                        </InputGroup>
                                    </>
                                )}
                            </Field>
                        </FormControl>
                        <FormControl
                            isInvalid={!!errors.location && touched.location}
                            width={{ base: "100%", md: "30%" }}
                        >
                            <FormLabel htmlFor="location" display="none">
                                Location
                            </FormLabel>
                            <Field name="location">
                                {({
                                    field, // { name, value, onChange, onBlur }
                                    form: { touched, errors }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
                                    meta,
                                }: any) => (
                                    <>
                                        <InputGroup size={"lg"}>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon
                                                    as={FaMapPin}
                                                    color="gray.300"
                                                />
                                            </InputLeftElement>
                                            <Input
                                                type="text"
                                                placeholder="Location"
                                                onChange={(e) =>
                                                    displayLocationSuggestions(
                                                        e.target.value
                                                    )
                                                }
                                                value={location}
                                                borderRadius={{
                                                    base: "0.375rem",
                                                    md: "0",
                                                }}
                                                mb={{ base: "1rem", md: "0" }}
                                            />
                                            {locationSuggestions.length > 0 && (
                                                <Box
                                                    borderBottomRadius={
                                                        "0.375rem"
                                                    }
                                                    border={"1px solid"}
                                                    borderColor={"#e2e8f0"}
                                                    width={"100%"}
                                                >
                                                    {locationSuggestions.map(
                                                        (x) => (
                                                            <Text
                                                                as="button"
                                                                _hover={{
                                                                    bg: "gray.200",
                                                                }}
                                                                width={"100%"}
                                                                paddingInline={
                                                                    "0.5rem"
                                                                }
                                                                my="0.25rem"
                                                                key={x.city}
                                                                onClick={() => {
                                                                    setLocation(
                                                                        `${x.city}, ${x.country}`
                                                                    );
                                                                    setLocationSuggestions(
                                                                        []
                                                                    );
                                                                }}
                                                            >
                                                                {x.city},{" "}
                                                                {x.country}
                                                            </Text>
                                                        )
                                                    )}
                                                </Box>
                                            )}
                                        </InputGroup>
                                    </>
                                )}
                            </Field>
                            <FormErrorMessage>
                                {errors.location}
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
                        >
                            Find Jobs
                        </Button>
                    </Stack>
                </form>
            )}
        </Formik>

        // <Box>
        //     <Text fontWeight="700" mb="1rem">
        //         Job Search:
        //     </Text>
        //     <FormControl>
        //         <Stack
        //             direction={["column", "row"]}
        //             justifyContent={"space-between"}
        //         >
        //             <Box width="100%">
        //                 <Input
        //                     type="text"
        //                     placeholder="Skills, Company"
        //                     onChange={(e) =>
        //                         displayCriteriaSuggestions(e.target.value)
        //                     }
        //                     value={criteria}
        //                 />
        //                 {criteriaSuggestions.length > 0 && (
        //                     <Box
        //                         borderRadius={"0.375rem"}
        //                         border={"1px solid"}
        //                         borderColor={"#e2e8f0"}
        //                         width={"100%"}
        //                     >
        //                         {criteriaSuggestions.map((x) => (
        //                             <Text
        //                                 as="button"
        //                                 _hover={{
        //                                     bg: "gray.200",
        //                                 }}
        //                                 width={"100%"}
        //                                 paddingInline={"0.5rem"}
        //                                 my="0.25rem"
        //                                 key={x}
        //                                 onClick={() => {
        //                                     setCriteria(x);
        //                                     setCriteriaSuggestions([]);
        //                                 }}
        //                             >
        //                                 {x}
        //                             </Text>
        //                         ))}
        //                     </Box>
        //                 )}
        //             </Box>

        //             <Box width="100%">
        //                 <VStack gap="0.25rem">
        // <Input
        //     type="text"
        //     placeholder="City, Country"
        //     onChange={(e) =>
        //         displayLocationSuggestions(e.target.value)
        //     }
        //     value={location}
        // />
        // {locationSuggestions.length > 0 && (
        //     <Box
        //         borderRadius={"0.375rem"}
        //         border={"1px solid"}
        //         borderColor={"#e2e8f0"}
        //         width={"100%"}
        //     >
        //         {locationSuggestions.map((x) => (
        //             <Text
        //                 as="button"
        //                 _hover={{
        //                     bg: "gray.200",
        //                 }}
        //                 width={"100%"}
        //                 paddingInline={"0.5rem"}
        //                 my="0.25rem"
        //                 key={x.city}
        //                 onClick={() => {
        //                     setLocation(
        //                         `${x.city}, ${x.country}`
        //                     );
        //                     setLocationSuggestions([]);
        //                 }}
        //             >
        //                 {x.city}, {x.country}
        //             </Text>
        //         ))}
        //     </Box>
        // )}
        //                 </VStack>
        //             </Box>

        //             <Box width="100%">
        //                 <Select>{getSalaries()}</Select>
        //             </Box>
        //             <Box>
        //                 <Button
        //                     onClick={() => validateOrLoad()}
        //                     bg={"upfront.300"}
        //                     _hover={{
        //                         bg: "upfront.200",
        //                     }}
        //                     minWidth={"4rem"}
        //                     width={"100%"}
        //                 >
        //                     Submit
        //                 </Button>
        //             </Box>
        //         </Stack>
        //     </FormControl>
        // </Box>
    );
}
