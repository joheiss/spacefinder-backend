import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { v4 } from "uuid";
import { Space } from "./datamodel.schema";
import { MissingValueError } from "./errors";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    if (!event.body) return { body: "Error, invalid input!", statusCode: 400 };

    const input = typeof event.body == "object" ? event.body : JSON.parse(event.body);

    try {
        // _validate(input);
        const space = await Space.create({
            // id: v4(),
            ...input,
        });
        return { body: JSON.stringify(space), statusCode: 200 };
    } catch (e) {
        if (e instanceof MissingValueError) return { body: JSON.stringify(e), statusCode: 403 };
        return { body: JSON.stringify(e), statusCode: 500 };
    }
};

const _validate = (input: any): void => {
    if (!input.name || !input.location) throw new MissingValueError("Mandatory values are missing");
};
