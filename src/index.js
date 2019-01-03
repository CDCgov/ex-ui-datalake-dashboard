import React from 'react';
import ReactDOM from 'react-dom';
import 'babel-polyfill';
import App from './App';
import axios from 'axios';
import registerServiceWorker from './registerServiceWorker';
import './index.css';
import { secureMode, authURL } from './defaults';

// get params
const getParam = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[[]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// get the token and set the app name
const token = getParam('access_token');

// force login if we're in secure mode
const forceLogin = () => {
  if (!secureMode) return;
  window.location.href = authURL;
};
window.forceLogin = forceLogin;

// if in secureMode force login based on the token existing or not
if (secureMode) {
  if (token === null) {
    window.forceLogin();
  } else {
    window.token = token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}

// load the app
ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
