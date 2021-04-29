import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import IconButton from '@material-ui/core/IconButton';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { ipcRenderer } from 'electron';
import React, { useEffect, useRef, useState } from 'react';
import AddToQueueIcon from '@material-ui/icons/AddToQueue';
import DesktopWindowsIcon from '@material-ui/icons/DesktopWindows';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import CheckIcon from '@material-ui/icons/Check';
import {
  getItem,
  kObsDisabled,
  kObsScreenShareValue,
  kObsWindowDevice,
} from '../../utils/store';
import { Tooltip } from '@material-ui/core';
import { shortString } from '../../utils/util';

const useStyles = makeStyles((_: Theme) =>
  createStyles({
    root: {
      textAlign: 'center',
    },
    audioDeviceArrowButton: {
      '&:hover': {
        background: 'transparent',
      },
    },
    audioDeviceArrow: {
      color: '#ffffff',
    },
    popper: {
      zIndex: 10000,
    },
    listItem: {
      minWidth: 32,
    },
  })
);
interface WindowMenuProps {
  // isAudioOpen: boolean;
  windowMenuList: [];
  switchScreenHandler: Function;
}

export default function WindowMenu(props: WindowMenuProps) {
  const classes = useStyles();
  const { windowMenuList, switchScreenHandler } = props;
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const prevOpen = useRef(menuOpen);

  useEffect(() => {
    if (prevOpen.current === true && menuOpen === false) {
      anchorRef.current!.focus();
    }
    // console.log(getItem(kObsWindowDevice));
    prevOpen.current = menuOpen;
  }, [menuOpen]);

  const switchMenu = () => {
    setMenuOpen((prevOpen) => !prevOpen);
    ipcRenderer.invoke('obs-capture-windows');
  };

  const menuClose = (event: React.MouseEvent<EventTarget>, value: any) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    if (value !== '') {
    ipcRenderer.invoke('obs-switch-capture-window', value);
    switchScreenHandler(value == kObsDisabled ? false : true);
    }
    setMenuOpen(false);
  };

  function menuListKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault();
      setMenuOpen(false);
    }
  }

  return (
    <div className={classes.root}>
      <IconButton
        ref={anchorRef}
        aria-controls={menuOpen ? 'menu-list-grow' : undefined}
        aria-haspopup="true"
        className={classes.audioDeviceArrowButton}
        onClick={() => switchMenu()}
        disableFocusRipple={true}
        disableRipple={true}
      >
        <Tooltip
          title={
            <>
              <span>选择分享窗口</span>
            </>
          }
        >
          <AddToQueueIcon color="secondary" />
        </Tooltip>
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
                      <DesktopWindowsIcon fontSize="small" />
                    </ListItemIcon>
                    请选择一个窗口进行分享
                  </MenuItem>
                  <MenuItem
                    key="77777"
                    onClick={(e) => menuClose(e, kObsScreenShareValue)}
                    selected={kObsScreenShareValue == getItem(kObsWindowDevice)}
                  >
                    <ListItemIcon className={classes.listItem}>
                      {kObsScreenShareValue == getItem(kObsWindowDevice) && (
                        <CheckIcon fontSize="small" />
                      )}
                    </ListItemIcon>
                    分享整个屏幕
                  </MenuItem>
                  {windowMenuList.map((window: any, index) => {
                    if (window.name !== '') {
                      return (
                        <MenuItem
                          key={index}
                          onClick={(e) => menuClose(e, window.value)}
                          selected={window.value == getItem(kObsWindowDevice)}
                        >
                          <ListItemIcon className={classes.listItem}>
                            {window.value == getItem(kObsWindowDevice) && (
                              <CheckIcon fontSize="small" />
                            )}
                          </ListItemIcon>
                          {shortString(window.name,30)}
                        </MenuItem>
                      );
                    } else {
                      return null;
                    }
                  })}
                  <MenuItem
                    key="88888"
                    onClick={(e) => menuClose(e, kObsDisabled)}
                    selected={kObsDisabled == getItem(kObsWindowDevice)}
                  >
                    <ListItemIcon className={classes.listItem}>
                      {kObsDisabled == getItem(kObsWindowDevice) && (
                        <CheckIcon fontSize="small" />
                      )}
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
