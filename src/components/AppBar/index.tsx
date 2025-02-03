import React from 'react';
import {
    AppBar,
    Toolbar,
    IconButton,
    Grid    
} from '@mui/material'

import { Settings as SettingsIcon } from '@mui/icons-material';
import InsulinaUiLogo from '@/assets/images/logo-insulina-ui.jpg'
import Image from 'next/image';
import { useAuth, useSidebar } from '@/contexts';
import { createStyles, makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: any) =>
  createStyles({
    avatar: {
        width: theme.typography.pxToRem(40),
        height: theme.typography.pxToRem(40),
        borderRadius: theme.typography.pxToRem(20),
        marginLeft: theme.spacing(1),
        overflow: 'hidden',
        position: 'relative',
        outline: '1px solid white',
        '&>img': {
            width: theme.typography.pxToRem(40),
            height: theme.typography.pxToRem(40),
            top: 0,
            left: 0,
            position: 'absolute'
        }
    }
  }),
);

export default function HeadAppBar() {
    const { viewSidebar, setViewSidebar } = useSidebar();
    const { authorized, userData } = useAuth()
    const classes = useStyles();

    return (
        <AppBar position="static">
            <Toolbar>
                <Grid container spacing={0} justifyContent="space-between" alignItems="center">
                    <Grid item xs={1}>
                        <Image src={InsulinaUiLogo} width={178} height={128} />
                    </Grid>
                    <Grid item xs={3} sx={{ display: 'flex', justifyContent: 'flex-end' }} onClick={() => authorized ? setViewSidebar(!viewSidebar) : null}>
                        {authorized ? <IconButton edge="start" color="inherit" aria-label="Settings">
                            <SettingsIcon />
                        </IconButton> : <></>}
                        {authorized && userData?.picture ? (
                            <div className={classes.avatar}>
                                <img src={userData?.picture} alt={userData?.name} referrerPolicy="no-referrer" />
                            </div>
                        ) : <></>}
                    </Grid>
                </Grid>
            </Toolbar>
         </AppBar>
  );
}