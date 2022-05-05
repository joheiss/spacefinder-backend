import { handler } from "./list-spaces";

const id = "128ddc8e-bbb9-4e82-b2d6-a142b0962988";
const queryStringParameters = { id };

handler({ queryStringParameters: { location: "Langenbeutingen" } } as any);

// const result = handler({} as any).then((res: any) => JSON.parse(res.body));
