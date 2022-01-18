import React, { useCallback, useState } from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Popper, IconButton, Fade, Paper, Grid, Typography } from '@material-ui/core';
import { Help as HelpIcon, Cancel as CancelIcon } from '@material-ui/icons';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
        display: 'flex',
    },
    popper: {
        top: '50% !important',
        left: '50% !important',
        width: '80vw',
        zIndex: 1500,
        transform: 'translate(-50%, -50%) !important'
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
    </div>
  );
}
