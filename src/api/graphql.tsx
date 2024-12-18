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

export type Document = {
  __typename?: 'Document';
  id: Scalars['ID']['output'];
  increment_mgdl?: Maybe<Scalars['Int']['output']>;
  initial_mgdl: Scalars['Int']['output'];
  initial_ui: Scalars['Int']['output'];
  limit_ui?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  triggers_mgdl?: Maybe<Array<Maybe<Scalars['Int']['output']>>>;
};

export type DocumentInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  increment_mgdl?: InputMaybe<Scalars['String']['input']>;
  initial_mgdl?: InputMaybe<Scalars['String']['input']>;
  initial_ui?: InputMaybe<Scalars['String']['input']>;
  limit_ui?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  triggers_mgdl?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Mutation = {
  __typename?: 'Mutation';
  deleteUserDocument?: Maybe<Scalars['Boolean']['output']>;
  saveUserDocument?: Maybe<Document>;
  setUser: User;
};


export type MutationDeleteUserDocumentArgs = {
  id: Scalars['ID']['input'];
  user: Scalars['ID']['input'];
};


export type MutationSaveUserDocumentArgs = {
  document: DocumentInput;
  user: Scalars['ID']['input'];
};


export type MutationSetUserArgs = {
  email: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};

export type Query = {
  __typename?: 'Query';
  getUser: User;
  getUserDocuments?: Maybe<UserDocuments>;
};


export type QueryGetUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetUserDocumentsArgs = {
  id: Scalars['ID']['input'];
};

export type User = {
  __typename?: 'User';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
};

export type UserDocuments = {
  __typename?: 'UserDocuments';
  documents?: Maybe<Array<Maybe<Document>>>;
  documentsCount?: Maybe<Scalars['Int']['output']>;
};

export type DeleteUserDocumentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  user: Scalars['ID']['input'];
}>;


export type DeleteUserDocumentMutation = { __typename?: 'Mutation', deleteUserDocument?: boolean | null };

export type SaveUserDocumentMutationVariables = Exact<{
  user: Scalars['ID']['input'];
  document: DocumentInput;
}>;


export type SaveUserDocumentMutation = { __typename?: 'Mutation', saveUserDocument?: { __typename?: 'Document', id: string, name: string, initial_ui: number, initial_mgdl: number, limit_ui?: number | null, increment_mgdl?: number | null, triggers_mgdl?: Array<number | null> | null } | null };

export type SetUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  email: Scalars['String']['input'];
}>;


export type SetUserMutation = { __typename?: 'Mutation', setUser: { __typename?: 'User', id: string, email: string } };

export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserQuery = { __typename?: 'Query', getUser: { __typename?: 'User', id: string, email: string } };

export type GetUserDocumentsQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserDocumentsQuery = { __typename?: 'Query', getUserDocuments?: { __typename?: 'UserDocuments', documentsCount?: number | null, documents?: Array<{ __typename?: 'Document', id: string, name: string, initial_ui: number, initial_mgdl: number, limit_ui?: number | null, increment_mgdl?: number | null, triggers_mgdl?: Array<number | null> | null } | null> | null } | null };


export const DeleteUserDocumentDocument = /*#__PURE__*/ gql`
    mutation deleteUserDocument($id: ID!, $user: ID!) {
  deleteUserDocument(id: $id, user: $user)
}
    `;
export type DeleteUserDocumentMutationFn = Apollo.MutationFunction<DeleteUserDocumentMutation, DeleteUserDocumentMutationVariables>;

/**
 * __useDeleteUserDocumentMutation__
 *
 * To run a mutation, you first call `useDeleteUserDocumentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteUserDocumentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteUserDocumentMutation, { data, loading, error }] = useDeleteUserDocumentMutation({
 *   variables: {
 *      id: // value for 'id'
 *      user: // value for 'user'
 *   },
 * });
 */
export function useDeleteUserDocumentMutation(baseOptions?: Apollo.MutationHookOptions<DeleteUserDocumentMutation, DeleteUserDocumentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteUserDocumentMutation, DeleteUserDocumentMutationVariables>(DeleteUserDocumentDocument, options);
      }
export type DeleteUserDocumentMutationHookResult = ReturnType<typeof useDeleteUserDocumentMutation>;
export type DeleteUserDocumentMutationResult = Apollo.MutationResult<DeleteUserDocumentMutation>;
export type DeleteUserDocumentMutationOptions = Apollo.BaseMutationOptions<DeleteUserDocumentMutation, DeleteUserDocumentMutationVariables>;
export const SaveUserDocumentDocument = /*#__PURE__*/ gql`
    mutation saveUserDocument($user: ID!, $document: DocumentInput!) {
  saveUserDocument(user: $user, document: $document) {
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
export type SaveUserDocumentMutationFn = Apollo.MutationFunction<SaveUserDocumentMutation, SaveUserDocumentMutationVariables>;

/**
 * __useSaveUserDocumentMutation__
 *
 * To run a mutation, you first call `useSaveUserDocumentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSaveUserDocumentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [saveUserDocumentMutation, { data, loading, error }] = useSaveUserDocumentMutation({
 *   variables: {
 *      user: // value for 'user'
 *      document: // value for 'document'
 *   },
 * });
 */
export function useSaveUserDocumentMutation(baseOptions?: Apollo.MutationHookOptions<SaveUserDocumentMutation, SaveUserDocumentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SaveUserDocumentMutation, SaveUserDocumentMutationVariables>(SaveUserDocumentDocument, options);
      }
export type SaveUserDocumentMutationHookResult = ReturnType<typeof useSaveUserDocumentMutation>;
export type SaveUserDocumentMutationResult = Apollo.MutationResult<SaveUserDocumentMutation>;
export type SaveUserDocumentMutationOptions = Apollo.BaseMutationOptions<SaveUserDocumentMutation, SaveUserDocumentMutationVariables>;
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
export const GetUserDocumentsDocument = /*#__PURE__*/ gql`
    query getUserDocuments($id: ID!) {
  getUserDocuments(id: $id) {
    documents {
      id
      name
      initial_ui
      initial_mgdl
      limit_ui
      increment_mgdl
      triggers_mgdl
    }
    documentsCount
  }
}
    `;

/**
 * __useGetUserDocumentsQuery__
 *
 * To run a query within a React component, call `useGetUserDocumentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserDocumentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserDocumentsQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetUserDocumentsQuery(baseOptions: Apollo.QueryHookOptions<GetUserDocumentsQuery, GetUserDocumentsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserDocumentsQuery, GetUserDocumentsQueryVariables>(GetUserDocumentsDocument, options);
      }
export function useGetUserDocumentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserDocumentsQuery, GetUserDocumentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserDocumentsQuery, GetUserDocumentsQueryVariables>(GetUserDocumentsDocument, options);
        }
export type GetUserDocumentsQueryHookResult = ReturnType<typeof useGetUserDocumentsQuery>;
export type GetUserDocumentsLazyQueryHookResult = ReturnType<typeof useGetUserDocumentsLazyQuery>;
export type GetUserDocumentsQueryResult = Apollo.QueryResult<GetUserDocumentsQuery, GetUserDocumentsQueryVariables>;