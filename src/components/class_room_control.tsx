import React, { useState } from 'react';
import {
  createStyles,
  IconButton,
  makeStyles,
  Theme,
  Tooltip,
} from '@material-ui/core';
import VideocamIcon from '@material-ui/icons/Videocam';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import MicNoneIcon from '@material-ui/icons/MicNone';
import MicOffIcon from '@material-ui/icons/MicOff';
import ScreenShareIcon from '@material-ui/icons/ScreenShare';
import StopScreenShareIcon from '@material-ui/icons/StopScreenShare';

const useStyles = makeStyles((_: Theme) =>
  createStyles({
    root: {
      width: '100%',
      height: '100%',
      textAlign: 'center',
    },
    audioButton: {
      '&:hover': {
        background: 'transparent',
      },
    },
  })
);

interface ClassRoomControlProps {
  switchVideoHandler: Function;
  switchAudioHandler: Function;
  shareScreenHandler: Function;
  isVideoOpen: boolean;
  isAudioOpen: boolean;
  windowMenuList: [];
}

export default function ClassRoomControl(props: ClassRoomControlProps) {
  const classes = useStyles();
  const {
    switchVideoHandler,
    switchAudioHandler,
    shareScreenHandler,
    isVideoOpen,
    isAudioOpen,
  } = props;

  const [videoOpen, setVideoOpen] = useState(isVideoOpen);
  const [audioOpen, setAudioOpen] = useState(isAudioOpen);
  const [shareOpen, setShareOpen] = useState(false);

  const switchAudio = () => {
    setAudioOpen(!audioOpen);
    switchAudioHandler(!audioOpen);
  };

  const switchVideo = () => {
    setVideoOpen(!videoOpen);
    switchVideoHandler(!videoOpen);
  };

  const switchShareScreen = () => {
    setShareOpen(!shareOpen);
    shareScreenHandler(!shareOpen);
  };

  return (
    <div className={classes.root}>
      {/* 本地视频 */}
      <IconButton className={classes.audioButton} onClick={() => switchVideo()}>
          <Tooltip
            title={
              videoOpen ? (
                <>
                  <span>关闭摄像头</span>
                </>
              ) : (
                <>
                  <span>开启摄像头</span>
                </>
              )
            }
          >
            {videoOpen ? (
              <VideocamIcon color="primary" />
            ) : (
              <VideocamOffIcon color="primary" />
            )}
          </Tooltip>
      </IconButton>

      {/* 麦克风 */}
      <IconButton className={classes.audioButton} onClick={() => switchAudio()}>
        <Tooltip
          title={
            audioOpen ? (
              <>
                <span>关闭麦克风</span>
              </>
            ) : (
              <>
                <span>开启麦克风</span>
              </>
            )
          }
        >
          {audioOpen ? (
            <MicNoneIcon color="primary" />
          ) : (
            <MicOffIcon color="primary" />
          )}
        </Tooltip>
      </IconButton>

      {/* 窗口分享 */}
      <IconButton
        className={classes.audioButton}
        onClick={() => switchShareScreen()}
      >
        <Tooltip
          title={
            shareOpen ? (
              <>
                <span>关闭屏幕分享</span>
              </>
            ) : (
              <>
                <span>开启屏幕分享</span>
              </>
            )
          }
        >
          {shareOpen ? (
            <ScreenShareIcon color="primary" />
          ) : (
            <StopScreenShareIcon color="primary" />
          )}
        </Tooltip>
      </IconButton>

      {/* <WindowMenu windowMenuList={windowMenuList} switchScreenHandler = {switchInputScreenHandler}></WindowMenu> */}
    </div>
  );
}
