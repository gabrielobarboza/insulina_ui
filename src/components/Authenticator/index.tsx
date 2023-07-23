import { Grid } from '@mui/material'
import { useAuth } from '@/contexts'
import { GoogleLogin } from '@react-oauth/google'

export const Authenticator = () => {
  const {onLoginSuccess, onLoginError} = useAuth()
  return (
    <Grid container spacing={0} justifyContent="center" alignItems="center" height={'80vh'}>
      <GoogleLogin useOneTap onSuccess={onLoginSuccess} onError={onLoginError} />        
    </Grid>
  )
} 

export default Authenticator
