import { initEdgeStore } from "@edgestore/server";
import { createEdgeStoreNextHandler } from "@edgestore/server/adapters/next/app";

// initialize EdgeStore
const es = initEdgeStore.create({
  accessKey: process.env.EDGE_STORE_ACCESS_KEY,
  secretKey: process.env.EDGE_STORE_SECRET_KEY,
});

// create a router to store public files
const edgeStoreRouter = es.router({
  publicFiles: es.fileBucket(),
});

// create Next.js handler
const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
});

// export for GET and POST
export { handler as GET, handler as POST };
