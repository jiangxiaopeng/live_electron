import React, { useEffect } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItemText from '@material-ui/core/ListItemText';
import PersonIcon from '@material-ui/icons/Person';
import { ListItem } from '@material-ui/core';
import ListItemIcon from '@material-ui/core/ListItemIcon';
const useStyles = makeStyles((_: Theme) =>
  createStyles({
    root: {
      overflow: 'hidden',
      width: 320,
      height: '100%',
      paddingBottom: '100px !important',
    },
    list: {
      width: '100%',
    },
    listItemIcon: {
      minWidth:40,
    },
  })
);
interface MemberProts {
  memberList: string[];
}

export default function MemberList(props: MemberProts) {
  const classes = useStyles();
  const {memberList} = props;

  useEffect(() => {

  }, []);

  return (
    <div className={classes.root}>
      <List className={classes.list} component="nav" aria-label="main mailbox folders">
        {memberList.map((member, index) => {
          return (
            <ListItem key={index} button>
              <ListItemIcon className={classes.listItemIcon}>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText
                key={index}
                primary={JSON.parse(member).user}
              ></ListItemText>
            </ListItem>
          );
        })}
      </List>
    </div>
  );
}
