import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import {
  kObsStartShareScreenMessage,
  kObsStopShareScreenMessage,
  SOCKET_BASE_URL,
} from '../utils/constains';
import {
  Backdrop,
  Box,
  CardContent,
  CardHeader,
  CircularProgress,
} from '@material-ui/core';
import SwipeableViews from 'react-swipeable-views';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import TabPanel, { a11yProps } from '../components/tab_panel';
import MessageList from '../components/message_list';
import io from 'socket.io-client';

import ClassRoomAppbar from '../components/class_room_appbar';

import { ipcRenderer } from 'electron';
import MemberList from '../components/member_list';
import moment from 'moment';

import {
  getItem,
  kAnchorName,
  kObsAudioDevice,
  kObsDisabled,
  kObsVideoDevice,
  kObsWindowDevice,
  setItem,
} from '../utils/store';
import ClassRoomControl from '../components/class_room_control';
import Skeleton from '@material-ui/lab/Skeleton';
// @ts-ignore
const styles = (theme) => ({
  root: {
    width: '100%',
    height: 640,
  },
  container: {
    position: 'relative',
    display: 'flex',
    width: '100%',
    height: '100%',
  },
  leftBox: {
    height: '100%',
    width: '100%',
    margin: 20,
    float: 'left',
  },
  classRoomControl: {
    paddingTop: 5,
    float: 'right',
    marginRight: 20,
    marginTop: 195,
    width: 50,
    height: 150,
    backgroundColor: '#f6f6f6',
  },
  rightBox: {
    marginRight: 20,
    marginTop: 20,
    width: 320,
    height: '100%',
    float: 'right',
  },
  swipeableViews: {
    width: '100%',
    height: 593,
    display: 'flex',
    padding: 0,
    // backgroundColor: '#f85f48'
    // position: 'relative',
  },
  screenMessage: {
    position: 'absolute',
    top: 300,
    textAlign: 'center',
    width: 950,
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
  card: {
    maxWidth: '100%',
    maxHeight: 760,
    shadowBox: 'none !important',
  },
  media: {
    height: 600,
  },
});
interface ClassRoomPageState {
  value: number;
  alertOpen: boolean;
  isVideoOpen: boolean;
  isAudioOpen: boolean;
  isChooseDesktopDialogOpen: boolean;
  desktopSources: [];
  uploadFileType: FileType;
  url: string;
  isLoading: boolean;
  memberList: string[];
  windowMenuList: [];
  videoInputDeviceList: [];
  audioInputDeviceList: [];
  tipAlertOpen: boolean;
  tipMessage: string;
  screenMessageOpen: boolean;
  isSkeleton: boolean;
}

export enum FileType {
  pdf,
  office,
}

class ClassRoomPage extends Component<any, ClassRoomPageState> {
  localVideo: any;
  localStream: any;
  command: any;
  socket: any;
  messageRef: any;
  liveURL: string;

  constructor(props: any) {
    super(props);
    this.state = {
      value: 0,
      alertOpen: false,
      isVideoOpen: true,
      isAudioOpen: true,
      isChooseDesktopDialogOpen: false,
      desktopSources: [],
      uploadFileType: FileType.pdf,
      url: '',
      isLoading: false,
      memberList: [],
      windowMenuList: [],
      videoInputDeviceList: [],
      audioInputDeviceList: [],
      tipAlertOpen: false,
      tipMessage: '',
      screenMessageOpen: false,
      isSkeleton: true,
    };

    this.liveURL = '';
    this.messageRef = React.createRef();
  }

  componentDidMount() {
    this.setupOBS();
    this.setupSocket();
  }

  componentWillUnmount() {
    // console.log('unmout');
    setItem(kObsAudioDevice, null);
    setItem(kObsVideoDevice, null);
    setItem(kObsWindowDevice, kObsDisabled);
    this.socket.emit('leave');
    this.socket.disconnect();
    ipcRenderer.invoke('obs-destroy');
  }

  initOBS(url: string) {
    ipcRenderer
      .invoke('obs-init', url)
      .then(() => {
        this.setState({ isSkeleton: false });
        ipcRenderer.invoke('obs-show-camerawindow');
        ipcRenderer.invoke('obs-start-streaming');
      })
      .catch();
  }

  async setupOBS() {
    this.setState({ isSkeleton: true });
   
      //直播中
      let url = "推流url"
      this.liveURL = url;
      this.initOBS(this.liveURL);


    ipcRenderer.on('obs-capture-windows-reply', (_, windows) => {
      this.setState({ windowMenuList: windows });
    });

    ipcRenderer.on(
      'obs-input-devices-reply',
      (_, audioInputDevices, videoInputDevices) => {
        // this.setState({windowMenuList: windows});
        // console.log(audioInputDevices);
        this.setState({ audioInputDeviceList: audioInputDevices });
        this.setState({ videoInputDeviceList: videoInputDevices });
      }
    );

    // ipcRenderer.on('obs-switch-video-button-status', (_, isOpen) => {
    //   // this.setState({windowMenuList: windows});
    //   console.log('isopen',isOpen);
    //   this.setState({isVideoOpen: isOpen});
    // });
  }

  setupSocket() {
    this.socket = io(SOCKET_BASE_URL, { query: { roomID: "liveInfo.liveId" } });

    //建立连接加入房间
    this.socket.on('connect', () => {
      this.socket.emit('join', "liveInfo.anchorName", 'anchor');
    });

    this.socket.on('msg', (user: any, data: any) => {
      //自己的消息不发送到本地显示。
      if (user != getItem(kAnchorName)) {
        if (this.messageRef.current == null) {
          return;
        }
        this.messageRef.current.recieveMessage({
          user: user,
          message: data.msg,
          role: 'member',
          createTime: moment().format('yyyy-MM-DD HH:mm:ss'),
        });
      }
    });

    this.socket.on('sys', (sysMsg: any, _: any) => {

      //自己的消息不发送到本地显示。
      if (sysMsg.search(getItem(kAnchorName)) == -1) {
        if (this.messageRef.current == null) {
          return;
        }
        this.messageRef.current.recieveMessage({
          user: '',
          message: sysMsg,
          role: '',
          createTime: moment().format('yyyy-MM-DD HH:mm:ss'),
        });
      }
    });
  }

  handleChange = (_: React.ChangeEvent<{}>, newValue: number) => {
    this.setState({ value: newValue });
  };

  handleChangeIndex = (index: number) => {
    this.setState({ value: index });
  };

  back() {
    this.setState({ isLoading: true });
    ipcRenderer.invoke('obs-stop-streaming').then(() => {
      ipcRenderer.invoke('obs-destroy').then(() => {
        this.setState({ isLoading: false });
        this.props.history.push('/home');
      });
    });
  }

  switchAudio = (open: boolean) => {
    if (!open) {
      ipcRenderer.invoke('obs-close-audio-input-device');
    } else {
      ipcRenderer.invoke('obs-open-audio-input-device', null);
    }
  };

  switchVideo = (open: boolean) => {
    if (!open) {
      ipcRenderer.invoke('obs-close-camera-window');
    } else {
      ipcRenderer.invoke('obs-open-camera-window');
    }
  };

  shareScreen = (open: boolean) => {
    if (!this.liveURL) {
      return;
    }
    if (!open) {
      ipcRenderer.invoke('obs-close-desktop-streaming');
      this.setState({
        tipAlertOpen: true,
        screenMessageOpen: false,
        tipMessage: kObsStopShareScreenMessage,
      });
    } else {
      ipcRenderer.invoke('obs-open-desktop-streaming');
      this.setState({
        tipAlertOpen: true,
        screenMessageOpen: true,
        tipMessage: kObsStartShareScreenMessage,
      });
    }
  };

  desktopDialogClose = () => {
    this.setState({ isChooseDesktopDialogOpen: false });
  };

  sendMessage = (type: number, user: string, msg: string) => {
    this.socket.send({ type: type, id: user, msg: msg, role: 'anchor' });
    // this.socket.send({ type: type, id: user, msg: msg});
  };

  render() {
    const { classes, theme } = this.props;
    const { isSkeleton } = this.state;

    if (isSkeleton) {
      return (
        <div className={classes.card}>
          <CardHeader
            avatar={
              <Skeleton
                animation="wave"
                variant="circle"
                width={40}
                height={40}
              />
            }
            title={
              <Skeleton
                animation="wave"
                height={10}
                width="80%"
                style={{ marginBottom: 6 }}
              />
            }
            subheader={<Skeleton animation="wave" height={10} width="40%" />}
          />
          <Skeleton animation="wave" variant="rect" className={classes.media} />
          <CardContent>
            <React.Fragment>
              <Skeleton
                animation="wave"
                height={10}
                style={{ marginBottom: 6 }}
              />
              <Skeleton animation="wave" height={10} width="80%" />
            </React.Fragment>
          </CardContent>
        </div>
      );
    } else {
      return (
        <Box className={classes.root}>
          <Backdrop className={classes.backdrop} open={this.state.isLoading}>
            <CircularProgress color="inherit" />
          </Backdrop>
          <ClassRoomAppbar></ClassRoomAppbar>

          <Box className={classes.container}>
            <Box className={classes.leftBox} boxShadow={2}>
              {/* <Box
                hidden={!this.state.screenMessageOpen}
                className={classes.screenMessage}
              >
                {kObsShareScreenMessage}
              </Box> */}
              <Box className={classes.classRoomControl}>
                <ClassRoomControl
                  switchVideoHandler={this.switchVideo}
                  switchAudioHandler={this.switchAudio}
                  shareScreenHandler={this.shareScreen}
                  windowMenuList={this.state.windowMenuList}
                  isVideoOpen={this.state.isVideoOpen}
                  isAudioOpen={this.state.isAudioOpen}
                ></ClassRoomControl>
              </Box>
            </Box>
            <Box className={classes.rightBox} boxShadow={2}>
              <AppBar position="static" color="default">
                <Tabs
                  value={this.state.value}
                  onChange={this.handleChange}
                  indicatorColor="primary"
                  textColor="primary"
                  variant="fullWidth"
                  aria-label="full width tabs example"
                >
                  <Tab label="消息列表" {...a11yProps(0)} />
                  <Tab
                    label={'成员列表 (' + this.state.memberList.length + ')'}
                    {...a11yProps(1)}
                  />
                </Tabs>
              </AppBar>
              <SwipeableViews
                className={classes.swipeableViews}
                axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                index={this.state.value}
                onChangeIndex={this.handleChangeIndex}
              >
                <TabPanel
                  value={this.state.value}
                  index={0}
                  dir={theme.direction}
                >
                  <MessageList
                  ></MessageList>
                </TabPanel>
                <TabPanel
                  value={this.state.value}
                  index={1}
                  dir={theme.direction}
                >
                  <MemberList memberList={this.state.memberList}></MemberList>
                </TabPanel>
              </SwipeableViews>
            </Box>
          </Box>
        </Box>
      );
    }
  }
}
// @ts-ignore
export default withStyles(styles, { withTheme: true })(ClassRoomPage);
