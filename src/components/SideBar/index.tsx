import { useState, useEffect } from 'react'

import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import {
    AppBar,
    Toolbar,
    Drawer,
    Grid,
    IconButton,
    Typography,
} from '@material-ui/core'
import { Close as CloseIcon } from '@material-ui/icons';

import { useCalcTables } from '@/contexts/CalcTablesProvider'
import { useSidebar } from '@/contexts/SideBarProvider';

import CalcTableForm from '../CalcTableForm'
import CalcTableSettings from '../CalcTableSettings'
import { common } from '@material-ui/core/colors';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
        width: '75vw',
        margin: theme.spacing(2),
        marginTop: theme.spacing(10),
    },
  }),
);

const SideBar = () => {
  const classes = useStyles();
  const [ sidebarTitle, setSidebarTitle ] = useState<string>('')

  const { viewSidebar, setViewSidebar } = useSidebar();
  const { selectedTable, selectCalcTable } = useCalcTables()

    const handleCose = () => {
        setViewSidebar(false)
        selectCalcTable(null)
    }

    useEffect(() => {
        setSidebarTitle(selectedTable ? (selectedTable?.name || "Nova Tabela") : "Configurações")
    }, [selectedTable])

    return (
        <Drawer anchor={'right'} open={viewSidebar} onClose={handleCose}>
            <div className={classes.container}>
                <AppBar position="absolute">
                    <Toolbar>
                        <Grid container spacing={0} justifyContent="space-between" alignItems="center">
                            <Grid item xs={10}>
                                <Typography variant="h5">{sidebarTitle}</Typography>
                            </Grid>
                            <Grid item xs={2}>
                                <IconButton onClick={handleCose} aria-label="close">
                                    <CloseIcon  style={{ color: common['white'] }} />
                                </IconButton>
                            </Grid>
                        </Grid>
                    </Toolbar>
                </AppBar>
                
                {selectedTable ? <CalcTableForm /> : <CalcTableSettings/>}
            </div>
        </Drawer>
    )
}

export default SideBar;