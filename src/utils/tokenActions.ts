import jwt from 'jwt-simple'
import { enviroments as env } from '@/utils/'
const key = env.getAppKey()
const tokenActions = {
    key,
    gen: config => jwt.encode(config, key),
    read: token => jwt.decode(token, key),
}

export default tokenActions
