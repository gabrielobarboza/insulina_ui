import { useState, useCallback, useMemo } from 'react'
import { useCalcTables } from '@/contexts/CalcTables'
import CalcTableSettings from '../CalcTableSettings'
import { Table } from "@/interfaces"

const CalcTableList = () => {
  const { dataTables, getCalcTable } = useCalcTables()
  const [showConfig, setShowConfig] = useState<boolean>(false)
  const [tableId, setTableId] = useState<string>('')

    const switchShowConfig = useCallback(() => {
        if(tableId) {
            setTableId('');
        } else {
            setShowConfig(!showConfig)
        }
    }, [showConfig, tableId])

    const showFields = useMemo(() => (showConfig || tableId), [showConfig, tableId])
    
    const closeFields = () => {
        setTableId('');
        setShowConfig(false)
    }

    const MemoCalcTableSettings = useCallback(() => (
        <CalcTableSettings table={tableId ? getCalcTable(tableId) : null} onClose={closeFields}/>
    ), [tableId])

    return (
        <>
            <ul>
                {dataTables?.map(({ id, name }) => 
                    <li key={id}>
                        <button onClick={() => setTableId(id)}>Editar</button>
                        <span>{name}</span>
                    </li>
                )}
            </ul>

            <button type="button" onClick={switchShowConfig}>{showFields ? "Dispensar" : "Nova tabela de cálculo"}</button>
            <hr/>
            {showFields && <MemoCalcTableSettings />}
        </>
    )
}

export default CalcTableList;