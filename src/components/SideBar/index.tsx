import { useState, useEffect } from 'react'

import { createStyles, makeStyles } from '@mui/styles';
import {
    AppBar,
    Toolbar,
    Drawer,
    Grid,
    IconButton,
    Typography,
    Button,
} from '@mui/material'
import { Close as CloseIcon, ExitToApp as ExitIcon } from '@mui/icons-material';
import { common } from '@mui/material/colors';

import { useCalcTables, useLoading, useSettings, useSidebar } from '@/contexts';

import { CalcTableForm } from '../Forms'
import CalcTableSettings from '../CalcTableSettings'

import { useAuth } from '@/contexts'

const useStyles = makeStyles((theme: any) =>
  createStyles({
    container: {
        width: '75vw',
        height: '100vh',
        maxWidth: '550px',
        margin: theme.spacing(2),
        marginTop: theme.spacing(5),
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    },
    spaceY: {
        padding: `${theme.spacing(2)} 0`,
    }
  }),
);

const SideBar = () => {
    const { handleLogout, authorized } = useAuth()
    const { setLoading } = useLoading()
    const classes = useStyles();
    const [ sidebarTitle, setSidebarTitle ] = useState<string>('')

    const { viewSidebar, setViewSidebar } = useSidebar();
    const { selectedConfig, selectTableConfig } = useCalcTables()
    const { cleanStoredToken } = useSettings();

    const handleCose = () => {
        setViewSidebar(false)
        selectTableConfig(null)
    }

    const onLogout = () => {
        setLoading(true)
        cleanStoredToken()
        handleCose()
        handleLogout()
    }

    useEffect(() => {
        setSidebarTitle(selectedConfig ? (selectedConfig?.name || "Nova Tabela") : "Configurar Tabelas")
    }, [selectedConfig])

    return authorized ? (
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
                
                {selectedConfig ? (
                    <>
                        <CalcTableForm />
                    </>
                ) : (
                    <>
                        <CalcTableSettings/>
                        <Grid item xs={12} className={classes.spaceY}>
                            <Button                               
                                type="button"
                                variant="contained"
                                color="primary"
                                size="large"
                                startIcon={<ExitIcon />}
                                onClick={onLogout}
                                fullWidth
                            >
                                Sair
                            </Button>
                        </Grid>
                    </>
                )}

            </div>
        </Drawer>
    ) : <></>
}

export default SideBar;