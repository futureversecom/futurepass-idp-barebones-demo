import { login } from './auth';

document
  .getElementById('login-button-google')!
  .addEventListener('click', () => {
    login('google');
  });

document
  .getElementById('login-button-facebook')!
  .addEventListener('click', () => {
    login('facebook');
  });

document
  .getElementById('login-button-roblox')!
  .addEventListener('click', () => {
    login('roblox');
  });

document.getElementById('login-button-email')!.addEventListener('click', () => {
  login('email');
});
document
  .getElementById('login-button-idp-front-end-login')!
  .addEventListener('click', () => {
    login('idp-f');
  });
