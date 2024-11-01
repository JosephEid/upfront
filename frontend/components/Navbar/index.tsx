import {
    Box,
    Flex,
    Text,
    IconButton,
    Button,
    Stack,
    Collapse,
    Icon,
    Link,
    Popover,
    PopoverTrigger,
    PopoverContent,
    useColorModeValue,
    useBreakpointValue,
    useDisclosure,
    Image,
} from "@chakra-ui/react";
import {
    HamburgerIcon,
    CloseIcon,
    ChevronDownIcon,
    ChevronRightIcon,
} from "@chakra-ui/icons";
import { NextRouter, useRouter } from "next/router";
import { signOut } from "aws-amplify/auth";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

export default function Navbar({ signedIn }: { signedIn: boolean }) {
    const { isOpen, onToggle } = useDisclosure();
    const router = useRouter();

    const [isSignedIn, setIsSignedIn] = useState<boolean>(signedIn);

    return (
        <Box mb={{ base: 0, md: "1rem" }} mx={{ base: 0, md: "2rem" }}>
            <Flex
                bg={useColorModeValue("white", "gray.800")}
                color={useColorModeValue("gray.600", "white")}
                minH={"60px"}
                py={{ base: 2 }}
                borderBottom={1}
                borderStyle={"solid"}
                borderColor={useColorModeValue("gray.200", "gray.900")}
                align={"center"}
                width={"100%"}
                alignItems={"center"}
                justifyContent={"space-between"}
            >
                <Flex
                    flex={{ base: 1, md: "auto" }}
                    ml={{ base: -2 }}
                    display={{ base: "flex", md: "none" }}
                >
                    <IconButton
                        onClick={onToggle}
                        icon={
                            isOpen ? (
                                <CloseIcon w={3} h={3} />
                            ) : (
                                <HamburgerIcon w={5} h={5} />
                            )
                        }
                        variant={"ghost"}
                        aria-label={"Toggle Navigation"}
                    />
                </Flex>

                <Flex
                    flex={{ base: 1 }}
                    justify={{ base: "center", md: "start" }}
                    alignItems={"center"}
                >
                    <Image
                        src="/upfront/svg/logo-no-background.svg"
                        width="8rem"
                        alt="upfront"
                    />

                    <Flex
                        display={{ base: "none", md: "flex" }}
                        verticalAlign={"middle"}
                        ml="1rem"
                    >
                        <DesktopNav router={router} />
                    </Flex>
                </Flex>

                <Stack
                    flex={{ base: 1, md: 0 }}
                    justify={"flex-end"}
                    direction={"row"}
                    spacing={6}
                >
                    <Button
                        display={{ base: "none", md: "inline-flex" }}
                        onClick={() => router.push("/post-job")}
                    >
                        Post a job
                    </Button>
                    {isSignedIn !== undefined &&
                        (isSignedIn === true ? (
                            <>
                                <Button
                                    display={{
                                        base: "none",
                                        md: "inline-flex",
                                    }}
                                    fontSize={"1rem"}
                                    fontWeight={600}
                                    color={"white"}
                                    bg={"upfront.300"}
                                    onClick={async () => {
                                        router.push("/dashboard");
                                    }}
                                    _hover={{
                                        bg: "upfront.200",
                                    }}
                                >
                                    Recruiter Dashboard
                                </Button>
                                <Button
                                    display={{
                                        base: "none",
                                        md: "inline-flex",
                                    }}
                                    fontSize={"1rem"}
                                    fontWeight={600}
                                    color={"white"}
                                    bg={"upfront.300"}
                                    onClick={async () => {
                                        await fetch("/api/sign_out");
                                        setIsSignedIn(false);
                                        router.push("/login");
                                    }}
                                    _hover={{
                                        bg: "upfront.200",
                                    }}
                                >
                                    Log Out
                                </Button>
                            </>
                        ) : (
                            <Button
                                display={{ base: "none", md: "inline-flex" }}
                                fontSize={"1rem"}
                                fontWeight={600}
                                color={"white"}
                                bg={"upfront.300"}
                                onClick={() => router.push("/login")}
                                _hover={{
                                    bg: "upfront.200",
                                }}
                            >
                                Recruiter Log In
                            </Button>
                        ))}
                </Stack>
            </Flex>

            <Collapse in={isOpen} animateOpacity>
                <MobileNav
                    router={router}
                    isSignedIn={isSignedIn}
                    setIsSignedIn={setIsSignedIn}
                />
            </Collapse>
        </Box>
    );
}

