import { S3 } from "aws-sdk";
import { APIGatewayProxyEvent } from "aws-lambda";

// create S3 client
const s3 = new S3();

async function handler(event: any, context: any): Promise<any> {
    if (!isAuthorized(event)) return { statusCode: 401, body: "Unauthorized" };

    // const buckets = await s3.listBuckets().promise();

    return {
        statusCode: 200,
        body: JSON.stringify(event),
        // body: "Here are my S3 buckets: \n" + JSON.stringify(buckets.Buckets),
    };
}

function isAuthorized(event: APIGatewayProxyEvent): boolean {
    const groups: string = event.requestContext.authorizer?.claims["cognito:groups"];
    if (groups && groups.includes("admins")) return true;
    return false;
}

export { handler };
