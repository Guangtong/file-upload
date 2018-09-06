const http = require('http');
const fs = require('fs');
http.createServer((req, res) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Method', 'POST, GET');
        res.end('success');
    }
    if (req.url.indexOf('/download') > -1) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        let filename = req.url.substring(req.url.lastIndexOf('/') + 1);
        fs.readFile(`.\\${filename}`, 'utf-8', (err, data) => {
            if (err) {
                res.end(err.message);
            } else {
                // 设置Content-Length，在xhr里面就可以获取到文件的总大小了
                res.writeHead(200, {
                    'Content-Length': Buffer.byteLength(data),
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition':'attachment;filename='+encodeURI(filename)
                });
                res.write(data);
                res.end();
            }
        })
    }
    if (req.url.indexOf('/upload') > -1 && req.method === 'POST') {
        let chunks = [];
        let size = 0;
        res.setHeader('Access-Control-Allow-Origin', '*');
        req.on('data', (data) => {
            chunks.push(data);
            size += chunks.length;
        })
        req.on('end', (err) => {
            let buf;
            // 要判断chunks的长度来调用不同的Buffer方法
            if (size > 1) {
                buf = Buffer.concat(chunks, size);
            } else {
                buf = Buffer.from(chunks[0]);
            }
            let rems = [];
            // 根据/r/n来拆分数据和报头，其中/r的ASCII为13，/n的ASCII为10，由于文件首位照应，所以需要那前后一致对内容来做匹配，其他内容作为buffer写出
            // 以下添加序列字符+2都是为了去掉/r/n的分割，除开分割行'-----'每一行的前面会有换行\r\n
            // multipart/form-data上传的数据格式
            // ------WebKitFormBoundarytBtkoYcpqn4hvqSC
            // Content-Disposition: form-data; name="file"; filename="log.txt"
            // Content-Type: text/plain
            //
            // ------WebKitFormBoundarytBtkoYcpqn4hvqSC--
            for (let i = 0; i < buf.length; i++) {
                let v1 = buf[i];
                let v2 = buf[i + 1];
                if (v1 === 13 && v2 ===10) {
                    rems.push(i);
                }
            }
            console.log('rems', rems)
            // FormData传递的时候会使用一个字符串分割表单数据，所以通过这个字符串分割表单数据
            // 找到文件之间的分隔符
            let startTag = buf.slice(0, rems[0]).toString().replace('\r\n', '');
            // console.log('startTag', startTag)
            for (let i = 0; i < rems.length - 1;) {
                let contentDisposition =  buf.slice(rems[i] + 2, rems[i + 1]).toString();
                // console.log('contentDisposition', contentDisposition)
                let filename = contentDisposition.substring(contentDisposition.indexOf('filename=') + 10 , contentDisposition.length - 1);
                // 判断是否有文件名的属性，一般情况下上传是单独处理，但是存在和表单一起提交的情况，所以增加验证，如果是非文件那么要跳过这一次的文件写入
                let isFile = true;
                if (contentDisposition.indexOf('filename=') === -1 || filename === '') {
                    isFile = false;
                }
                let j = i;
                // 获取到终点的位置
                while(true) {
                    let tag = buf.slice(rems[j] + 2, rems[j + 1]).toString();
                    if (tag.startsWith(startTag)) {
                        break;
                    }
                    j++;
                }
                if (isFile) {
                    // console.log('i:' + i, 'j:' + j)
                    // 文件数据信息从第4行开始到到分隔符前的位置
                    let file = buf.slice(rems[i + 3] + 2, rems[j]);
                    // console.log('filename', filename);
                    // 文件流写文件
                    fs.writeFile(`${filename}`, file, (err) => {
                        if (err) {
                            console.log('write file fail', err)
                        } else {
                            console.log(`write file success: ${filename}`)
                        }
                    });
                }
                i = j + 1;
            }
            res.end('success');
        })
    }
}).listen(3000);

console.log('server started: http://localhost:3000');