const DesktopNav = (props: any) => {
    const linkColor = useColorModeValue("gray.600", "gray.200");
    const linkHoverColor = useColorModeValue("gray.800", "white");
    const popoverContentBgColor = useColorModeValue("white", "gray.800");

    return (
        <Stack direction={"row"} spacing={4} verticalAlign={"middle"}>
            {NAV_ITEMS.map((navItem) => (
                <Box key={navItem.label}>
                    <Popover trigger={"hover"} placement={"bottom-start"}>
                        <PopoverTrigger>
                            <Link
                                p={2}
                                // href={navItem.href ?? "#"}
                                fontSize={"1.25rem"}
                                fontWeight={500}
                                color={linkColor}
                                _hover={{
                                    textDecoration: "none",
                                    color: linkHoverColor,
                                }}
                                onClick={() => props.router.push(navItem.href)}
                            >
                                {navItem.label}
                            </Link>
                        </PopoverTrigger>

                        {navItem.children && (
                            <PopoverContent
                                border={0}
                                boxShadow={"xl"}
                                bg={popoverContentBgColor}
                                p={4}
                                rounded={"xl"}
                                minW={"sm"}
                            >
                                <Stack>
                                    {navItem.children.map((child) => (
                                        <DesktopSubNav
                                            key={child.label}
                                            {...child}
                                        />
                                    ))}
                                </Stack>
                            </PopoverContent>
                        )}
                    </Popover>
                </Box>
            ))}
        </Stack>
    );
};

const DesktopSubNav = ({ label, href, subLabel }: NavItem) => {
    return (
        <Link
            href={href}
            role={"group"}
            display={"block"}
            p={2}
            rounded={"md"}
            _hover={{ bg: useColorModeValue("pink.50", "gray.900") }}
        >
            <Stack direction={"row"} align={"center"}>
                <Box>
                    <Text
                        transition={"all .3s ease"}
                        _groupHover={{ color: "pink.400" }}
                        fontWeight={500}
                    >
                        {label}
                    </Text>
                    <Text fontSize={"sm"}>{subLabel}</Text>
                </Box>
                <Flex
                    transition={"all .3s ease"}
                    transform={"translateX(-10px)"}
                    opacity={0}
                    _groupHover={{
                        opacity: "100%",
                        transform: "translateX(0)",
                    }}
                    justify={"flex-end"}
                    align={"center"}
                    flex={1}
                >
                    <Icon
                        color={"pink.400"}
                        w={5}
                        h={5}
                        as={ChevronRightIcon}
                    />
                </Flex>
            </Stack>
        </Link>
    );
};

const MobileNav = ({
    router,
    isSignedIn,
    setIsSignedIn,
}: {
    router: NextRouter;
    isSignedIn: boolean | undefined;
    setIsSignedIn: Dispatch<SetStateAction<boolean>>;
}) => {
    return (
        <Stack
            bg={useColorModeValue("white", "gray.800")}
            p={4}
            display={{ md: "none" }}
            className="navbar"
        >
            {NAV_ITEMS.map((navItem) => (
                <MobileNavItem key={navItem.label} {...navItem} />
            ))}
            <Stack
                flex={{ base: 1, md: 0 }}
                justify={"flex-end"}
                direction={"column"}
                spacing={6}
                className={"buttons"}
            >
                <Button onClick={() => router.push("/post-job")}>
                    Post a job
                </Button>
                {isSignedIn !== undefined &&
                    (isSignedIn === true ? (
                        <Button
                            fontSize={"1rem"}
                            fontWeight={600}
                            color={"white"}
                            bg={"upfront.300"}
                            onClick={async () => {
                                await fetch("/api/sign_out");
                                setIsSignedIn(false);
                                router.push("/login");
                            }}
                            _hover={{
                                bg: "upfront.200",
                            }}
                        >
                            Log Out
                        </Button>
                    ) : (
                        <Button
                            fontSize={"1rem"}
                            fontWeight={600}
                            color={"white"}
                            bg={"upfront.300"}
                            onClick={() => router.push("/login")}
                            _hover={{
                                bg: "upfront.200",
                            }}
                        >
                            Recruiter Log In
                        </Button>
                    ))}
            </Stack>
        </Stack>
    );
};

const MobileNavItem = ({ label, children, href }: NavItem) => {
    const { isOpen, onToggle } = useDisclosure();

    return (
        <Stack spacing={4} onClick={children && onToggle}>
            <Flex
                py={2}
                as={Link}
                href={href ?? "#"}
                justify={"space-between"}
                align={"center"}
                _hover={{
                    textDecoration: "none",
                }}
            >
                <Text
                    fontWeight={600}
                    color={useColorModeValue("gray.600", "gray.200")}
                >
                    {label}
                </Text>
                {children && (
                    <Icon
                        as={ChevronDownIcon}
                        transition={"all .25s ease-in-out"}
                        transform={isOpen ? "rotate(180deg)" : ""}
                        w={6}
                        h={6}
                    />
                )}
            </Flex>

            <Collapse
                in={isOpen}
                animateOpacity
                style={{ marginTop: "0!important" }}
            >
                <Stack
                    mt={2}
                    pl={4}
                    borderLeft={1}
                    borderStyle={"solid"}
                    borderColor={useColorModeValue("gray.200", "gray.700")}
                    align={"start"}
                >
                    {children &&
                        children.map((child) => (
                            <Link key={child.label} py={2} href={child.href}>
                                {child.label}
                            </Link>
                        ))}
                </Stack>
            </Collapse>
        </Stack>
    );
};

interface NavItem {
    label: string;
    subLabel?: string;
    children?: Array<NavItem>;
    href?: string;
}

const NAV_ITEMS: Array<NavItem> = [
    {
        label: "Jobs",
        href: "/",
    },
    // {
    //     label: "Salaries",
    //     href: "#",
    // },
    // {
    //     label: "Companies",
    //     href: "#",
    // },
];
