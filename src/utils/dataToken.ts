import jwt from 'jwt-simple'
import { enviroments as env } from './enviroments'

const key = env.getAppKey()
export const dataToken = {
    key,
    gen: config => jwt.encode(config, key),
    read: token => jwt.decode(token, key),
}

export default dataToken
