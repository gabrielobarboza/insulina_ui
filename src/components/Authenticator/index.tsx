import { Alert, Grid } from '@mui/material'
import { useAuth, useLoading } from '@/contexts'
import { GoogleLogin } from '@react-oauth/google'
import { useEffect } from 'react'

export const Authenticator = () => {
  const { onLoginSuccess, onLoginError, sessionExpiredMessage } = useAuth()
  const { setLoading } = useLoading()
  
  useEffect(() => {
    setLoading(false)
  }, [])
  return (
    <Grid container spacing={2} direction="column" justifyContent="center" alignItems="center" height={'80vh'}>
      {sessionExpiredMessage && (
        <Grid item>
          <Alert severity="info">{sessionExpiredMessage}</Alert>
        </Grid>
      )}
      <Grid item>
        <GoogleLogin useOneTap onSuccess={onLoginSuccess} onError={onLoginError} />
      </Grid>
    </Grid>
  )
} 

export default Authenticator
