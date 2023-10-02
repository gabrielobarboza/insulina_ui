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

export type Mutation = {
  __typename?: 'Mutation';
  saveUserTable?: Maybe<Table>;
  setUser: User;
};


export type MutationSaveUserTableArgs = {
  table: TableInput;
  user: Scalars['ID']['input'];
};


export type MutationSetUserArgs = {
  email: Scalars['String']['input'];
  id: Scalars['ID']['input'];
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

export type TableInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  increment_mgdl?: InputMaybe<Scalars['Int']['input']>;
  initial_mgdl?: InputMaybe<Scalars['Int']['input']>;
  initial_ui?: InputMaybe<Scalars['Int']['input']>;
  limit_ui?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  triggers_mgdl?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
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

export type SaveUserTableMutationVariables = Exact<{
  user: Scalars['ID']['input'];
  table: TableInput;
}>;


export type SaveUserTableMutation = { __typename?: 'Mutation', saveUserTable?: { __typename?: 'Table', id: string, name: string, initial_ui: number, initial_mgdl: number, limit_ui?: number | null, increment_mgdl?: number | null, triggers_mgdl?: Array<number | null> | null } | null };

export type SetUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  email: Scalars['String']['input'];
}>;


export type SetUserMutation = { __typename?: 'Mutation', setUser: { __typename?: 'User', id: string, email: string } };

export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserQuery = { __typename?: 'Query', getUser: { __typename?: 'User', id: string, email: string } };

export type GetUserTablesQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserTablesQuery = { __typename?: 'Query', getUserTables?: { __typename?: 'UserTables', tablesCount?: number | null, tables?: Array<{ __typename?: 'Table', id: string, name: string, initial_ui: number, initial_mgdl: number, limit_ui?: number | null, increment_mgdl?: number | null, triggers_mgdl?: Array<number | null> | null } | null> | null } | null };


export const SaveUserTableDocument = /*#__PURE__*/ gql`
    mutation saveUserTable($user: ID!, $table: TableInput!) {
  saveUserTable(user: $user, table: $table) {
    id
    name
    initial_ui
    initial_mgdl
    limit_ui
    increment_mgdl
    triggers_mgdl
  }
}
    `;
export type SaveUserTableMutationFn = Apollo.MutationFunction<SaveUserTableMutation, SaveUserTableMutationVariables>;

/**
 * __useSaveUserTableMutation__
 *
 * To run a mutation, you first call `useSaveUserTableMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSaveUserTableMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [saveUserTableMutation, { data, loading, error }] = useSaveUserTableMutation({
 *   variables: {
 *      user: // value for 'user'
 *      table: // value for 'table'
 *   },
 * });
 */
export function useSaveUserTableMutation(baseOptions?: Apollo.MutationHookOptions<SaveUserTableMutation, SaveUserTableMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SaveUserTableMutation, SaveUserTableMutationVariables>(SaveUserTableDocument, options);
      }
export type SaveUserTableMutationHookResult = ReturnType<typeof useSaveUserTableMutation>;
export type SaveUserTableMutationResult = Apollo.MutationResult<SaveUserTableMutation>;
export type SaveUserTableMutationOptions = Apollo.BaseMutationOptions<SaveUserTableMutation, SaveUserTableMutationVariables>;
export const SetUserDocument = /*#__PURE__*/ gql`
    mutation setUser($id: ID!, $email: String!) {
  setUser(id: $id, email: $email) {
    id
    email
  }
}
    `;
export type SetUserMutationFn = Apollo.MutationFunction<SetUserMutation, SetUserMutationVariables>;

/**
 * __useSetUserMutation__
 *
 * To run a mutation, you first call `useSetUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setUserMutation, { data, loading, error }] = useSetUserMutation({
 *   variables: {
 *      id: // value for 'id'
 *      email: // value for 'email'
 *   },
 * });
 */
export function useSetUserMutation(baseOptions?: Apollo.MutationHookOptions<SetUserMutation, SetUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetUserMutation, SetUserMutationVariables>(SetUserDocument, options);
      }
export type SetUserMutationHookResult = ReturnType<typeof useSetUserMutation>;
export type SetUserMutationResult = Apollo.MutationResult<SetUserMutation>;
export type SetUserMutationOptions = Apollo.BaseMutationOptions<SetUserMutation, SetUserMutationVariables>;
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