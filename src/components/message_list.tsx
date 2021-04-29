import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import { Avatar, Box } from '@material-ui/core';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import SendIcon from '@material-ui/icons/Send';
import IconButton from '@material-ui/core/IconButton';
import { kAnchorName } from '../utils/store';
import { getItem } from '../utils/store';

const useStyles = makeStyles((_: Theme) =>
  createStyles({
    root: {
      // overflow: 'hidden',
      width: 320,
      height: '100%',
      paddingBottom: '80px !important',
    },
    list: {
      width: '100%',
      marginBottom: 10,
      // backgroundColor: '#f85f48'
    },
    listItem: {
      padding: 8,
    },
    textArea: {
      width: '100%',
      position: 'absolute',
      bottom: 0,
      backgroundColor: '#ffffff',
      borderStyle: 'none',
      outline: 'none',
      padding: 10,
      paddingBottom: 5,
      boxSizing: 'border-box',
      fontSize: 16,
      resize: 'none',
    },
    sendButton: {
      position: 'fixed',
      bottom: 5,
      right: 10,
    },
    leftContainer: {
      width: '100%',
      marginBottom: 20,
    },
    leftAvatar: {},
    leftChildContainer: {
      wordWrap: 'break-word',
      wordBreak: 'break-all',
      textAlign: 'left',
    },
    leftName: {
      textAlign: 'left',
      marginLeft: 10,
    },
    leftMessageContainer: {
      marginTop: 4,
      marginRight: 10,
      marginLeft: 10,
    },
    leftMessage: {
      textAlign: 'left',
      backgroundColor: '#ffffff',
      padding: '8px',
      display: 'inline-block',
      borderRadius: 4,
      color: '#333333',
      position: 'relative',
      marginRight: 30,
      '&:after': {
        content: '"   "',
        boder: '8px solid #ffffff00',
        borderRight: '8px solid #fff',
        position: 'absolute',
        top: '6px',
        left: '-16px',
      },
    },

    rightContainer: {
      width: '100%',
      marginBottom: 20,
    },
    rightAvatar: {},
    rightChildContainer: {
      wordWrap: 'break-word',
      wordBreak: 'break-all',
      textAlign: 'right',
    },
    rightName: {
      textAlign: 'right',
      marginRight: 10,
    },
    rightMessageContainer: {
      marginTop: 4,
      marginRight: 10,
      marginLeft: 20,
    },
    rightMessage: {
      textAlign: 'left',
      backgroundColor: '#4170FF',
      padding: '8px',
      display: 'inline-block',
      borderRadius: 4,
      color: '#ffffff',
      position: 'relative',
      marginLeft: 30,
      '&:after': {
        content: '"   "',
        boder: '8px solid #ffffff00',
        borderRight: '8px solid #fff',
        position: 'absolute',
        top: '6px',
        left: '-16px',
      },
    },
    sysMessage: {
      textAlign: 'center',
      width:  '100%',
      minHeight: 30,
      color: '#8e8e8e',
      fontSize: 14,
    },
  })
);

interface MessageProts {

}

const MessageList = forwardRef((props: MessageProts, ref) => {
  const classes = useStyles();
  const [messageList, setMessageList] = useState<string[]>([]);
  const messageTextArea = useRef(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    fetchMessageList();
  }, []);

  function sendLocalMessage(json: {}, bottom: boolean) {
    const messageJSON = JSON.stringify(json);
    setMessageList([...messageList, messageJSON]);
    if (bottom) {
      setTimeout(() => {
        scrollToBottom(true);
      }, 0);
    }
  }

  useImperativeHandle(ref, () => ({
    recieveMessage: (message: {}) => {
      sendLocalMessage(message, true);
    },
  }));

  const send = () => {
   
  };

  function fetchMessageList() {
 
  }

  const scrollToBottom = (animate: boolean) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: animate == true ? 'smooth' : 'auto',
      block: 'end',
    });
  };

  return (
    <div className={classes.root} ref={messagesEndRef}>
      <List className={classes.list}>
        {messageList.map((message, index) => {
          const messageObj = JSON.parse(message);
          if (messageObj.user == null || messageObj.user == '') {
            return (
              <ListItem className={classes.listItem} key={index}>
                <Box className={classes.sysMessage}>
                  <span>
                    {messageObj.message}
                  </span>
                </Box>
              </ListItem>
            );
          } else {
            if (messageObj.user == getItem(kAnchorName)) {
              return (
                <ListItem className={classes.listItem} key={index}>
                  <Box
                    className={classes.rightContainer}
                    display="flex"
                    flexDirection="row-reverse"
                    alignSelf="flex-end"
                  >
                    <Avatar className={classes.rightAvatar}></Avatar>
                    <Box className={classes.rightChildContainer}>
                      <Box className={classes.rightName}>{messageObj.user}</Box>
                      <Box className={classes.rightMessageContainer}>
                        <span className={classes.rightMessage}>
                          {messageObj.message}
                        </span>
                      </Box>
                    </Box>
                  </Box>
                </ListItem>
              );
            } else {
              return (
                <ListItem className={classes.listItem} key={index}>
                  <Box
                    className={classes.leftContainer}
                    display="flex"
                    flexDirection="row"
                    alignSelf="flex-start"
                  >
                    <Avatar className={classes.leftAvatar}></Avatar>
                    <Box className={classes.leftChildContainer}>
                      <Box className={classes.leftName}>{messageObj.user}</Box>
                      <Box className={classes.leftMessageContainer}>
                        <span className={classes.leftMessage}>
                          {messageObj.message}
                        </span>
                      </Box>
                    </Box>
                  </Box>
                </ListItem>
              );
            }
          }
        })}
      </List>
      <TextareaAutosize
        ref={messageTextArea}
        className={classes.textArea}
        rowsMax={4}
        rowsMin={4}
        placeholder="说点什么"
        draggable={false}
      />
      <Box className={classes.sendButton}>
        <IconButton onClick={() => send()}>
          <SendIcon></SendIcon>
        </IconButton>
      </Box>
    </div>
  );
});

export default MessageList;
