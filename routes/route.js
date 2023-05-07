const router = require('express').Router();
const { createUser, userLogin, getUser, updateUser, follow, unfollow} = require('../Controllers/userController')
const { getPosts,getPost,deletePost,addPost,toggleLike,addComment,deleteComment,searchPost} = require('../Controllers/postController')
const {authentication} =require('../Middlewares/auth')
//........................USER API's.............................................
router.post('/register', createUser);
router.post('/logIn', userLogin)
router.get('/getUser',getUser)
router.put('/updateUser',updateUser)
router.get("/:id/follow", follow);
router.get("/:id/unfollow", unfollow);

//...............Post API,s.............................................

router.get("/getPost",getPosts)
router.post("/createPost",authentication, addPost);
router.get("/search",searchPost);
router.get("/:id",authentication, getPost)
router.delete('/delete/:id',authentication, deletePost);
router.get("/togglelike/:id",authentication, toggleLike);
router.post("/:id/comments",authentication, addComment);
router.delete("/:id/comments/:commentId",authentication, deleteComment);

router.all('/*', (req,res)=> res.status(400).send({status:false,message:"invalid request"}))

module.exports = router;




