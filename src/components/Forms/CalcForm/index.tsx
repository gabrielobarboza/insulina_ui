import { useState, useCallback, useEffect } from 'react'
import {
    Button,
    Grid,
    TextField,
} from '@mui/material'
import { Forward as ForwardIcon } from '@mui/icons-material';
import { useCalcTables, useCalcResult } from '@/contexts'
import { ResultScreen } from '@/components'
import { formStyles } from '../formStyles';

const CalcForm = () => {
    const classes = formStyles();
    const [mgdL, setMgdL] = useState<string>('')
    // const [unites, setUnites] = useState<number>(0)

    const { components: { TableSelect }, tableSelected } = useCalcTables()
    const {
        setResultValue,
        validateUnits,
        viewResult
    } = useCalcResult()

    useEffect(() => {
        setResultValue(null)
    }, [mgdL, tableSelected])
       
    const handleSubmit = useCallback(ev => {
        ev.preventDefault()
        const currMgdL = Number(mgdL)
    
        if(currMgdL)
          validateUnits(currMgdL, tableSelected).then(result => {
            setResultValue(result)
          }).catch(err => console.warn(err))    
    }, [mgdL, tableSelected])

    return viewResult ? (
        <ResultScreen table={tableSelected} mgdL={mgdL}/> 
    ) : (
        <form onSubmit={handleSubmit} className={classes.root} autoComplete="off">
            <Grid container spacing={2} justifyContent={'center'} className={classes.spaceTop}>
                <Grid item xs={8}>
                    <TableSelect
                        helperText="Selecione uma tabela de cálaculo para verificar quantas unidades de insulina devem ser administradas."
                    />
                </Grid>
                <Grid item xs={8}>
                    <TextField
                        label="Nível de glicose"
                        type="number"
                        placeholder="mg/dL"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        variant="outlined"
                        value={mgdL}
                        disabled={!tableSelected?.id}
                        onChange={e => setMgdL(e.target.value)}
                        helperText="Valor em mg/dL resultante da medição(Dextro)."
                    />
                </Grid>
                <Grid item xs={8}>
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