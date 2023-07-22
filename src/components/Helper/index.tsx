import React, { useCallback, useState } from 'react';
import { makeStyles, createStyles } from '@mui/styles';
import { Popper, IconButton, Fade, Paper, Grid, Typography } from '@mui/material';
import { Help as HelpIcon, Cancel as CancelIcon } from '@mui/icons-material';

const useStyles = makeStyles((theme: any) =>
  createStyles({
    root: {
        display: 'flex',
    },
    popper: {
        top: '50% !important',
        left: '50% !important',
        width: '80vw',
        zIndex: 1500,
        transform: 'translate(-50%, -50%) !important',
    },
    overlay: {
      position: 'fixed',
      top: '50% !important',
      left: '50% !important',
      width: '100vw',
      height: '100vh',
      zIndex: 1499,
      transform: 'translate(-50%, -50%) !important',
      backgroundColor: 'rgba(0,0,0,.5)'
    },
    paper: {
        padding: theme.spacing(1)
    }
  }),
);

interface HelperTypes {
    title: string
    icon?: React.ReactNode,
    children: React.ReactNode
}

export default function Helper({ title, icon, children }: HelperTypes) {
  const [open, setOpen] = useState(false);
  const classes = useStyles();

  const handleClick = useCallback(() => {
    setOpen(!open)
  }, [open]);

  interface HelperHeadTypes {
    inside?: boolean
  }

  const HelperHead = ({ inside }:HelperHeadTypes) => (
    <Grid container alignContent='center' justifyContent='space-between' >
      <Typography variant="h6">{title}</Typography>
      <IconButton style={{ padding: '0.25rem' }} color="primary" aria-label="Info" onClick={handleClick}>
        {inside ? <CancelIcon /> : (icon ? icon : <HelpIcon />)}
      </IconButton>
    </Grid>
  )

  return (
    <div className={classes.root}>
        <HelperHead/>
        <Popper open={open} placement={'bottom'} transition className={classes.popper}>
            {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={300}>
              
                <Paper elevation={3} className={classes.paper}>
                  <HelperHead inside/>
                  <hr/>
                  {children}
                </Paper>
              
            </Fade>
            )}
        </Popper>
        <div className={classes.overlay} style={{ display: open ? 'block' : 'none' }}/>   
    </div>
  );
}
