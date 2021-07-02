/** * 用户信息 */
var path = require("path");
const fileName = path.basename(__filename).split('.')[0];

var mongoose = require('./db.js'), Schema = mongoose.Schema;
var Sch = new Schema({
    patientName:{type:String,required:true},
    patientId:{type:String},
    clinic:{type:String},
    role:{type:String},
    memo:{type:String},
    detail:{
        patinfo: {type:Object},
        shift: {type:Object}
    },
});
module.exports = mongoose.model(fileName,Sch);
