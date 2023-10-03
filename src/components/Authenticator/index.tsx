import { Grid } from '@mui/material'
import { useAuth, useLoading } from '@/contexts'
import { GoogleLogin } from '@react-oauth/google'
import { useEffect } from 'react'

export const Authenticator = () => {
  const {onLoginSuccess, onLoginError} = useAuth()
  const { setLoading } = useLoading()
  
  useEffect(() => {
    setLoading(false)
  }, [])
  return (
    <Grid container spacing={0} justifyContent="center" alignItems="center" height={'80vh'}>
      <GoogleLogin useOneTap onSuccess={onLoginSuccess} onError={onLoginError} />        
    </Grid>
  )
} 

export default Authenticator
