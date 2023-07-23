import  { gql }  from  "apollo-server-micro"; 

export const typeDefs  =  gql`
    type User {
        id: ID!
        email: String!
    }

    type Table {
        id: ID!
        name: String!
        initial_ui: Int!
        initial_mgdl: Int!
        limit_ui: Int
        increment_mgdl: Int
        triggers_mgdl: [Int]
    }

    type Query {
        getUsers: [User]
        getUser(id: ID!): User!
        getUserTables(id: ID!): [Table]
    }
`