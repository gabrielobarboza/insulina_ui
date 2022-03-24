import { useCallback, useState } from 'react';
import { createStyles, makeStyles } from '@mui/styles';
import { useCalcTables } from '@/contexts/CalcTablesProvider';
import {
    Edit as EditIcon,
    ExpandMore as ExpandMoreIcon,
    DeleteForever as DeleteIcon
} from '@mui/icons-material';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Grid,
    Button,
    Typography,
    IconButton,
    Container,
    TextField
} from '@mui/material';
import { Table } from '@/interfaces';

import CustomDialog from '../CustomDialog'

const useStyles = makeStyles((theme: any) =>
  createStyles({
    heading: {
        fontSize: theme.typography.pxToRem(18)
    },    
    row: {
        flexDirection: 'column'
    },
    noWrap: {
        whiteSpace: 'nowrap'
    }
  }),
);

const renderUnitsRow = units => (
    <Grid item xs={12}>
        <Typography variant="caption" display='inline' color='textSecondary'>{`Insulina inicial (UI):`}</Typography>
        <Typography variant="subtitle2" display='inline'>{` ${units} `}</Typography>
    </Grid>
)

const renderLimitRow = limit => (
    limit ? (
        <Grid item xs={12}>
            <Typography variant="caption" display='inline' color='textSecondary'>{`Limit de unidades (UI):`}</Typography>
            <Typography variant="subtitle2" display='inline'>{` ${limit} `}</Typography>
        </Grid>
    ): <></>
)

const renderValuesRow = values => (
    <Grid item xs={12}>
        <Typography variant="caption" display='inline' color='textSecondary'>{`Valor glicemico (mg/dL):`}</Typography>
        <Typography variant="subtitle2" display='inline'>{` ${values.toString()} `}</Typography>
    </Grid>
)
const renderCustomRow = custom => (
    custom ? (
        <Grid item xs={12}>
            <hr />
            <Typography variant="caption" display='inline' color='textSecondary' >{`Aumentar unidades a cada (mg/dL):`}</Typography>
            <Typography variant="subtitle2" display='inline'>{` ${custom} `}</Typography>
        </Grid>
    ) : <></>
)
interface CalcTableListProps {
    editable?: boolean,
    list?: Table[]
}
const CalcTableList = ({ editable = true, list = null } : CalcTableListProps) => {
    const classes = useStyles();
    const { dataTables, selectTableConfig, deleteCalcTable } = useCalcTables()
    const [expandTable, setExpandTable] = useState<Table>(null)
    const [openDialog, setOpenDialog] = useState<boolean>(false)
    const [deleteTableName, setDeleteTableName] = useState<string>('')
    const tableList = list || dataTables

    const handleExcludeConfirm = useCallback(() => {
        if(expandTable?.name === deleteTableName) {
            deleteCalcTable(expandTable.id)
            setDeleteTableName('')
            setOpenDialog(false)
        }
    }, [expandTable, deleteTableName]);

    const handleDialog = useCallback(() => {
        setDeleteTableName('')
        setOpenDialog(!openDialog)
    }, [openDialog])
    
    const handleExpand = (_t: Table) => (_: React.ChangeEvent<{}>, isExpanded: boolean) => {
        setExpandTable(isExpanded ? _t : null);
    };

    const handleEdit =  (id:string) => selectTableConfig(id)

    return (
        <>
            {tableList?.map(table => {
                const { id, name, units, limit, values } = table;

                return (
                    <Accordion key={id} expanded={expandTable?.id === id} onChange={handleExpand(table)}>
                        {/* <button onClick={() => setTableId(id)}>Editar</button> */}
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls={`${id}-content`}
                            id={`${id}-header`}
                        >
                            <Typography variant="h6" className={classes.heading}>{name}</Typography>
                        </AccordionSummary>
                        <AccordionDetails className={classes.row}>
                            <Grid container spacing={0}>
                                {renderUnitsRow(units)}
                                {renderLimitRow(limit)}
                                {renderValuesRow(values.list)}
                                {renderCustomRow(values.custom)}
                            </Grid>
                            {editable && (
                                <Grid container spacing={0} mt={2} justifyContent='space-between'>
                                    <Button
                                        color={'primary'}
                                        type="button"
                                        variant="contained"
                                        size="small"
                                        startIcon={<EditIcon />}
                                        onClick={() => handleEdit(id)}
                                        >
                                        Editar tabela
                                    </Button>
                                    <IconButton
                                        size="small"
                                        aria-label="Excluir"
                                        onClick={handleDialog}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Grid>
                            )}
                        </AccordionDetails>
                    </Accordion>
                )}
            )}
            {editable && (
                <CustomDialog open={openDialog} onClose={handleDialog}>
                    <Container>
                        <Grid container spacing={0} justifyContent='center' mt={4}>
                            <Grid item xs={10} mt={2} >
                                <Typography variant="body2" align='center'>A tabela de cáculo <b className={classes.noWrap}>"{expandTable?.name}"</b> sera removida permanentemente.</Typography>
                            </Grid>
                            <Grid item xs={10} mt={2} mb={2}>
                                <Typography variant="subtitle2" align='center'> Para confirmar a ação, digite abaixo o nome exato da tabela; </Typography>
                            </Grid>
                            <TextField
                                label="Confirmar o nome da tabela"
                                type="text"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                variant="outlined"
                                value={deleteTableName}
                                onChange={e => setDeleteTableName(e.target.value)}
                            />
                        </Grid>
                        <Grid
                            container
                            justifyContent="center"
                            alignItems="center"
                            mt={2}
                            mb={4}
                        >
                            <Grid item justifyContent='center' xs={4}>
                                <Grid container justifyContent="center">
                                    <Button
                                        color={'primary'}
                                        type="button"
                                        variant="contained"
                                        size="small"
                                        onClick={handleExcludeConfirm}
                                        disabled={expandTable?.name !== deleteTableName}
                                    >
                                        Confirmar
                                    </Button>
                                </Grid>
                            </Grid>
                            <Grid item justifyContent='center' xs={4}>
                                <Grid container justifyContent="center">
                                    <Button
                                        type="button"
                                        variant="contained"
                                        size="small"
                                        onClick={handleDialog}
                                    >
                                        Cancelar
                                    </Button>                                
                                </Grid>
                            </Grid>
                        </Grid>
                    </Container>
                </CustomDialog>
            )}
        </>
    );
}

export default CalcTableList