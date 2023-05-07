const express = require('express')
const mongoose = require('mongoose');
const route = require('./routes/route')
const multer=require("multer")
const app = express()
mongoose.set({strictQuery:true})

app.use(express.json())

app.use(multer().any())

mongoose.connect("mongodb+srv://abhinav:abhi123@cluster0.qicwtqo.mongodb.net/socalMedia",
{dbName:"socalMedia"},
{useNewUrlParser:true})
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))

app.use('/', route)

app.listen(3000, function() {
    console.log('Express app running on port' +  3000)
});