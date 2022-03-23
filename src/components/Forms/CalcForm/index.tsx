import { useState, useCallback, useEffect } from 'react'
import {
    Button,
    Grid,
    TextField,
} from '@mui/material'
import { Forward as ForwardIcon } from '@mui/icons-material';
import { useCalcTables } from '@/contexts/CalcTablesProvider'
import { useCalcResult } from '@/contexts/CalcResultProvider'
import {ResultScreen} from '@/components'
import { formStyles } from '../formStyles';

const CalcForm = () => {
    const classes = formStyles();
    const [mgdL, setMgdL] = useState<string>('')
    // const [unites, setUnites] = useState<number>(0)

    const { components: { TableSelect }, selectedTable } = useCalcTables()
    const {
        setResultValue,
        validateUnits,
        viewResult
    } = useCalcResult()

    useEffect(() => {
        setResultValue(null)
    }, [mgdL, selectedTable])
       
    const handleSubmit = useCallback(ev => {
        ev.preventDefault()
        const currMgdL = Number(mgdL)
    
        if(currMgdL)
          validateUnits(currMgdL, selectedTable).then(result => {
            setResultValue(result)
          }).catch(err => console.warn(err))    
    }, [mgdL, selectedTable])

    return viewResult ? (
        <ResultScreen table={selectedTable} mgdL={mgdL}/> 
    ) : (
        <form onSubmit={handleSubmit} className={classes.root} autoComplete="off">
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <TableSelect
                        helperText="Selecione uma tabela de cálaculo para verificar quantas unidades de insulina devem ser administradas."
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        label="Nível de glicose"
                        type="number"
                        placeholder="mg/dL"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        variant="outlined"
                        value={mgdL}
                        disabled={!selectedTable?.id}
                        onChange={e => setMgdL(e.target.value)}
                        helperText="Valor em mg/dL resultante da medição(Dextro)."
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<ForwardIcon />}
                        fullWidth
                    >
                        Calcular
                    </Button>
                </Grid>               
            </Grid>
        </form>                      
    )
}

export default CalcForm