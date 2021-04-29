import React from 'react';
import { render } from 'react-dom';
import './App.global.css';
import { createMuiTheme, ThemeProvider } from '@material-ui/core';
import Routes from './routes';

const theme = createMuiTheme({
  palette: {
    primary: {
      main:'#4170FF'
    },
  },
});

render(<ThemeProvider theme={theme}><Routes/></ThemeProvider>, document.getElementById('root'));
// render(<Routes/>, document.getElementById('root'));