import Cors from "micro-cors";
import { ApolloServer } from "apollo-server-micro";
import { PageConfig } from "next";
import { typeDefs } from "./schemas";
import { resolvers } from "./resolvers";
import { ApolloServerPluginLandingPageDisabled } from "apollo-server-core";

const isProduction =  process.env.NODE_ENV === 'production'

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: !isProduction,
  plugins: isProduction
    ? [ ApolloServerPluginLandingPageDisabled() ]
    : []
});

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
};

const cors = Cors();

const startServer = apolloServer.start();

export default cors(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.end();
    return false;
  }

  await startServer;
  await apolloServer.createHandler({ path: "/api/graphql" })(req, res);
});