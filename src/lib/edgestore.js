import { EdgeStoreClient } from "@edgestore/server";

export const edgeStore = new EdgeStoreClient({
  accessKey: process.env.EDGE_STORE_ACCESS_KEY,
  secretKey: process.env.EDGE_STORE_SECRET_KEY,
});
