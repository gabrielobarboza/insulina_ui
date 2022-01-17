import { useState, useCallback, useEffect } from 'react'
import { validateUnits } from '@/utils'

import { Table } from "@/interfaces"
import { useCalcTables } from '@/contexts/CalcTables'

import { CalcTableList } from '@/components'

const IndexPage = () => {
  const [value, setValue] = useState<string>('')
  const [units, setUnits] = useState<number>(0)
  const [table, setTable] = useState<Table|null>(null)
  const [showConfig, setShowConfig] = useState<boolean>(false)
  const { dataTables } = useCalcTables()

  useEffect(() => {
    setUnits(0)
  }, [value, table])
  
  const handleSelect = ev => {
    const targetId = ev.target.value
    const targetTable = dataTables.find(({id}) => id === targetId)
    console.log("targetTable =>", targetTable)
    
    if(targetTable) setTable(targetTable)
  }

  const handleSubmit = useCallback(ev => {
    ev.preventDefault()
    const currValue = Number(value)

    console.log("handleSubmit =>", currValue, table)

    if(currValue)
      validateUnits(currValue, table).then(result => {
        setUnits(result)
      }).catch(err => console.warn(err))    
  }, [value, table])

  return (
    <>
      <button type="button" onClick={() => setShowConfig(!showConfig)}>Confingurações</button>
      {showConfig && <CalcTableList />}
      <form onSubmit={handleSubmit}>
        <p>
          <select onChange={handleSelect} value={table?.id}>
            <option value={""}>{"Selecione"}</option>
            {dataTables?.map(({ id, name }) => 
              <option key={id} value={id}>{name}</option>
            )}
          </select>
        </p>
        <p>
          <input placeholder="mg/dL" type="number" value={value} onChange={e => setValue(e.target.value)}/>
          <button type="submit" disabled={!value}>Verificar!</button>
        </p>
        <p>
          <input placeholder="Unidades" type="number" readOnly value={units || ''} />
        </p>
      </form>
    </>
  )
} 

export default IndexPage
