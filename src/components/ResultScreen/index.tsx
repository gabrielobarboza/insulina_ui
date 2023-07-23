import React from 'react'
import {
  KeyboardArrowRight as ArrowRightIcon,
  KeyboardArrowLeft as ArrowLeftIcon,
  ArrowBackIos as ArrowBackIcon
} from '@mui/icons-material';

import { useCalcResult } from '@/contexts'
import CalcTableList from '../CalcTableList';
import { Table } from '@/interfaces';
import {
  Button,
  Container,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { makeStyles, createStyles } from '@mui/styles';

interface ResultScreenProps {
  table: Table,
  mgdL: string
}

const useStyles = makeStyles((theme: any) => {
    return createStyles({
      title:{
        color: theme.palette.primary.main,
      },
      result: {
        color: theme.palette.primary.main,
        fontWeight: 900,
        borderBottom: `10px solid ${theme.palette.primary.main}`,
        padding: `${theme.spacing(2)} ${theme.spacing(4)}`
      },
      arrow: {
        fill: theme.palette.primary.main,
        width: theme.typography.pxToRem(60),
        height: theme.typography.pxToRem(60)
      }
    })
  }
);

const ResultScreen = ({ table, mgdL }:ResultScreenProps) => {
  const {
    resultValue,
    setResultValue,
    setViewResult
  } = useCalcResult()
  const classes = useStyles();

  const tableList = table ? [ table ] : null

  const handleGoBack = () => {
    setViewResult(false)
    setResultValue(null)
  }

  return (
    <Container>
      <Grid container justifyContent="center">
        <Grid item xs={12}>
          <Typography variant="h6" component="h1" mt={2} align={'center'} className={classes.title} >
            Resultado
          </Typography>
          <Typography variant="caption" component="p" align={'center'}>
            {`Unidades de insulina a serem administradas`}
          </Typography>
        </Grid>
      </Grid>
      <Grid
        container
        direction="row"
        justifyContent="center"
        alignItems="center"
      >
        <ArrowRightIcon className={classes.arrow}/>
        <Typography variant="h1" component="h2" className={classes.result} mt={2} >
          {resultValue}
        </Typography>
        <ArrowLeftIcon className={classes.arrow}/>
      </Grid>
      <Grid container justifyContent="center">
        <Grid item xs={10} mt={4}>
          <Typography variant="caption" component="p" mb={1}>
            Nível de glicose informado:
          </Typography>
          <TextField
            fullWidth
            type="number"
            placeholder="mg/dL"
            InputLabelProps={{
                shrink: true,
            }}
            variant="outlined"
            value={mgdL}
            disabled
          />
        </Grid>
        <Grid item xs={10} mt={4}>
          <Typography variant="caption" component="p" mb={1}>
            Tabela de Cálculo informada:
          </Typography>
          <CalcTableList list={tableList} editable={false}/>
        </Grid>
        <Grid item xs={10} mt={4}>
          <Button
            type="button"
            variant="contained"
            color="primary"
            size="large"
            onClick={handleGoBack}
            startIcon={<ArrowBackIcon />}
            fullWidth
          >
            Voltar
          </Button>
        </Grid>
      </Grid>
    </Container>
  )
}

export default ResultScreen
