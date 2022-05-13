import { APIGatewayProxyResult, APIGatewayProxyResultV2 } from "aws-lambda";
export function addCorsHeader(): { [header: string]: boolean | number | string } {
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
    };
}
