import React, { useEffect, useState } from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { FileType } from '../pages/class_room_page';
import CircularProgress from '@material-ui/core/CircularProgress';

const useStyles = makeStyles((_: Theme) =>
  createStyles({
    webview: {
      width: '100%',
      height: '100%',
      display: 'inline-flex',
    },
    fabProgress: {
      position: 'absolute',
      left: '40%',
      top: '50%',
      width: '68px',
      height: '68px',
      marginLeft: '-68px',
      marginTop: '-32px',
      zIndex: 1,
    },
  })
);
interface ClassRoomShareFileProos {
  url: string;
  fileType: FileType;
  isLoading: boolean;
}

export default function ClassRoomShareFile(props: ClassRoomShareFileProos) {
  const classes = useStyles();
  const { url, fileType ,isLoading} = props;
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    // console.log(isLoading);
    if (fileType == FileType.office) {
      setFileUrl('https://view.officeapps.live.com/op/view.aspx?src=' + url);
    } else {
      setFileUrl(url);
    }
    // console.log(fileUrl);
  }, [url]);

  return (

    <>
    {isLoading && <CircularProgress size={68} color="secondary" className={classes.fabProgress}/>} 

    <webview id="webview" src={fileUrl} className={classes.webview}></webview>
    </>
    // <div>
    //   <Document
    //     file="https://zhaopin-dianbo-peixun-m.oss-cn-beijing.aliyuncs.com/live_pdf/%E6%99%BA%E8%81%94%E7%9B%B4%E6%92%AD%E8%AF%BE%E7%94%A8%E4%BA%BA20210311.pdf"
    //     onLoadSuccess={onDocumentLoadSuccess}
    //   >
    //     <Page pageNumber={pageNumber} />
    //   </Document>
    //   <p>Page {pageNumber} of {numPages}</p>
    // </div>
  );
}
