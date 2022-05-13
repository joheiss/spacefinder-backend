import { SpecRestApi } from "aws-cdk-lib/aws-apigateway";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { addCorsHeader } from "../../utils/utility";
import { Space } from "./datamodel.schema";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    const id = event.queryStringParameters?.["id"];
    const location = event.queryStringParameters?.["location"];

    try {
        let spaces;
        if (id) {
            spaces = await Space.find({ id: id });
        } else if (location) {
            spaces = await Space.find({ location: location }, { index: "gs1", follow: true });
        } else {
            spaces = await Space.scan({});
        }
        return { headers: addCorsHeader(), body: JSON.stringify(spaces), statusCode: 200 };
    } catch (e) {
        return { headers: addCorsHeader(), body: JSON.stringify(e), statusCode: 500 };
    }
};
