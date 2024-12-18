import jwt from 'jwt-simple'
import { config } from 'config'

const key = config.AppKey
export const dataToken = {
    key,
    gen: config => jwt.encode(config, key),
    read: token => jwt.decode(token, key),
}

export default dataToken
