import { createClient } from "tinacms/dist/client";
import { queries } from "./types";
export const client = createClient({ url: 'http://localhost:4001/graphql', token: 'd0a21eadf7d9b6e556c57fafcf176510bfa2657a', queries,  });
export default client;
  