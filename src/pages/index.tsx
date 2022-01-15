import { useState } from 'react'
import { validateUnits, getGoogleApiClient, initGoogleClient} from '@/utils'
import { tableData } from '@/utils/data'

const IndexPage = () => {
  const [value, setValue] = useState<string>('')
  const [units, setUnits] = useState<number>(0)
  const gapi = getGoogleApiClient()
  
  const handleClientLoad = () => {
    gapi?.load('client:auth2', initGoogleClient);
  };

  const handleSubmit = ev => {
    ev.preventDefault()

    if(value)
      validateUnits(tableData[0], Number(value)).then(result => {
        setUnits(result)
      }).catch(err => console.warn(err))    
  }

  return (
    <>
      <button onClick={handleClientLoad}>Google Drive</button>
      <form onSubmit={handleSubmit}>
        <p>
          <input placeholder="Glicemia" type="number" value={value} onChange={e => setValue(e.target.value)}/>
          <button type="submit" disabled={!value}>Verificar!</button>
        </p>
        <p>
          <input placeholder="Unidades" type="number" readOnly value={units || ''} />
        </p>
      </form>
    </>
  )
} 

export default IndexPage
