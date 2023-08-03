import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Query = {
  __typename?: 'Query';
  getUser: User;
  getUserTables?: Maybe<UserTables>;
};


export type QueryGetUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetUserTablesArgs = {
  id: Scalars['ID']['input'];
};

export type Table = {
  __typename?: 'Table';
  id: Scalars['ID']['output'];
  increment_mgdl?: Maybe<Scalars['Int']['output']>;
  initial_mgdl: Scalars['Int']['output'];
  initial_ui: Scalars['Int']['output'];
  limit_ui?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  triggers_mgdl?: Maybe<Array<Maybe<Scalars['Int']['output']>>>;
};

export type User = {
  __typename?: 'User';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
};

export type UserTables = {
  __typename?: 'UserTables';
  tables?: Maybe<Array<Maybe<Table>>>;
  tablesCount?: Maybe<Scalars['Int']['output']>;
};

export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserQuery = { __typename?: 'Query', getUser: { __typename?: 'User', id: string, email: string } };

export type GetUserTablesQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserTablesQuery = { __typename?: 'Query', getUserTables?: { __typename?: 'UserTables', tablesCount?: number | null, tables?: Array<{ __typename?: 'Table', id: string, name: string, initial_ui: number, initial_mgdl: number, limit_ui?: number | null, increment_mgdl?: number | null, triggers_mgdl?: Array<number | null> | null } | null> | null } | null };


export const GetUserDocument = /*#__PURE__*/ gql`
    query getUser($id: ID!) {
  getUser(id: $id) {
    id
    email
  }
}
    `;

/**
 * __useGetUserQuery__
 *
 * To run a query within a React component, call `useGetUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetUserQuery(baseOptions: Apollo.QueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
      }
export function useGetUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
        }
export type GetUserQueryHookResult = ReturnType<typeof useGetUserQuery>;
export type GetUserLazyQueryHookResult = ReturnType<typeof useGetUserLazyQuery>;
export type GetUserQueryResult = Apollo.QueryResult<GetUserQuery, GetUserQueryVariables>;
export const GetUserTablesDocument = /*#__PURE__*/ gql`
    query getUserTables($id: ID!) {
  getUserTables(id: $id) {
    tables {
      id
      name
      initial_ui
      initial_mgdl
      limit_ui
      increment_mgdl
      triggers_mgdl
    }
    tablesCount
  }
}
    `;

/**
 * __useGetUserTablesQuery__
 *
 * To run a query within a React component, call `useGetUserTablesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserTablesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserTablesQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetUserTablesQuery(baseOptions: Apollo.QueryHookOptions<GetUserTablesQuery, GetUserTablesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserTablesQuery, GetUserTablesQueryVariables>(GetUserTablesDocument, options);
      }
export function useGetUserTablesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserTablesQuery, GetUserTablesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserTablesQuery, GetUserTablesQueryVariables>(GetUserTablesDocument, options);
        }
export type GetUserTablesQueryHookResult = ReturnType<typeof useGetUserTablesQuery>;
export type GetUserTablesLazyQueryHookResult = ReturnType<typeof useGetUserTablesLazyQuery>;
export type GetUserTablesQueryResult = Apollo.QueryResult<GetUserTablesQuery, GetUserTablesQueryVariables>;