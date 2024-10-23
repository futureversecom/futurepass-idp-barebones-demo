import { login } from './auth'

document
  .getElementById('login-button-google')!
  .addEventListener('click', () => {
    login('google')
  })

document
  .getElementById('login-button-facebook')!
  .addEventListener('click', () => {
    login('facebook')
  })

document.getElementById('login-button-apple')!.addEventListener('click', () => {
  login('apple')
})
document
  .getElementById('login-button-discord')!
  .addEventListener('click', () => {
    login('discord')
  })
document
  .getElementById('login-button-roblox')!
  .addEventListener('click', () => {
    login('roblox')
  })

document.getElementById('login-button-email')!.addEventListener('click', () => {
  login('email')
})

document
  .getElementById('login-button-idp-front-end-login-general')!
  .addEventListener('click', () => {
    login('idp-f')
  })

document
  .getElementById('login-button-idp-front-end-login-unity')!
  .addEventListener('click', () => {
    login('idp-f', undefined, 'unity')
  })

document
  .getElementById('login-button-idp-front-end-login-unreal')!
  .addEventListener('click', () => {
    login('idp-f', undefined, 'unreal')
  })
