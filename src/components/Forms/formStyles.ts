import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

export const formStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      marginTop: theme.spacing(4),
      '& .MuiTextField-root': {
          marginTop: theme.spacing(2),
          width: '100%',
          '& .MuiInputBase-input': {
              fontSize:'large'
          }
      },
    },
    spaceTop: {
      marginTop: theme.spacing(2),
    }
  }),
);
