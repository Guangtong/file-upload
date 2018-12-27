let xhrs = [];
let uploadFiles = []

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
        let files = ev.dataTransfer.files
        for (let i = 0; i < files.length; i++) {
            sendFile(files[i], i)
        }
        // 防止浏览器直接打开文件
        ev.preventDefault();
    })
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
