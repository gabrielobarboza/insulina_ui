import { useState, useCallback, useEffect, useMemo } from 'react'
import { useCalcTables } from '@/contexts/CalcTablesProvider'
import { Table } from "@/interfaces"
import { isEqual } from 'lodash'
import { formStyles } from '../formStyles';
import { Helper } from '@/components';

import {
    Button,
    Card,
    CardContent,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    Grid,
    Switch,
    TextField,
    Typography
} from '@mui/material'
import {
    Add as AddIcon,
    CheckCircle as CheckIcon,
    HighlightOff as OffIcon
} from '@mui/icons-material';

const CalcTableForm = () => {
    const classes = formStyles();
    const {
        saveCalcTable,
        selectTableConfig,
        selectedConfig: table,
    } = useCalcTables()    

    const [name, setName] = useState<string>('')
    const [units, setUnits] = useState<number>(0)
    const [mgdlInitial, setMgdlInitial] = useState<number>(0)
    const [mgdlIncrementValue, setIncrementValue] = useState<number>(0)
    const [mgdlAditionalValues, setAditionalValues] = useState<number[]>([0])
    const [useMgdlAditional, setMgdlAditional] = useState<boolean>(false)
    const [useMgdlIncrement, setMgdlIncrement] = useState<boolean>(false)
    const [useUnitLimit, setUnitLimit] = useState<boolean>(false)
    const [unitLimitValue, setUnitLimitValue] = useState<number>(0)

    useEffect(() => {
        if(table) {
            const valuesList = [...table.values.list]

            setName(table.name)
            setUnits(table.units)
            setMgdlInitial(valuesList.shift())
            setAditionalValues(valuesList)
            if(valuesList.length) setMgdlAditional(true);

            if(table.values.custom) {
                setIncrementValue(table.values.custom)
                setMgdlIncrement(true)
            }

            if(table.limit) {
                setUnitLimit(true)
                setUnitLimitValue(table.limit)
            }
        }
    }, [])

    const currentTable = useMemo(() => {
        const { id } = table
        const calcTable:Table = {
            id,
            name,
            units,
            values: {
                list: [mgdlInitial]
            }            
        }

        if(useUnitLimit && unitLimitValue) 
            calcTable.limit = unitLimitValue

        if(useMgdlAditional)
            calcTable.values.list = [
                mgdlInitial,
                ...(mgdlAditionalValues.filter(v => v > mgdlInitial))
            ]

        if(useMgdlIncrement && mgdlIncrementValue)
            calcTable.values.custom =  mgdlIncrementValue

        return calcTable
    },[
        name,
        units,
        mgdlInitial,
        mgdlAditionalValues,
        mgdlIncrementValue,
        useMgdlAditional,
        useMgdlIncrement,
        useUnitLimit,
        unitLimitValue
    ])

    const switchUseMgdlIncrement = useCallback(() => {
        if(useMgdlIncrement) {
            setIncrementValue(0)
        }
        setMgdlIncrement(!useMgdlIncrement)
    }, [useMgdlIncrement])

    const resetFields = () => {
        setName('')
        setUnits(0)
        setAditionalValues([])
    }

    const handleCancel = () => {
        resetFields()
        selectTableConfig(null)
    }

    const handleSubmit = useCallback(ev => {
        ev.preventDefault()        

        saveCalcTable(currentTable)
        .then(handleCancel)
        .catch(err => console.error(err))
           
    }, [currentTable])

    const handleAditionalValue = (index, val) => {
        const tableValues = [...mgdlAditionalValues]
        tableValues[index] = Number(val);

        setAditionalValues(tableValues)
    }

    const addMgdlAditionalValue = () => {
        setAditionalValues(prev => [
            ...prev,
            0
        ])
    }

    const switchUseMgdlAditionals = useCallback(() => {
        const mgdlAditional = !useMgdlAditional
        if(mgdlAditional){
            if(!mgdlAditionalValues.length)
                addMgdlAditionalValue()
        } else {
            setAditionalValues([])
        }
        setMgdlAditional(mgdlAditional)
    }, [useMgdlAditional])

    const disableSubmit = useMemo(() => {
        const { id } = table
        const isFilled = name && units && mgdlInitial
        const unchanged = id && isEqual(table, currentTable)

        return !isFilled || unchanged;
    }, [name, units, mgdlInitial, table, currentTable])

    const switchUseUnitLimit = useCallback(() => {
        setUnitLimit(!useUnitLimit)
    }, [useUnitLimit])
        
    return (
        <form onSubmit={handleSubmit} className={classes.root} autoComplete="off">
            <TextField
                required
                label="Nome da Tabela"
                type="text"
                InputLabelProps={{
                    shrink: true,
                }}
                variant="outlined"
                value={name}
                onChange={e => setName(e.target.value)}
                helperText="Como a tabela de cálculo sera identificada"
            />
            <TextField
                required
                label="UI Inicial"
                type="number"
                InputLabelProps={{
                    shrink: true,
                }}
                variant="outlined"
                value={units||''}
                onChange={e => setUnits(Number(e.target.value))}
                helperText={'Unidades de insulina que devem ser administradas conforme à area "Valores de Medição"'}
            />
            <FormControl component="fieldset" variant="standard">
                <FormGroup>
                    <FormControlLabel
                        control={
                            <Switch
                                color="primary"
                                checked={useUnitLimit}
                                onChange={switchUseUnitLimit}
                                name="Limite de UI"
                            />
                        }
                        label="Usar Limite de UI"
                    />
                </FormGroup>
                <FormHelperText>Adicione um limite para unidades de insulina que devem ser administradas</FormHelperText>
            </FormControl>
            {useUnitLimit && (
                <TextField
                    label="Limite de UI"
                    type="number"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    variant="outlined"
                    value={unitLimitValue||''}
                    onChange={e => setUnitLimitValue(Number(e.target.value))}
                />
            )}
            <Card className={classes.spaceTop}>
                <CardContent>
                    <Helper title="Valores de Medição">
                        <Typography variant="caption" component="p">
                            <b>Ex.1</b> - Confirguração simples, utilizando apenas o campo <b>mg/dL Inicial</b>:
                        </Typography>
                        <Typography gutterBottom variant="caption" component="p">
                            <b>- Cenário</b>: <i><b>ui</b>(UI Inicial) = </i>2; <i><b>mgdli</b>(mg/dL Inicial) = </i>80; <i><b>mgdlc</b>(Glicemia - mg/dL informado) = </i>241;
                        </Typography>
                        <Typography gutterBottom variant="caption" component="p">
                            <b>- Cálculo</b>: <i>(<b>ui</b> + ((<b>mgdlc</b> - <b>mgdli</b>)/(<b>mgdli</b>)))</i>;
                        </Typography>
                        <Typography gutterBottom variant="caption" component="p">
                            <b>- Resultado</b>: <i>(<b>2</b> + ((<b>241</b> - <b>80</b>)/(<b>80</b>))) = </i><b>4</b>;
                        </Typography>
                        <Typography gutterBottom variant="caption" component="p">
                            O resultado será <b>4 <i>UI</i></b>.
                        </Typography>
                        <hr />
                        <Typography variant="caption" component="p">
                            <b>Ex.2</b> - Confirguração utilizando os campos <b>mg/dL Inicial</b> e <b>mg/dL Incremental</b>:
                        </Typography>
                        <Typography gutterBottom variant="caption" component="p">
                            <b>- Cenário</b>: <i><b>ui</b>(UI Inicial) = </i>2; <i><b>mgdli</b>(mg/dL Inicial) = </i>80; <i><b>mgdlInc</b>(mg/dL Incremental) = </i>60; <i><b>mgdlc</b>(Glicemia - mg/dL informado) = </i>268;
                        </Typography>
                        <Typography gutterBottom variant="caption" component="p">
                            <b>- Cálculo</b>: <i>(<b>ui</b> + ((<b>mgdlc</b> - <b>mgdli</b>)/(<b>mgdlInc</b>)))</i>;
                        </Typography>
                        <Typography gutterBottom variant="caption" component="p">
                            <b>- Resultado</b>: <i>(<b>2</b> + ((<b>268</b> - <b>80</b>)/(<b>60</b>))) = </i><b>5</b>;
                        </Typography>
                        <Typography gutterBottom variant="caption" component="p">
                            O resultado será <b>5 <i>UI</i></b>.
                        </Typography>
                        <hr />
                        <Typography variant="caption" component="p">
                            <b>Ex.3</b> - Confirguração utilizando os campos <b>mg/dL Inicial</b> e <b>mg/dL Adicionais</b>:
                        </Typography>
                        <Typography gutterBottom variant="caption" component="p">
                            <b>- Cenário</b>: <i><b>ui</b>(UI Inicial) = </i>3; <i><b>mgdli</b>(mg/dL Inicial) = </i>80; <i><b>mg/dL Adicionais</b></i> 120, 170 e 210; <i><b>mgdlc</b>(Glicemia - mg/dL informado) = </i>198;
                        </Typography>
                        <Typography gutterBottom variant="caption" component="p">
                            <b>- Resultado</b>: Cada campo <b>mg/dL Adicional</b> configurado é como um novo gatinho, e quando o <i><b>mgdlc</b></i> atinge ou ultrapassa esse gatilho, nosso <i><b>ui</b></i> é incrementado;
                        </Typography>
                        <Typography gutterBottom variant="caption" component="p">
                            O resultado será <b>5 <i>UI</i></b>.
                        </Typography>
                    </Helper>
                    <hr />
                    <Typography variant="caption" component="p">
                        Valores em <b>mg/dL</b> para incrementar a <b>UI</b> resultante, baseando-se no valor do campo <b>UI Inicial</b>;
                        O campo <b>mg/dL Inicial</b> funciona como gatilho para administrar a <b>UI Inicial</b>; 
                        A <b>UI</b> resultante será o valor de <b>UI Inicial</b> incrementado em <b>+1</b><i>(mais um)</i> conforme o valor <b>Glicemia</b><i>(mg/dL)</i> informado no momento do cálculo for  excedente aos valores de configuração da tabela.
                    </Typography>
                    
                    <TextField
                        required
                        label="Nível de glicose base"
                        placeholder="mg/dL"
                        type="number"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        variant="outlined"
                        value={mgdlInitial||''}
                        onChange={e => setMgdlInitial(Number(e.target.value))}
                        helperText='Valor que determina quando administrar unidades de insulina, baseando-se no campo "UI Inicial"'
                    />                   
                    <FormControl component="fieldset" variant="standard">
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Switch
                                        color="primary"
                                        checked={useMgdlAditional}
                                        onChange={switchUseMgdlAditionals}
                                        name="mg/dL Adicionais"
                                        disabled={useMgdlIncrement}
                                    />
                                }
                                label="Usar mg/dL Adicionais"
                            />
                        </FormGroup>
                        <FormHelperText>Adicionar mais limitadores para incremetar a UI resultante</FormHelperText>
                    </FormControl>
                    <FormControl component="fieldset" variant="standard" className={classes.spaceTop}>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Switch
                                        color="primary"
                                        checked={useMgdlIncrement}
                                        name="mg/dL Incremental"
                                        onChange={switchUseMgdlIncrement}
                                        disabled={useMgdlAditional}
                                    />
                                }
                                label="Usar mg/dL Incremental"
                            />
                        </FormGroup>
                        <FormHelperText>Adicionar valor incremental diferente do inicial</FormHelperText>
                    </FormControl>
                    {useMgdlAditional && (
                        <>
                            {mgdlAditionalValues.map((value, i) => (
                                    <TextField
                                        key={`value_${i}`}
                                        label="Valor Adicional"
                                        placeholder="mg/dL"
                                        type="number"
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        variant="outlined"
                                        value={value||''}
                                        onChange={e => handleAditionalValue(i, e.target.value)}
                                    />
                                )
                            )}
                            <Button
                                type="button"
                                variant="contained"
                                color="primary"
                                size="small"
                                startIcon={<AddIcon />}
                                className={classes.spaceTop}
                                onClick={addMgdlAditionalValue}
                            >
                                Mais um campo
                            </Button>
                        </>
                    )}
                    {useMgdlIncrement && (
                        <TextField
                            label="Valor Incremental"
                            placeholder="mg/dL"
                            type="number"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            variant="outlined"
                            value={mgdlIncrementValue||''}
                            onChange={e => setIncrementValue(Number(e.target.value))}
                        />
                    )}
                </CardContent>
            </Card>
            <Grid container spacing={2} className={classes.spaceTop} justifyContent='space-around'>
                <Grid item xs={6}>
                    <Button
                        type="button"
                        variant="contained"
                        startIcon={<OffIcon />}
                        onClick={handleCancel}
                    >
                        Cancelar
                    </Button>
                </Grid>
                <Grid item xs={6}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={disableSubmit}
                        startIcon={<CheckIcon />}
                    >
                        Concluir
                    </Button>
                </Grid>
            </Grid>
        </form>
    )
}

export default CalcTableForm;