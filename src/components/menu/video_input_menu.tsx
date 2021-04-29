import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import IconButton from '@material-ui/core/IconButton';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { ipcRenderer } from 'electron';
import React, {useEffect, useRef, useState } from 'react';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import VideocamIcon from '@material-ui/icons/Videocam';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import CheckIcon from '@material-ui/icons/Check';
import { getItem, kObsDisabled, kObsVideoDevice } from '../../utils/store';

const useStyles = makeStyles((_: Theme) =>
  createStyles({
    title: {
      flexGrow: 1,
    },
    audioDeviceArrowButton: {
      padding: 0,
      marginLeft: -10,
      marginRight: 20,
      '&:hover': {
        background: 'transparent',
      },
    },
    audioDeviceArrow: {
      color: '#ffffff',
    },
    audioButton: {
      // padding: 0,
      '&:hover': {
        background: 'transparent',
      },
    },
    popper: {
      zIndex: 10000,
    },
    listItem: {
      minWidth: 32,
    },
  })
);
interface VideoInputMenuProps {
  // isAudioOpen: boolean;
  videoInputDeviceList: [];
  switchVideoHandler: Function;
}

export default function VideoInputMenu(props: VideoInputMenuProps) {
  const classes = useStyles();
  const { videoInputDeviceList ,switchVideoHandler} = props;
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const prevOpen = useRef(menuOpen);

  useEffect(() => {
    if (prevOpen.current === true && menuOpen === false) {
      anchorRef.current!.focus();
    }

    prevOpen.current = menuOpen;
  }, [menuOpen]);

  const switchMenu = () => {
    setMenuOpen((prevOpen) => !prevOpen);
    ipcRenderer.invoke('obs-input-devices');
  };

  const menuClose = (event: React.MouseEvent<EventTarget>, value: any) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    if (value == kObsDisabled) {
      ipcRenderer.invoke('obs-close-camera-window');
    } else {
      ipcRenderer.invoke('obs-open-camera-window');
    }
    switchVideoHandler(value == kObsDisabled ? false : true);
    setMenuOpen(false);
  };

  function menuListKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault();
      setMenuOpen(false);
    }
  }

  return (
    <div>
      <IconButton
        ref={anchorRef}
        aria-controls={menuOpen ? 'menu-list-grow' : undefined}
        aria-haspopup="true"
        className={classes.audioDeviceArrowButton}
        onClick={() => switchMenu()}
        disableFocusRipple = {true}
        disableRipple = {true}
      >
        <KeyboardArrowDownIcon className={classes.audioDeviceArrow} />
      </IconButton>

      <Popper
        className={classes.popper}
        open={menuOpen}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={(e) => menuClose(e, '')}>
                <MenuList
                  autoFocusItem={menuOpen}
                  id="menu-list-grow"
                  onKeyDown={menuListKeyDown}
                >
                  <MenuItem
                    key="99999"
                    onClick={(e) => menuClose(e, 99999)}
                    disabled
                  >
                    <ListItemIcon className={classes.listItem}>
                      <VideocamIcon fontSize="small" />
                    </ListItemIcon>
                    选择本地摄像头
                  </MenuItem>
                  {videoInputDeviceList.map((device: any, index) => {
                    return (
                      <MenuItem
                        key={index}
                        onClick={(e) => menuClose(e, device.id)}
                        selected={device.id == getItem(kObsVideoDevice)}
                      >
                        <ListItemIcon className={classes.listItem}>
                          {device.id == getItem(kObsVideoDevice) && <CheckIcon fontSize="small" />}
                        </ListItemIcon>
                        {device.description}
                      </MenuItem>
                    );
                  })}
                  <MenuItem key="88888" onClick={(e) => menuClose(e, kObsDisabled)} selected={kObsDisabled == getItem(kObsVideoDevice)}>
                    <ListItemIcon className={classes.listItem}>
                      {kObsDisabled == getItem(kObsVideoDevice) && <CheckIcon fontSize="small" />}
                    </ListItemIcon>
                    禁用
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  );
}
