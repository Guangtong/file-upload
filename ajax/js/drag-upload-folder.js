let xhrs = [];
let uploadFiles = []
let i = 0;
window.onload = ev => {
    // 增加拖拽上传逻辑
    let fileArea = document.querySelector('#fileArea')
    fileArea.addEventListener('dragover', ev => {
        ev.preventDefault();
    })
    fileArea.addEventListener('dragenter', ev => {
        ev.preventDefault();
    })
    fileArea.addEventListener('drop', ev => {
        for (let i = 0; i < ev.dataTransfer.items.length; i++) {
            let entry = ev.dataTransfer.items[i].webkitGetAsEntry()
            if (entry) {
                scanFiles(entry, sendFile)
            }
        }
        // 防止浏览器直接打开文件
        ev.preventDefault();
    })
}

function scanFiles (entry, callback) { // 浏览文件结构
    // 如果是文件目录，那么继续循环获取到目录下的文件
    if (entry.isDirectory) {
      let directoryReader = entry.createReader()
      directoryReader.readEntries(entries => {
        entries.forEach(entry => {
          scanFiles(entry, callback)
        })
      }, err => {
        console.log(err, err.message)
      })
    }
    // 如果是文件，安么添加到最后的文件数据集中
    if (entry.isFile) {
        i++
        entry.file(file => {
            callback(file, i)
        }, err => {
            console.log(err, err.message)
        })
    }
}
  
function sendFile (file, i) {
    uploadFiles.push(file)
    var fd = new FormData();
    let xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:3000/upload');
    xhr.setRequestHeader('Content-Type', 'multipart/form-data');
    xhr.onprogress = (event) => {
        console.log('====onprogress====', event)
        console.log(`loaded: ${event.loaded}, total: ${event.total}`);
    }
    xhr.onreadystatechange = () => {
        if(xhr.readyState === xhr.DONE) {
            console.log('finished')
        }
    }
    xhr.onabort = (event) => {
        console.log('file abort:', event)
        file.status = ''
        file.percentage = 0
    }
    xhr.upload.onloadstart = event => {
        console.log('====upload loadstart====', event)
        // 开始上传的时候构建file对象
        // 上传文件区域添加文件
        let fileList = document.querySelector('#fileList');
        fileList.appendChild(createFileDom(file, i, true));
    }
    xhr.upload.onprogress = (event) => {
        console.log('====upload onprogress====', event);
        console.log(`upload loaded: ${event.loaded}, total: ${event.total}`);
        let progress = document.querySelector(`#fp${i}`);
        let pgValue = document.querySelector(`#fpv${i}`);
        file.percentage = event.loaded * 100 / event.total
        progress.value = file.percentage
        pgValue.textContent = (file.percentage).toFixed(2) + '%';
    }
    xhr.upload.onload = (event) => {
        console.log('====upload onload====', event)
        console.log(`upload loaded: ${event.loaded}, total: ${event.total}`);
        let progress = document.querySelector(`#fp${i}`);
        let pgValue = document.querySelector(`#fpv${i}`);
        file.percentage = event.loaded * 100 / event.total;
        file.status = 'finished';
        progress.value = 100
        pgValue.textContent = '100%';
    }
    fd.append('file', file);
    xhr.send(fd)
}
