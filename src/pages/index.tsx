import { useState, useCallback } from 'react'
import { validateUnits } from '@/utils'

import { Table } from "@/interfaces";
import { useCalcTables } from '@/contexts/CalcTables';

const IndexPage = () => {
  const [value, setValue] = useState<string>('')
  const [units, setUnits] = useState<number>(0)
  const [table, setTable] = useState<Table|null>(null)
  const { dataTables } = useCalcTables()
  
  const handleSubmit = useCallback(ev => {
    ev.preventDefault()
    const currValue = Number(value)
    if(currValue)
      validateUnits(currValue, table).then(result => {
        setUnits(result)
      }).catch(err => console.warn(err))    
  }, [value, table])

  const handleSelect = ev => {
    const targetId = ev.target.value
    const targetTable = dataTables.find(({id}) => id === targetId)

    if(targetTable) setTable(targetTable)
  }

  return (
    <>
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
          <input placeholder="Glicemia" type="number" value={value} onChange={e => setValue(e.target.value)}/>
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
