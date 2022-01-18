import {
    Button,
    Grid,
} from '@material-ui/core'
import { Add as AddIcon } from '@material-ui/icons';
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
            <Grid item xs={12}>
                <CalcTableList />
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