import mixpanel from 'mixpanel-browser'
import { mixpanelProjectToken } from '../../config'

// Near entry of your product, init Mixpanel
mixpanel.init(mixpanelProjectToken, {
  debug: true,
  persistence: 'localStorage',
})

export const demoMixpanel = mixpanel
