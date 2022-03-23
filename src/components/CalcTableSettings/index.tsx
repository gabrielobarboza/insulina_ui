import {
    Button,
    Grid,
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material';
import { useCalcTables } from '@/contexts/CalcTablesProvider';
import CalcTableList from '../CalcTableList'

const CalcTableSettings = () => {
    const { createCalcTable } = useCalcTables()

    const handleCreateNewTable = () => {
        createCalcTable({
            id: '',
            name: '',
            units: 0,
            values: {
                list: [0],
                custom: 0
            }
        })
    }
    
    return (
        <Grid container spacing={4}>                    
            <Grid item xs={12} mt={6}>
                <CalcTableList/>
            </Grid>
            <Grid item xs={12}>
                <Grid container spacing={0} justifyContent="center" alignItems="center">
                    <Button
                        type="button"
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<AddIcon />}
                        onClick={handleCreateNewTable}
                    >
                        Nova tabela
                    </Button>
                </Grid>
            </Grid>
        </Grid>
    )
}

export default CalcTableSettings;