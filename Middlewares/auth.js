const jwt = require('jsonwebtoken')
const ObjectId = require('mongoose').Types.ObjectId

exports.authentication = async function(req,res,next){
    
    let token=req.headers['x-api-key']
    if(!token) return res.status(401).send({status:false,message:"not getting token"})
    jwt.verify(token,"A18b16h43i10n0a7v",function(err,decodedToken){
        if(err) return res.status(401).send({status:false,message:"token expired"})
        else{
            req.userId= decodedToken.userId
            next()
        }
    })
}