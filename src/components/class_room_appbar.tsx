import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';

const useStyles = makeStyles((_: Theme) =>
  createStyles({
    title: {
      marginRight: 100,
    },
    audioDeviceArrowButton: {
      padding: 5,
      '&:hover': {
        background: 'transparent',
      },
    },
    audioDeviceArrow: {
      color: '#ffffff',
    },
    audioButton: {
      '&:hover': {
        background: 'transparent',
      },
    },
    rightBox: {
      flexGrow: 1,
      display: 'flex',
      justifyContent: 'flex-end',
    }
  })
);

interface ClassRoomAppbarProps {
  logoutLiveHanlder?: Function;
  backHandler?: Function;
}

export default function ClassRoomAppbar(props: ClassRoomAppbarProps) {

  return (
    <AppBar position="static">
      <Toolbar>

      
      </Toolbar>
    </AppBar>
  );
}
