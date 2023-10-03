import { Loading } from '@/components';
import {
  createContext,
  useState,
  useContext,
} from 'react'

type LoadingContextType = {
    setLoading: (view:boolean) => any
    loading: boolean
}
  
export const LoadingContext = createContext({} as LoadingContextType);

export const useLoading = () => useContext(LoadingContext)

const LoadingProvider = ({ children }) => {
  const [ loading, setLoading] = useState<boolean>(true)
  
  return (
    <>
        <LoadingContext.Provider
            value={{ loading, setLoading }}
        >
          <>
            <div style={{
              background: 'rgba(255, 255, 255, 0.75)',
              height: '100vh',
              left: 0,
              opacity: loading ? 1 : 0,
              pointerEvents: loading ? 'initial' : 'none',
              position: 'fixed',
              top: 0,
              transition: 'all 0.25s ease-in-out',
              width: '100vw',
              zIndex: 1300
            }}>
              <Loading style={{
                display: loading ? 'block' : 'none',
                left: '50%',
                position: 'absolute',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}/>
              </div>
            {children}
          </>
        </LoadingContext.Provider>
    </>
  )
}

export default LoadingProvider