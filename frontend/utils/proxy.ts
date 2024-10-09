const bffUrl = process.env.BFF_URL;
if (!bffUrl) {
    throw new Error("BFF_URL not set");
}

const signedFetch = createSignedFetcher({
    service: "execute-api",
    region: "eu-west-1",
});

export const bffFetch = async (url: string, options: RequestInit) => {
    const session = await getServerSession<object, SessionWithToken>(
        authOptions
    );
    if (!session?.apiAccessToken) {
        throw new Error("Could not find an access token on the session");
    }
    return await signedFetch(bffUrl + url, {
        ...options,
        headers: {
            ...options.headers,
            API_Authorization: session.apiAccessToken,
        },
    });
};

const noBodyRequests = ["GET", "DELETE", "HEAD", "OPTIONS"];

export async function bffProxy(req: NextRequest) {
    const url = req.nextUrl.pathname.replace(/^\/api/, "");

    log.info("Proxying request from front end to BFF", {
        requestUrl: req.url,
        proxyUrl: url,
    });

    const response = await bffFetch(url, {
        method: req.method,
        body: noBodyRequests.includes(req.method)
            ? undefined
            : await req.text(),
        headers: req.headers,
    });

    log.info("Proxying response received", {
        requestUrl: req.url,
        proxyUrl: url,
        proxyResponseStatus: response.status,
    });

    const responseText = await response.text();
    let body = {};
    if (responseText !== "") {
        body = JSON.parse(responseText);
    }
    const headers: Headers = new Headers();
    const traceId = response.headers.get(traceIdHeaderName);
    if (traceId && traceId !== "") {
        headers.set(traceIdHeaderName, traceId);
    }

    return NextResponse.json(body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
    });
}
