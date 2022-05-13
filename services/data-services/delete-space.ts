import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { addCorsHeader } from "../../utils/utility";
import { Space } from "./datamodel.schema";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    const id = event.pathParameters?.["id"];
    if (!id) return { headers: addCorsHeader(), body: "Error, invalid input!", statusCode: 400 };

    try {
        const space = await Space.remove({
            id: id,
        });
        return { body: JSON.stringify(space), statusCode: 200 };
    } catch (e) {
        return { body: JSON.stringify(e), statusCode: 500 };
    }
};
