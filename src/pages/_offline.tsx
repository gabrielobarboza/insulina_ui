import { CalcForm, Authenticator} from '@/components'
import { Container } from '@mui/material'
import { useAuth } from '@/contexts'

const IndexOfflinePage = () => {
  const { authorized } = useAuth()
  return (
    <>
      <Container>
      {authorized ? <CalcForm /> :  <Authenticator />}
      </Container>
    </>
  )
} 

export default IndexOfflinePage
