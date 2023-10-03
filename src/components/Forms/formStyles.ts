import { createStyles, makeStyles } from '@mui/styles';

export const formStyles = makeStyles((theme: any) =>
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
    },
    spaceBottom: {
      marginBottom: theme.spacing(2),
    },
    spaceY: {
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(2),
    }
  }),
);
