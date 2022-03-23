import {
  createContext,
  useState,
  useContext,
  useEffect
} from 'react'
import {
  isNumber,
  validateUnits
} from '@/utils'

import {
  ValidateUnitsInput
} from '@/utils/validateUnits'

type CalcResultContextType = {
    resultValue: number|null
    setResultValue: (value:number|null) => any
    setViewResult: (view:boolean) => any
    viewResult: boolean
    validateUnits: ValidateUnitsInput
}
  
export const CalcResultContext = createContext({} as CalcResultContextType);

export const useCalcResult = () => useContext(CalcResultContext)

const CalcResultProvider = ({ children }) => {
  const [ viewResult, setViewResult] = useState<boolean>(false)
  const [ resultValue, setResultValue ] = useState<number|null>(null)

  useEffect(() => {
    if(isNumber(resultValue)) {
      setViewResult(true);
    }
  }, [resultValue])

  return (
    <>
        <CalcResultContext.Provider
            value={{
              resultValue,
              setResultValue,
              setViewResult,
              viewResult,
              validateUnits
            }}
        >
        {children}
        </CalcResultContext.Provider>
    </>
  )
}

export default CalcResultProvider