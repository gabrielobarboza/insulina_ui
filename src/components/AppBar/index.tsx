import React from 'react';
import {
    AppBar,
    Toolbar,
    IconButton,
    Grid    
} from '@mui/material'

import { Settings as SettingsIcon } from '@material-ui/icons';
import InsulinaUiLogo from '@/assets/images/logo-insulina-ui.jpg'
import Image from 'next/image';

import { useSidebar } from '@/contexts/SideBarProvider';

export default function HeadAppBar() {
    const { viewSidebar, setViewSidebar } = useSidebar();

    return (
        <AppBar position="static">
            <Toolbar>
                <Grid container spacing={0} justifyContent="space-between" alignItems="center">
                    <Grid item xs={1}>
                        <Image src={InsulinaUiLogo} width={178} height={128} />
                    </Grid>
                    <Grid item xs={1}>
                        <IconButton edge="start" color="inherit" aria-label="Settings" onClick={() => setViewSidebar(!viewSidebar)}>
                            <SettingsIcon />
                        </IconButton>
                    </Grid>
                </Grid>
            </Toolbar>
         </AppBar>
  );
}