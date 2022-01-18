import { useState, useCallback, useEffect, useMemo } from 'react'
import { useCalcTables } from '@/contexts/CalcTablesProvider'
import { Table } from "@/interfaces"
import { isEqual } from 'lodash'
import { formStyles } from '../formStyles';
import { Helper } from '@/components';

import {
    Button,
    Card,
    CardActionArea,
    CardContent,
    FormControl,
    FormHelperText,
    Grid,
    IconButton,
    InputLabel,
    NativeSelect,
    Paper,
    TextField,
    Typography
} from '@material-ui/core'

const CalcTableForm = () => {
    const classes = formStyles();
    const [name, setName] = useState<string>('')
    const [units, setUnits] = useState<number>(0)
    const [custom, setCustom] = useState<number>(0)
    const [values, setValues] = useState<number[]>([0])

    const [viewCustom, setViewCustom] = useState<boolean>(false)

    const {
        getCalcTable,
        saveCalcTable,
        selectCalcTable,
        selectedTable: table,
    } = useCalcTables()    

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

    const handleClose = () => {
        resetFields()
        selectCalcTable(null)
    }

    const handleSubmit = useCallback(ev => {
        ev.preventDefault()
        const { id } = table
        const calcTable:Table = {
            id,
            name,
            units,
            values: {
                list: values,
                ...(custom ? { custom } : null)
            }
        }

        saveCalcTable(calcTable)
        .then(handleClose)
        .catch(err => console.error(err))
           
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
        const storedTable = getCalcTable(table.id)
        const currentTable = {
            id: table.id,
            name,
            units,
            values: {
                list: values
            },
        }

        const unchanged = table && isEqual(storedTable,currentTable)

        return table ? unchanged : !isFilled;
    }, [name, units, values, table])
        
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

            <Card className={classes.card}>
                    <CardContent>
                        <Grid container alignContent='center' justifyContent='space-between'>
                            <Typography variant="h6">
                                Valores de Medição
                            </Typography>
                            <Helper>
                                <Typography variant="caption" component="p">
                                    <b>Ex.1</b> - Confirguração simples, utilizando apenas o campo <b>mg/dL Inicial</b>:
                                </Typography>
                                <Typography gutterBottom variant="caption" component="p">
                                    <b>-- Cenário</b>: <i><b>ui</b>(UI Inicial) = </i>2; <i><b>mgdli</b>(mg/dL Inicial) = </i>80; <i><b>mgdlc</b>(Glicemia - mg/dL informado) = </i>241;
                                </Typography>
                                <Typography gutterBottom variant="caption" component="p">
                                    <b>-- Resultado</b>: <i>(<b>ui</b> + ((<b>mgdlc</b> - <b>mgdli</b>)/(<b>mgdli</b>))) = </i><b>4</b>;
                                </Typography>
                                <Typography gutterBottom variant="caption" component="p">
                                    O resultado será <b>4 <i>UI</i></b>.
                                </Typography>
                                <hr />
                                <Typography variant="caption" component="p">
                                    <b>Ex.2</b> - Confirguração utilizando os campos <b>mg/dL Inicial</b> e <b>mg/dL Incremental</b>:
                                </Typography>
                                <Typography gutterBottom variant="caption" component="p">
                                    <b>-- Cenário</b>: <i><b>ui</b>(UI Inicial) = </i>2; <i><b>mgdli</b>(mg/dL Inicial) = </i>80; <i><b>mgdlInc</b>(mg/dL Incremental) = </i>60; <i><b>mgdlc</b>(Glicemia - mg/dL informado) = </i>268;
                                </Typography>
                                <Typography gutterBottom variant="caption" component="p">
                                    <b>-- Resultado</b>: <i>(<b>ui</b> + ((<b>mgdlc</b> - <b>mgdli</b>)/(<b>mgdlInc</b>))) = </i><b>5</b>;
                                </Typography>
                                <Typography gutterBottom variant="caption" component="p">
                                    O resultado será <b>5 <i>UI</i></b>.
                                </Typography>
                                <hr />
                                <Typography variant="caption" component="p">
                                    <b>Ex.3</b> - Confirguração utilizando os campos <b>mg/dL Inicial</b> e <b>mg/dL Adicionais</b>:
                                </Typography>
                                <Typography gutterBottom variant="caption" component="p">
                                    <b>-- Cenário</b>: <i><b>ui</b>(UI Inicial) = </i>3; <i><b>mgdli</b>(mg/dL Inicial) = </i>80; <i><b>mg/dL Adicionais</b></i> 120, 170 e 210; <i><b>mgdlc</b>(Glicemia - mg/dL informado) = </i>198;
                                </Typography>
                                <Typography gutterBottom variant="caption" component="p">
                                    <b>-- Resultado</b>: Cada campo <b>mg/dL Adicional</b> configurado é como um novo gatinho, e quando o <i><b>mgdlc</b></i> atinge ou ultrapassa esse gatilho, nosso <i><b>ui</b></i> é incrementado;
                                </Typography>
                                <Typography gutterBottom variant="caption" component="p">
                                    O resultado será <b>5 <i>UI</i></b>.
                                </Typography>
                            </Helper>
                        </Grid>
                        <hr />
                        <Typography variant="caption" component="p">
                            Valores em <b>mg/dL</b> para incrementar a <b>UI</b> resultante, baseando-se no valor do campo <b>UI Inicial</b>;
                            O campo <b>mg/dL Inicial</b> funciona como gatilho para administrar a <b>UI Inicial</b>; 
                            A <b>UI</b> resultante será o valor de <b>UI Inicial</b> incrementado em <b>+1</b><i>(mais um)</i> conforme o valor <b>Glicemia</b><i>(mg/dL)</i> informado no momento do cálculo for  excedente aos valores de configuração da tabela.
                        </Typography>
                        
                        {values.map((value, i) => {
                            // return <input key={`value_${i}`} placeholder="mg/dL" type="number" value={value||''} onChange={e => handleValue(i, e.target.value)}/>
                            let helperText = ''
                            if(i) {
                                helperText = 'Valor adicional para gerenciar unidades de insulina que devem ser administradas a partir do campo "UI Inicial"'
                            } else {
                                helperText = 'Valor que determina quando administrar unidades de insulina, baseando-se no campo "UI Inicial"'
                            }
                            return (
                                <TextField
                                    required={!i}
                                    key={`value_${i}`}
                                    label="mg/dL Inicial"
                                    type="number"
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    variant="outlined"
                                    value={value||''}
                                    onChange={e => handleValue(i, e.target.value)}
                                    helperText={helperText}
                                />
                            )

                        })}
                        <button type="button" onClick={addValue}>mg/dL Adicional</button>
                        <p>
                            <button type="button" onClick={switchViewCustom}>Valor Personalizado</button>
                            {viewCustom && <input placeholder="mg/dL" type="number" value={custom} onChange={e => setCustom(Number(e.target.value))}/>}
                        </p>
                    </CardContent>
            </Card>

            <p>
            <input placeholder="Unidades iniciais" type="number" value={units||''} onChange={e => setUnits(Number(e.target.value))}/>
            </p>
            <p>
            <button type="submit" disabled={disableSubmit}>Salvar!</button>
            </p>
        </form>
    )
}

export default CalcTableForm;