var fs = require("fs");
var dicomParser = require('dicom-parser');
var path = require('path');
// var Model = require('./Patient');
var filePath = 'F:/patients/FU PEI LIN@20090702/image';
// var filePath="F:/patients"
var fileList = [];
var pixelDataList = [];
var pixelsArray = [];
var arrbuffer = [];
var pixels;
fileDisplay(filePath);
getBuffer();

function readDCM(byteArray) {
    var dataSet = dicomParser.parseDicom(byteArray);
    var pixelDataElement = dataSet.elements.x7fe00010;
    console.log(pixelDataElement.length)
    pixels = new Uint8Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset, pixelDataElement.length);
    console.log("=======",pixels);
    // arrbuffer.push(pixels);
}
// 遍历fileList，读取文件
function getBuffer() {
    console.log("pixels======",pixels);
    console.log(fileList)
    fileList.forEach(file => {
        const bufferData = fs.readFileSync(file);
        console.log(bufferData);
        readDCM(bufferData);
        console.log(pixels);
        // arrbuffer.push(bufferData);
        //var arrbuffer = new Uint8Array(bufferData)
        
        // pixelsArray.push(bufferData)
        // fs.writeFile('data.raw', pixels, {flag: 'a+'}, (err) => {
        //     if (err) {
        //         console.log("err");
        //     }else {
        //         console.log("okk");
        //     }
        //   });
    })
    // console.log(arrbuffer);

    // var buffer = Buffer.concat(arrbuffer);
  
}

function fileDisplay(filePath) {
    //根据文件路径读取文件，返回文件列表
    let files = fs.readdirSync(filePath);
    console.log(files);
    // for (var i = 0; i < 10 && i < files.length; i++) {
        files.forEach(filename => {
        // let filename = files[i];
        let filedir = path.join(filePath, filename);
        let stat = fs.statSync(filedir);
        let isFile = stat.isFile();
        let isDir = stat.isDirectory();
        var reg = /\.dcm$/;
        if (isFile && reg.test(filedir)) {
            fileList.push(filedir);
        }
        if (isDir) {
            fileDisplay(filedir);
        }
    // }
    })
}



