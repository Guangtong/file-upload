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
            // 以下添加序列字符+2都是为了去掉/r/n的分割
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
            // 按照每6个进行解析
            console.log('rems', rems);
            for (let i = 0; i < rems.length; i = i + 5) {
                // 获取Content-Disposition行
                let contentDisposition =  buf.slice(rems[i] + 2, rems[i+1]).toString();
                console.log('contentDisposition', contentDisposition);
                let filename = contentDisposition.substring(contentDisposition.indexOf('filename=') + 10 , contentDisposition.length - 1);
                console.log('filename', filename);
                // 获取文件主体
                let file = buf.slice(rems[i + 3] + 2, rems[i + 4]);
                console.log('file', file);
                // 文件流写文件
                fs.writeFile(`${filename}`, file, (err) => {
                    if (err) {
                        console.log('write file fail', err)
                    } else {
                        console.log(`write file success: ${filename}`)
                    }
                });
            }
            // 获取文件名
            // let msg = buf.slice(rems[0] + 2, rems[1]).toString();
            // let filename = msg.substring(msg.indexOf('filename=') + 10 , msg.length - 1);
            // // 获取数据主体
            // let file = buf.slice(rems[3] + 2, rems[rems.length - 2]);
            // fs.writeFile(`${filename}`, file, (err) => {
            //     if (err) {
            //         res.end(err.message);
            //     } else {
            //         res.end('success');
            //     }
            // })
            res.end('success');
        })
    }
}).listen(3000);

console.log('server started: http://localhost:3000');