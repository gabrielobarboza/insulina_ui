import { useState, useCallback, useEffect } from 'react'

import {
    Button,
    FormControl,
    FormHelperText,
    InputLabel,
    NativeSelect,
    TextField
} from '@material-ui/core'

import { Forward as ForwardIcon } from '@material-ui/icons';

import { validateUnits } from '@/utils'

import { Table } from "@/interfaces"
import { useCalcTables } from '@/contexts/CalcTablesProvider'
import { formStyles } from '../formStyles';

const CalcForm = () => {
    const classes = formStyles();
    const [mgdL, setMgdL] = useState<string>('')
    const [units, setUnits] = useState<number>(0)
    const [table, setTable] = useState<Table|null>(null)
    const { dataTables } = useCalcTables()

    useEffect(() => {
        setUnits(0)
    }, [mgdL, table])
    

    const handleSelect = ev => {
        const targetId = ev.target.value
        const targetTable = dataTables.find(({id}) => id === targetId)
        
        if(targetTable) setTable(targetTable)
      }
    
      const handleSubmit = useCallback(ev => {
        ev.preventDefault()
        const currMgdL = Number(mgdL)
    
        if(currMgdL)
          validateUnits(currMgdL, table).then(result => {
            setUnits(result)
          }).catch(err => console.warn(err))    
    }, [mgdL, table])

    return (
        <form onSubmit={handleSubmit} className={classes.root} autoComplete="off">
            <FormControl>
                <InputLabel shrink htmlFor="cal-table-label-placeholder">
                    Tabela de Cálculo
                </InputLabel>
                <NativeSelect
                    required
                    value={table?.id}   
                    onChange={handleSelect}
                    inputProps={{
                        name: 'Tabela de Cálculo',
                        id: 'cal-table-label-placeholder',
                    }}
                >
                    <option value={""}>{"Selecione"}</option>
                    {dataTables?.map(({ id, name }) => 
                        <option key={id} value={id}>{name}</option>
                    )}
                </NativeSelect>
                <FormHelperText>Selecione uma tabela de cálaculo para verificar quantas unidades de insulina devem ser administradas.</FormHelperText>
            </FormControl>
            <TextField
                required
                label="Glicemia"
                type="number"
                placeholder="mg/dL"
                InputLabelProps={{
                    shrink: true,
                }}
                variant="outlined"
                value={mgdL}
                disabled={!table?.id}
                onChange={e => setMgdL(e.target.value)}
                helperText="Valor em mg/dL resultante da medição."
            />

            <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<ForwardIcon />}
            >
                Calcular
            </Button>
            <TextField
                required
                label="Unidades"
                type="number"
                InputLabelProps={{
                    shrink: true,
                }}
                disabled={!units}
                variant="outlined"
                value={units || ''}
                helperText={(table?.name && mgdL && units) ? `Unidades de insulina a serem administradas com base na tabela de cálculo "${table?.name}"` : ''}
            />
        </form>
    )
}

export default CalcForm