import { v4 } from "uuid";

async function handler(event: any, context: any): Promise<any> {
  return {
    statusCode: 200,
    body: `Hi from Lambda built with TS and having some dependencies: ${v4()}`,
  };
}

export { handler };
