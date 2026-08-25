import { createClient } from "tinacms/dist/client";
import { queries } from "./types";
export const client = createClient({ url: 'http://localhost:4001/graphql', token: '002b0ead3d9a6042b0422e8ddd76afc87556f499', queries,  });
export default client;
  