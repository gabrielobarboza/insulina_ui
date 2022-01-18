import { useCallback, useState } from 'react';
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import { useCalcTables } from '@/contexts/CalcTablesProvider';
import {
    Edit as EditIcon,
    ExpandMore as ExpandMoreIcon,
    DeleteForever as DeleteIcon
} from '@material-ui/icons';
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
} from '@material-ui/core';
import { Table } from '@/interfaces';

import CustomDialog from '../CustomDialog'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
        marginTop: theme.spacing(6)
    },
    heading: {
        fontSize: theme.typography.pxToRem(18)
    },
    spaceTop: {
        marginTop: theme.spacing(2)
    },
    spaceY: {
        marginTop: theme.spacing(4),
        marginBottom: theme.spacing(4)
    },
    row: {
        flexDirection: 'column'
    },
    noWrap: {
        whiteSpace: 'nowrap'
    }
  }),
);

export default function CalctableList() {
    const classes = useStyles();
    const { dataTables, selectCalcTable, deleteCalcTable } = useCalcTables()
    const [expandTable, setExpandTable] = useState<Table>(null)
    const [openDialog, setOpenDialog] = useState<boolean>(false)
    const [deleteTableName, setDeleteTableName] = useState<string>('')

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

    const renderUnitsRow = units => (
        <Grid item xs={12}>
            <Typography variant="caption" display='inline' color='textSecondary'>{`Insulina inicial =`}</Typography>
            <Typography variant="subtitle2" display='inline'>{` ${units} `}</Typography>
            <Typography variant="caption" display='inline' color='textSecondary'>(UI)</Typography>
        </Grid>
    )

    const renderValuesRow = values => (
        <Grid item xs={12}>
            <Typography variant="caption" display='inline' color='textSecondary'>{`Valor glicemico =`}</Typography>
            <Typography variant="subtitle2" display='inline'>{` ${values.toString()} `}</Typography>
            <Typography variant="caption" display='inline' color='textSecondary' gutterBottom>(mg/dL)</Typography>
        </Grid>
    )
    const renderCustomRow = custom => (
        custom ? (
            <Grid item xs={12}>
                <hr />
                <Typography variant="caption" display='inline' color='textSecondary' >{`Aumentar unidades a cada`}</Typography>
                <Typography variant="subtitle2" display='inline'>{` ${custom} `}</Typography>
                <Typography variant="caption" display='inline' color='textSecondary'>(mg/dL)</Typography>
            </Grid>
        ) : <></>
    )

    const handleEdit =  (id:string) => selectCalcTable(id)

    return (
        <div className={classes.root}>
            {dataTables?.map(table => {
                const { id, name, units, values } = table;

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
                                {renderValuesRow(values.list)}
                                {renderCustomRow(values.custom)}
                            </Grid>
                            <Grid container spacing={0} className={classes.spaceTop} justifyContent='space-between'>
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
                        </AccordionDetails>
                    </Accordion>
                )}
            )}
            <CustomDialog open={openDialog} onClose={handleDialog}>
                <Container className={classes.spaceY}>
                    <Grid container spacing={0} justifyContent='center'>
                        <Grid item xs={10} className={classes.spaceTop}>
                            <Typography variant="body2" align='center'>A tabela de cáculo <b className={classes.noWrap}>"{expandTable?.name}"</b> sera removida permanentemente.</Typography>
                        </Grid>
                        <Grid item xs={10} className={classes.spaceTop}>
                            <Typography variant="subtitle2" align='center'> Para confirmar a ação, digite abaixo o nome exato da tabela; </Typography>
                        </Grid>
                        <TextField
                            className={classes.spaceTop}
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
                    <Grid container spacing={0} justifyContent='space-evenly' className={classes.spaceTop}>
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
                        <Button
                            type="button"
                            variant="contained"
                            size="small"
                            onClick={handleDialog}
                        >
                            Cancelar
                        </Button>
                    </Grid>
                </Container>

            </CustomDialog>
        </div>
    );
}