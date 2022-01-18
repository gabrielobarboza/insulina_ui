import React from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import Popper, { PopperPlacementType } from '@material-ui/core/Popper';
import { IconButton, Fade, Paper } from '@material-ui/core';
import { Help as HelpIcon } from '@material-ui/icons';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
        display: 'flex',
    },
    popper: {
        maxWidth: '80vw',
        zIndex: 1500,
    },
    paper: {
        padding: theme.spacing(1)
    }
  }),
);

interface HelperTypes {
    icon?: React.ReactNode,
    children: React.ReactNode
}

export default function Helper({ icon, children }: HelperTypes) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const [placement, setPlacement] = React.useState<PopperPlacementType>();
  const classes = useStyles();

  const handleClick = (newPlacement: PopperPlacementType) => (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    setAnchorEl(event.currentTarget);
    setOpen((prev) => placement !== newPlacement || !prev);
    setPlacement(newPlacement);
  };

  return (
    <div className={classes.root}>
        <Popper open={open} anchorEl={anchorEl} placement={placement} transition className={classes.popper}>
            {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={300}>
                <Paper elevation={3} className={classes.paper}>{children}</Paper>
            </Fade>
            )}
        </Popper>
        <IconButton style={{ padding: '0.25rem' }} color="inherit" aria-label="Info" onClick={handleClick('bottom')}>
            {icon ? icon : <HelpIcon />}
        </IconButton>
    </div>
  );
}
