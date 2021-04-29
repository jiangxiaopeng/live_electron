import React, { useEffect, useState } from 'react';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Grid from '@material-ui/core/Grid';
import Avatar from '@material-ui/core/Avatar';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import CardMedia from '@material-ui/core/CardMedia';

const useStyles = makeStyles((_: Theme) =>
  createStyles({
    desktopCard: {
      height: 180,
      width: 240,
    },
    desktopCardImg: {
      height: 140,
      padding: 0,
    },
    desktopCardBottom: {
      display: 'flex',
      alignItems: 'center',
    },
    desktopCardTitle: {
      padding: '0 !important',
      marginLeft: 10,
      marginTop: 10,
    },
    desktopCardIcon: {
      width: 20,
      height: 20,
      padding: '0 !important',
      marginLeft: 10,
      marginTop: 10,
    },
  })
);

interface ClassRoomShareDialogProps {
  desktopDialogCloseHandler: Function;
  isShowDiaolog: boolean;
  desktopSources: [];
}

export default function ClassRoomShareDialog(props: ClassRoomShareDialogProps) {
  const classes = useStyles();
  const { desktopDialogCloseHandler, isShowDiaolog, desktopSources } = props;
  const [isChooseDesktopDialogOpen, setIsChooseDesktopDialogOpen] = useState(
    isShowDiaolog
  );

  const closeHandler = () => {
    setIsChooseDesktopDialogOpen(false);
    desktopDialogCloseHandler();
  };

  useEffect(() => {
    setIsChooseDesktopDialogOpen(isShowDiaolog);
  }, [isShowDiaolog]);

  return (
    <Dialog
      onClose={closeHandler}
      open={isChooseDesktopDialogOpen}
      maxWidth="xl"
    >
      <div>
        <DialogTitle id="customized-dialog-title">
          请选择一个窗口进行共享
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Grid container justify="center" spacing={2}>
                {desktopSources.map((source) => (
                  <Grid
                    key={
                      // @ts-ignore
                      source.id
                    }
                    item
                  >
                    <Card
                      className={classes.desktopCard}
                      onClick={closeHandler}
                    >
                      <CardActionArea>
                        <CardMedia
                          className={classes.desktopCardImg}
                          // @ts-ignore
                          src={source.thumbnail.toDataURL()}
                          component="img"
                        />
                        <div className={classes.desktopCardBottom}>
                          <Avatar
                            className={classes.desktopCardIcon}
                            src={
                              // @ts-ignore
                              source.appIcon ? source.appIcon.toDataURL() : ''
                            }
                          />
                          <CardContent className={classes.desktopCardTitle}>
                            {
                              // @ts-ignore
                              source.name
                            }
                          </CardContent>
                        </div>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
      </div>
    </Dialog>
  );
}
