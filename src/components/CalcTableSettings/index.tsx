import { useEffect, useState, useCallback, useMemo } from 'react'
import { useCalcTables } from '@/contexts/CalcTables'
import { Table } from "@/interfaces"
import { isEqual } from 'lodash'

interface CalcTableSettingsProps {
    table?: Table,
    onClose:  () => any
}

const CalcTableSettings = ({ table, onClose }:CalcTableSettingsProps) => {
    const [name, setName] = useState<string>('')
    const [units, setUnits] = useState<number>(0)
    const [custom, setCustom] = useState<number>(0)
    const [values, setValues] = useState<number[]>([0])

    const [viewCustom, setViewCustom] = useState<boolean>(false)

    const { editCalcTable, dataTables } = useCalcTables()    

    useEffect(() => {
        if(table) {
            setName(table.name)
            setUnits(table.units)
            setValues(table.values.list)
            if(table.values.custom) {
                setCustom(table.values.custom)
                setViewCustom(true)
            }
        }
    }, [])

    const switchViewCustom = useCallback(() => {
        if(viewCustom) setCustom(0)
        setViewCustom(!viewCustom)
    }, [custom, viewCustom])

    const resetFields = () => {
        setName('')
        setUnits(0)
        setValues([0])
    }

    const handleSubmit = useCallback(ev => {
        ev.preventDefault()
        const calcTable:Table = {
            name,
            units,
            values: {
                list: values,
                ...(custom ? { custom } : null)
            }
        }
        if(table) calcTable.id = table.id
        console.log("handleSubmit =>", calcTable)

        editCalcTable(calcTable).then(()=> {
            resetFields()
            onClose()
        })
           
    }, [name, units, values])

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
        const isFilled = name && units && values[0]

        const unchanged = table && isEqual(
            dataTables.find(_ => table.id === _.id),
            {
                name,
                units,
                values: {
                    list: values
                },
                id: table.id,
            }
        )

        return table ? unchanged : !isFilled;
    }, [name, units, values, table])
    

    console.log("disable =>", disableSubmit)
    
    return (
        <form onSubmit={handleSubmit}>
        <p>
          <input placeholder="Nome da tabela de cálculo" type="string" value={name} onChange={e => setName(e.target.value)}/>
        </p>
        <p>
            {values.map((value, i) => {
                return <input key={`value_${i}`} placeholder="mg/dL" type="number" value={value||''} onChange={e => handleValue(i, e.target.value)}/>
            })}
            <button type="button" onClick={addValue}>Mais Valores</button>
        </p>
        <p>
            <button type="button" onClick={switchViewCustom}>Valor Personalizado</button>
            {viewCustom && <input placeholder="mg/dL" type="number" value={custom} onChange={e => setCustom(Number(e.target.value))}/>}
        </p>

        <p>
          <input placeholder="Unidades iniciais" type="number" value={units||''} onChange={e => setUnits(Number(e.target.value))}/>
        </p>
        <p>
          <button type="submit" disabled={disableSubmit}>Salvar!</button>
        </p>
        <hr/>
        </form>
    )
}

export default CalcTableSettings;