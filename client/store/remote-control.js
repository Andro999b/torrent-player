import { isMobileApp } from '../utils'
import webApi from './remote/web'
import mobileAppApi from './remote/mobileApp'
import trackWhenNoCastAvaliable from './remote/trackWhenCastAvalible'

const api = isMobileApp() ? mobileAppApi() : webApi()

if(!api.isCastAvaliable) {
    trackWhenNoCastAvaliable()
}

export default api