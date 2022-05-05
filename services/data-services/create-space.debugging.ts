import { handler } from "./create-space";

const date = Date.now().toString();
const location = "Im Stall";
const name = "Bei Jack";
const body = { name, date, location };

handler({ body } as any);
