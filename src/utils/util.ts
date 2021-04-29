export function shortString(title: string, length: number) {
  var newTitle = '';
  if (strCode(title) > length) {
    newTitle = title.substring(0, length);
    newTitle += '...';
  } else {
    newTitle = title;
  }
  return newTitle;
}

export function strCode(str: string) {
  //获取字符串的字节数
  var count = 0; //初始化字节数递加变量并获取字符串参数的字符个数
  if (str) {
    //如果存在字符串，则执行
    const len = str.length;
    for (var i = 0; i < len; i++) {
      //遍历字符串，枚举每个字符
      if (str.charCodeAt(i) > 255) {
        //字符编码大于255，说明是双字节字符(即是中文)
        count += 2; //则累加2个
      } else {
        count++; //否则递加一次
      }
    }
    return count; //返回字节数
  } else {
    return 0; //如果参数为空，则返回0个
  }
}
