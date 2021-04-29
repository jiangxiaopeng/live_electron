import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import React, { useEffect, useState } from 'react';

export enum TipsAlertEnum {
  success = 'success',
  info = 'info',
  warning = 'warning',
  error = 'error',
}

interface TipsAlertProps {
    message: string,
    type: TipsAlertEnum,
    isOpen: boolean,
    handler: Function,
    duration?: number | 5000,
}

export default function TipsAlert(props: TipsAlertProps) {
  const {message,type, isOpen,handler,duration} = props;
  const [open, setOpen] = useState(isOpen);

  const handleClose = () => {
    handler();
    setOpen(false);
  };

  const alertTypeString = (type:TipsAlertEnum) => {
    switch(type){
        case TipsAlertEnum.success:
            return 'success'
        case TipsAlertEnum.info:
            return 'info'
        case TipsAlertEnum.warning:
            return 'warning'
        case TipsAlertEnum.error:
            return 'error'
        default:
            return 'success'
    }
  }

  function Alert(props: any) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
  }

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      open={open}
      autoHideDuration={duration}
      onClose={handleClose}
    >
      <Alert severity={alertTypeString(type)} onClose={handleClose}>
        {message}
      </Alert>
    </Snackbar>
  );
}
