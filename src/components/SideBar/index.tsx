import { useState, useEffect } from 'react'

import { createStyles, makeStyles } from '@mui/styles';
import {
    AppBar,
    Toolbar,
    Drawer,
    Grid,
    IconButton,
    Typography,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material';

import { useCalcTables } from '@/contexts/CalcTablesProvider'
import { useSidebar } from '@/contexts/SideBarProvider';

import { CalcTableForm } from '../Forms'
import CalcTableSettings from '../CalcTableSettings'
import { common } from '@mui/material/colors';

const useStyles = makeStyles((theme: any) =>
  createStyles({
    container: {
        width: '75vw',
        maxWidth: '550px',
        margin: theme.spacing(2),
        marginTop: theme.spacing(5),
    }
  }),
);

const SideBar = () => {
  const classes = useStyles();
  const [ sidebarTitle, setSidebarTitle ] = useState<string>('')

  const { viewSidebar, setViewSidebar } = useSidebar();
  const { selectedConfig, selectTableConfig } = useCalcTables()

    const handleCose = () => {
        setViewSidebar(false)
        selectTableConfig(null)
    }

    useEffect(() => {
        setSidebarTitle(selectedConfig ? (selectedConfig?.name || "Nova Tabela") : "Configurar Tabelas")
    }, [selectedConfig])

    return (
        <Drawer anchor={'right'} open={viewSidebar} onClose={handleCose}>
            <div className={classes.container}>
                <AppBar position="absolute">
                    <Toolbar>
                        <Grid container spacing={0} justifyContent="space-between" alignItems="center" sx={{ maxWidth: '550px' }}>
                            <Grid item xs={10}>
                                <Typography variant="h5">{sidebarTitle}</Typography>
                            </Grid>
                            <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <IconButton onClick={handleCose} aria-label="close">
                                    <CloseIcon  style={{ color: common['white'] }} />
                                </IconButton>
                            </Grid>
                        </Grid>
                    </Toolbar>
                </AppBar>
                
                {selectedConfig ? <CalcTableForm /> : <CalcTableSettings/>}
            </div>
        </Drawer>
    )
}

export default SideBar;