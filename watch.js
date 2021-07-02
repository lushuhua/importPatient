var fs = require("fs");
var MongoClient = require('mongodb').MongoClient;
var dicomParser = require('dicom-parser');
var url = "mongodb://localhost:27017/curie"; // 本地数据库地址
var path = require('path');
var Model = require('./Patient');
// var filePath ='Z:/';
var filePath = "F:/patients";
var pixels;
//读取dicom文件
function readDCM(byteArray, id, dcmPath, cbctPath, numSlices) {
  var dataSet = dicomParser.parseDicom(byteArray);
  let patientName = dataSet.string('x00100010');
  //  var patientId = dataSet.string('x00100020');
  var type = dataSet.string('x00080060');
  var createTime = dataSet.string('x00080030');
  var idPatients = parseInt(dataSet.string('x00100020'));
  var sex =dataSet.string('x00100040');
  var age = parseInt(dataSet.string('x00101010'));
  var rows = dataSet.uint16('x00280010');
  var columns = dataSet.uint16('x00280011');
  var windowCenter = parseInt(dataSet.string('x00281050'));
  var windowWidth = parseInt(dataSet.string('x00281051'));
  var pixelDataElement = dataSet.elements.x7fe00010;
  pixels = new Uint8Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset, pixelDataElement.length);
  var spacing = "0.97,0.97,2.5"
  var patientId = id;
  var typeCBCT = 'cbct';
  var levelDicom = 0;
  var levelCBCT = 1;
  var name = 'ct-1'
  var patientsCBCTPath = { patientName, createTime, patientId, pid: patientName, path: cbctPath, name: name, numSlices, type: typeCBCT, spacing, level: levelCBCT };
  var patientsPath = {
    patientName,
    createTime,
    patientId,
    children: {
      name
    },
    age,
    type,
    sex,
    idPatients,
    level: levelDicom,
    path: path.join(dcmPath, '..'),
  }
  writeCBCT(patientsCBCTPath);//filepath表的cbct信息
  // var patientsPath = { patientName, type, createTime, patientId, path };  
  //  writePath(patientsPath); //filepath表的ct信息
  //  patientsPathList.push(patientsPath)
  //  writePatient(patientsPath);
};
let fsWait = false;
let arrFiles = load(filePath);
function load(filePath) {
  var list = [];
  const files = fs.readdirSync(filePath);//读取到path目录下的所有病人文件信息  
  files.forEach(item => {
    let rawPath = filePath + '/' + item;
    let obj = {};
    obj.name = item;
    obj.rawPath = filePath + '/' + item + '/data_dcm.raw';
    obj.children = [];
    let files2 = fs.readdirSync(filePath + '/' + item + '/image');
    files2.forEach(item1 => {
      var child = {};
      // obj.children = [];
      child.name = item1;
      let childStats = fs.readdirSync(filePath + '/' + item + '/image/' + item1);
      obj.numSlices = childStats.length - 1;
      // console.log(obj.numSlices);
      child.dcm = filePath + '/' + item + '/image/' + item1 + '/' + childStats[0]; //dicom路径
      obj.children.push(child);
    });
    list.push(obj);
    let dicomPath = filePath + '/' + item + '/image' + '/' + files2;
    // console.log(dicomPath);
    // fileDisplay(dicomPath, rawPath);
    //         if (stat.isDirectory()) {
    //             obj.name = item;
    //             obj.children = [];
    //             list.push(obj);
    //             load(filePath + '/' + item, list[index].children);            
    //         } else {
    //             let reg = /^.*\.dcm$/;
    //             if (reg.test(item)) {
    //                 obj.dim = filePath + '/' + item;
    //                 list.push(obj);            }
    //         }
  })
  // console.log(list);
  return list;

}
function fileDisplay(filesPath, rawPath) {
  let dicomList = fs.readdirSync(filesPath);
  var fileList = [];
  dicomList.forEach(filename => {
    let filedir = path.join(filesPath, filename);
    let stat = fs.statSync(filedir);
    let isFile = stat.isFile();
    let isDir = stat.isDirectory();
    var reg = /\.dcm$/;
    if (isFile && reg.test(filedir)) {
      fileList.push(filedir);
      // return fileList
    }
    if (isDir) {
      fileDisplay(filedir);
    }

  })
  // console.log(fileList.length);
  for (var i = 0; i < fileList.length; i++) {
    const bufferData = fs.readFileSync(fileList[i]);
    readDCM(bufferData);
    // fs.writeFile(`${rawPath}/data_dcm.raw`, pixels, {flag: 'a'},  (err) => {
    //   if (err) {
    //       console.log("err");
    //   }else {
    //       // console.log("okk"); 
    //   }
    // });
  }
}
arrFiles.forEach(async item => {
  var path = item.rawPath;
  // console.log(item);
  var dcmPath = item.children[0].dcm;
  // console.log(dcmPath)
  var obj = {
    patientName: item.name
  }
  var patient = await Model.find({ patientName: item.name }).exec();
  if (patient.length === 0) {
    // await writePatient(obj);
  }
  let data = fs.readFileSync(dcmPath);
  readDCM(data, patient[0]._id, dcmPath, path, item.numSlices);
});

//把病人信息写进数据库
function writePatient(myobj) {
  MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db("curie");
    dbo.collection("patients").insertOne(myobj, function (err, res) {
      if (err) throw err;
      console.log("病人信息文档插入成功");
      db.close();
    });
  });
};
//把CBCT信息写进数据库
function writeCBCT(myobj) {
  MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db("curie");
    dbo.collection("filepaths").insertOne(myobj, function (err, res) {
      if (err) throw err;
      console.log("CBCT文档插入成功");
      db.close();
    });
  });
}
//把病人信息写进数据库
function writePath(myobj) {
  MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, db) {
    if (err) throw err;
    var dbo = db.db("curie");
    dbo.collection("filepaths").insertOne(myobj, function (err, res) {
      if (err) throw err;
      console.log("病人路径文档插入成功");
      db.close();
    });
  });
}
fs.watch(filePath, (event, filename) => {
  //监听文件夹如果发生改变
  if (filename && event === 'change') {
    if (fsWait) return;
    fsWait = setTimeout(() => {
      fsWait = false;
    }, 100);
    console.log(`${filename} file Changed`);
  };
  if (filename && event === 'rename') {
    if (fsWait) return;
    fsWait = setTimeout(() => {
      fsWait = false;
    }, 100);
    console.log(`${filename} file rename`);
  };
  if (filename && event === 'filename ') {
    if (fsWait) return;
    fsWait = setTimeout(() => {
      fsWait = false;
    }, 100);
    console.log(`${filename} file filename `);
  }
});