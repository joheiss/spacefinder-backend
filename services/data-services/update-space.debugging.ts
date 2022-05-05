import { handler } from "./update-space";

const id = "ba167cf8-954c-42f1-a9e9-219777ee1fd5";
const queryStringParameters = { id };
const name = "Zuhause";
const location = "Langenbeutingen";

const body = { name, location };

handler({ queryStringParameters, body } as any);
