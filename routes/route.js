const router = require('express').Router();


//........................USER API's.............................................
router.post('/register', createUser);


router.all('/*', (req,res)=> res.status(400).send({status:false,message:"invalid request"}))

module.exports = router;




