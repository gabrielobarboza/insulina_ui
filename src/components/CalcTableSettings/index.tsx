import { useEffect, useState, useCallback, useMemo } from 'react'
import { useCalcTables } from '@/contexts/CalcTables'
import { Table } from "@/interfaces"

interface CalcTableSettingsProps {
    table?: Table
}


const CalcTableSettings = ({ table }) => {
    const [name, setName] = useState<string>('')
    const [initial, setInitial] = useState<number>(0)
    const [values, setValues] = useState<number[]>([0])

    const { editCalcTable, dataTables } = useCalcTables()
    

    useEffect(() => {
        if(table) {
            setName(table.name)
            setInitial(table.initial)
            setValues(table.values)
        }
    }, [])

    const handleSubmit = useCallback(ev => {
        ev.preventDefault()
        const calcTable:Table = {
            name,
            initial,
            values
        }
        if(table) calcTable.id = table.id
        console.log("handleSubmit =>", calcTable)

        editCalcTable(calcTable)
           
    }, [name, initial, values])

    const handleValue = (index, val) => {
        const tableValues = [...values]
        tableValues[index] = Number(val);

        setValues(tableValues)
    }

    const addValue = () => {
        setValues(current => [
            ...current,
            0
        ])
    }   

    const disableSubmit = useMemo(() => {
        return !name && !initial && !values[0]
    }, [name, initial, values])
    

    console.log("disable =>", disableSubmit)
    
    return (
        <form onSubmit={handleSubmit}>
        <p>
          <input placeholder="Nome da tabela de cálculo" type="string" value={name} onChange={e => setName(e.target.value)}/>
        </p>
        <p>
            {values.map((value, i) => {
                return <input key={`value_${i}`} placeholder="Valor de glicemia" type="number" value={value||''} onChange={e => handleValue(i, e.target.value)}/>
            })}
            <button type="button" onClick={addValue}>Mais Valores!</button>
        </p>
        <p>
          <input placeholder="Unidades iniciais" type="number" value={initial||''} onChange={e => setInitial(Number(e.target.value))}/>
        </p>
        <p>
          <button type="submit" disabled={disableSubmit}>Adicionar!</button>
        </p>
        </form>
    )
}

export default CalcTableSettings;