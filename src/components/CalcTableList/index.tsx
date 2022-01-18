import { useState } from 'react';
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import { useCalcTables } from '@/contexts/CalcTablesProvider';
import {
    Edit as EditIcon,
    ExpandMore as ExpandMoreIcon
} from '@material-ui/icons';
import {
    AccordionSummary,
    AccordionDetails,
    Grid,
    Button,
    Typography
} from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
        marginTop: theme.spacing(6)
    },
    heading: {
        fontSize: theme.typography.pxToRem(18)
    },
    edit: {
        marginTop: theme.spacing(2)
    }
  }),
);

export default function CalctableList() {
    const classes = useStyles();
    const { dataTables, selectCalcTable} = useCalcTables()    
    const [expandId, setExpandId] = useState<string>('')

    const handleExpand = (id: string) => (event: React.ChangeEvent<{}>, isExpanded: boolean) => {
        setExpandId(isExpanded ? id : '');
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
            {dataTables?.map(({ id, name, units, values }) => 
                <Accordion key={id} expanded={expandId === id} onChange={handleExpand(id)}>
                    {/* <button onClick={() => setTableId(id)}>Editar</button> */}
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={`${id}-content`}
                        id={`${id}-header`}
                    >
                        <Typography variant="h6" className={classes.heading}>{name}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={0}>
                            {renderUnitsRow(units)}
                            {renderValuesRow(values.list)}
                            {renderCustomRow(values.custom)}
                            <Grid item>
                                <Button
                                    color ={'primary'}
                                    type="button"
                                    variant="contained"
                                    size="small"
                                    startIcon={<EditIcon />}
                                    className={classes.edit}
                                    onClick={() => handleEdit(id)}
                                    >
                                    Editar tabela
                                </Button>
                            </Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            )}
        </div>
    );
}