import { isMobileApp } from '../utils'
import webApi from './remote/web'
import mobileAppApi from './remote/mobileApp'

const api = isMobileApp() ? mobileAppApi : webApi

export default api