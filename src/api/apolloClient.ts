import { ApolloClient, InMemoryCache, ApolloLink, NormalizedCacheObject } from '@apollo/client'
import { createUploadLink } from 'apollo-upload-client'
import { useMemo } from 'react'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { config } from 'config'
import { expireSession, getAuthorizationHeaders, isUnauthenticatedError } from '@/utils/session'

export let apolloClient: ApolloClient<NormalizedCacheObject> | undefined

const uploadLink = createUploadLink({
  uri: config.ApiUrl
})

// Lê a sessão a cada requisição (nada guardado no módulo). Sem sessão válida, não envia Authorization; no SSR também não.
const authLink = setContext((_, { headers }) => ({
  headers: {
    ...headers,
    ...(typeof window === 'undefined' ? {} : getAuthorizationHeaders(window.localStorage, Date.now()))
  }
}))

// Resposta UNAUTHENTICATED do servidor expira a sessão local; o AuthProvider leva à tela de login.
const errorLink = onError((error) => {
  if (typeof window !== 'undefined' && isUnauthenticatedError(error)) {
    expireSession(window.localStorage)
  }
})

function createApolloClient() {
  return new ApolloClient({
    link: ApolloLink.from([errorLink, authLink, uploadLink]),
    cache: new InMemoryCache({
      addTypename: false,
      typePolicies: {
        Query: {
          fields: {
            // TODO: Definir politicas de cache
          }
        }
      }
    })
  })
}

// Ao sair ou expirar a sessão: descarta o cache para que dados de um usuário não apareçam para outro.
export const clearApolloStore = (): void => {
  apolloClient?.clearStore().catch(() => undefined)
}

export const initializeApollo = (initialState = null) => {
  const _apolloClient = apolloClient ?? createApolloClient()

  // If your page has Next.js data fetching methods that use Apollo Client,
  // the initial state gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract()

    // Restore the cache using the data passed from
    // getStaticProps/getServerSideProps combined with the existing cached data
    _apolloClient.cache.restore({ ...existingCache, ...initialState })
  }

  // For SSG and SSR always create a new Apollo Client
  if (typeof window === 'undefined') return _apolloClient

  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient
  return _apolloClient
}

export const useApollo = initialState => {
  const store = useMemo(() => initializeApollo(initialState), [initialState])
  return store
}

const client = {
  initializeApollo,
  useApollo
}

export default client
