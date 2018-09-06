let xhrs = [];
let isSeparate = false;
/**
 * 文件上传
 */
function upload() {
    let formData = new FormData(document.getElementById('fileForm'));
    if (isSeparate) {
        // 过滤掉没有选择文件时候的传递
        formData.getAll('file').filter(file => {
            return file.name
        }).forEach((file,index) => {
            let separateFormData = new FormData();
            separateFormData.set('file',file);
            let xhr = createXhr(separateFormData, index);
            xhrs.push(xhr);
        })
    } else {
        let xhr = createXhr(formData);
        xhrs.push(xhr);
    }
}

function createXhr(formData, index) {
    let progress, pgValue;
    if (index !== undefined) {
        progress = document.querySelector(`#fp${index}`);
        pgValue = document.querySelector(`#fpv${index}`);
    } else {
        progress = document.querySelector('#progress');
        pgValue = document.querySelector('#pgValue');
    }
    let xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:3000/upload');
    xhr.setRequestHeader('Content-Type', 'multipart/form-data');
    xhr.onprogress = (event) => {
        console.log('onprogress', event)
        console.log(`loaded: ${event.loaded}, total: ${event.total}`);
    }
    xhr.upload.onprogress = (event) => {
        console.log('upload onprogress', event)
        progress.value = event.loaded * 100 / event.total;
        pgValue.textContent = (progress.value).toFixed(2) + '%';
        console.log(`upload loaded: ${event.loaded}, total: ${event.total}`);
    }
    xhr.onreadystatechange = () => {
        if(xhr.readyState === xhr.DONE) {
            progress.value = 100;
        }
    }
    xhr.onabort = (event) => {
        console.log('file abort:', event)
    }
    xhr.send(formData);
    return xhr;
}
/**
 * 取消上传
 * @param {*} index xhr队列
 */
function abort(index) {
    if (xhrs.length > 0) {
        if (index !== undefined && index !== null) {
            xhrs[index].abort();
        } else {
            xhrs.forEach(xhr => {
                xhr.abort();
            })
        }
    }
}
/**
 * 文件change事件
 * @param {*} event 事件
 */
function changeFileChoose(event) {
    let fileList = document.querySelector('#fileList');
    // 判断是否有子节点，如果有，则移除，直到所有的移除完毕
    while(fileList.hasChildNodes()) {
        fileList.removeChild(fileList.firstChild)
    }
    // 创建临时片段，一次性插入使用
    let fragment = document.createDocumentFragment();
    // 获取到当前的对象中的文件，循环显示
    for(let i = 0; i < event.target.files.length; i++) {
        let file = event.target.files[i];
        let el = document.createElement('div');
        let p = document.createElement('p');
        //添加文件信息
        p.textContent = `File name: ${file.name}, File size: ${returnFileSize(file.size)}`;
        el.appendChild(p);
        if (isSeparate) {
            let progress = document.createElement('progress');
            progress.id = `fp${i}`;
            progress.value = 0;
            progress.max = 100;
            el.appendChild(progress);
            let pValue = document.createElement('span');
            pValue.textContent = '0%';
            pValue.id = `fpv${i}`
            el.appendChild(pValue);
            let button = document.createElement('button');
            button.onclick = () => {
                abort(i);
            }
            button.textContent = '取消';
            el.appendChild(button);
        }
        // 添加图片预览
        if (validateImage(file.type)) {
            let image = document.createElement('img');
            // URL.createObjectURL可以接受File, Blob, MediaSource对象
            image.src = window.URL.createObjectURL(file);
            el.appendChild(image);
        }
        fragment.appendChild(el);
    }
    // 最后增加所有文件片段
    fileList.appendChild(fragment);
}
/**
 * 验证图片类型
 * @param {*} type 文件类型
 */
function validateImage(type) {
    return ['image/jpeg', 'image/png', 'image/jpg'].includes(type);
}
/**
 * 获取文件尺寸参数
 * @param {*} size 文件size 
 */
function returnFileSize(size) {
    if(size < 1024) {
      return size + 'B';
    } else if(size >= 1024 && size < 1048576) {
      return (size/1024).toFixed(1) + 'KB';
    } else if(size >= 1048576) {
      return (size/1048576).toFixed(1) + 'MB';
    }
}


function download() {
    let filename = document.getElementById('filename');
    let progress = document.getElementById('progress2');
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `http://localhost:3000/download/${filename.value}`);
    xhr.setRequestHeader('Content-Type', 'multipart/form-data');
    xhr.onprogress = (event) => {
        // progress.value = event.loaded * 100 / event.total;
        console.log(`loaded: ${event.loaded}, total: ${event.total}`);
    }
    xhr.onreadystatechange = () => {
        console.log(xhr.readyState);
        if(xhr.readyState === xhr.DONE) {
            progress.value = 100;
        }
    }
    xhr.send();
}