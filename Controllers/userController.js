const jwt = require('jsonwebtoken')
const userModel = require('../Models/userModel');
const { isValidString, isValidObjectId, isValidEmail, isValidImage, isValidMobileNumber, isValidName, isValidpassword } = require('../Validations/validation');
const { uploadImage } = require('../Middlewares/awsConection')
const aws = require('aws-sdk');
const bcrypt = require('bcrypt');

//___________________________________________User Registration_______________________________________________________________
const createUser = async (req, res) => {
    try {
        if (Object.keys(req.body).length == 0) return res.status(400).send({ status: false, message: "please provide information" });//[]
        let { fullname, username, gender, email, phone, password, ...a } = req.body;
        if (Object.keys(a).length != 0) return res.status(400).send({ status: false, message: `please remove ${Object.keys(a)}` })

        if (!isValidString(fullname)) return res.status(400).send({ status: false, message: "fullname is mandatory, and should be in string format" })
        if (!isValidName(fullname)) { return res.status(400).send({ status: false, message: 'fullname should be in Alphabets' }) }

        if (!isValidString(username)) return res.status(400).send({ status: false, message: "username is mandatory, and should be in string format" })
        // if (!isValidName(username)) return res.status(400).send({ status: false, message: 'username should be in Alphabets'})
     
        if (!isValidString(gender)) return res.status(400).send({status:false, message: "Gender is mandatory, and should be in string format"})
        if(!["Male","Female","Other"].includes(gender))return res.status(400).send({status:false, message: "Only Enter Male,female and Other"})

        if (!isValidString(email)) return res.status(400).send({ status: false, message: "email is mandatory, and should be in string format" })
        if (!isValidEmail(email)) return res.status(400).send({ status: false, message: 'Please enter valid emailId' })

        if (!isValidString(phone)) return res.status(400).send({ status: false, message: "phone is mandatory, and should be in string format" })
        if (!isValidMobileNumber(phone)) return res.status(400).send({ status: false, message: 'Please enter valid Mobile Number' })

        if (!isValidString(password)) return res.status(400).send({ status: false, message: "password is mandatory, and should be in string format" })
        if (!isValidpassword(password)) return res.status(400).send({ status: false, message: "To make strong Password Should be use 8 to 15 Characters which including letters, atleast one special character and at least one Number." })
        req.body.password = await bcrypt.hash(password, 12);

        const isDuplicateEmail = await userModel.findOne({ $or: [{ email: email }, { phone: phone }, { username: username }] })
        if (isDuplicateEmail) {
            if (isDuplicateEmail.email == email) { return res.status(400).send({ status: false, message: `This EmailId: ${email} is already exist!` }) }
            if (isDuplicateEmail.phone == phone) { return res.status(400).send({ status: false, message: `This Phone No.: ${phone} is already exist!` }) }
            if (isDuplicateEmail.username == username) { return res.status(400).send({ status: false, message: `This Username: ${username} is already exist!` }) }
        }

        let files = req.files;

        if (files && files.length > 0) {

            if (files.length > 1) return res.status(400).send({ status: false, message: "You can't enter more than one file for Create!" })
            if (!isValidImage(files[0]['originalname'])) { return res.status(400).send({ status: false, message: "You have to put only Image." }) }
            console.log(files[0]);
            let imgUrl = await uploadImage(files[0])
            console.log(imgUrl);
            req.body.profileImage = imgUrl
        }
        else {
            return res.status(400).send({ msg: "Please put image to create registration!" })
        }

        let userCreated = await userModel.create(req.body)
        let { __v, ...userDetails } = userCreated._doc
        return res.status(201).send({ status: true, message: "User created successfully", data: userDetails })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

//___________________________________________User Log-In_______________________________________________________________

const userLogin = async (req, res) => {
    try {
        let { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ status: false, msg: "email and password is required" });

        if (!isValidString(email)) return res.status(400).send({ status: false, message: "Please Enter in String formate E-mail" })
        if (!isValidEmail(email)) { return res.status(400).send({ status: false, message: 'Please enter valid emailId' }) }

        if (!isValidString(password)) return res.status(400).send({ status: false, message: "Please Enter in String formate password" })
        if (!isValidpassword(password)) { return res.status(400).send({ status: false, message: "invalid password" }) }

        const user = await userModel.findOne({ email: email });
        if (!user) return res.status(404).json({ status: false, message: "No account found with that email, please signup" });

        const matchPass = await bcrypt.compare(password, user.password);
        if (!matchPass) return res.status(400).json({ status: false, message: "Password is wrong" });

        const token = jwt.sign(
            { email: user.email, userId: user._id },
            "A18b16h43i10n0a7v",
            { expiresIn: "2h" }
        );
        res.status(200).json({
            status: true, message: "Logged-In Successfully", data: { userId: user._id, token: token }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

//___________________________________________Fetching User Details_______________________________________________________________
const getUser = async (req, res) => {
    try {
        let userId = req.params.userId;
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "invalid userId" })
        //________________________________Authorization_________________________________________________________________________
        if (userId != req.decodedToken) return res.status(403).send({ status: false, message: "unauthorized" })
        //______________________________________________________________________________________________________________________

        let userDetails = await userModel.findOne({ _id: userId }).select({ __v: 0 })
        if (!userDetails) return res.status(404).send({ status: false, message: "user Not found" })

        return res.status(200).send({ status: true, message: "Successfull", data: userDetails })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

//___________________________________________Updating User Details_______________________________________________________________
const updateUser = async (req, res) => {
    try {
        let userId = req.params.userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please Enter the valid UserId" })
        //________________________________Authorization____________________________________________________________________
        if (userId != req.decodedToken) return res.status(403).send({ status: false, message: "unauthorized" })
        //__________________________________________________________________________________________________________________

        let { fullname, username, email, phone, password, ...a } = req.body;
        if (Object.keys(a).length != 0) return res.status(400).send({ status: false, message: `please remove ${Object.keys(a)}` })

        let final = {}

        if (Object.keys(req.body).length == 0) return res.status(400).send({ status: false, message: "Please enter some DETAILS!!!" })

        if (fullname) {
            if (!isValidString(fullname)) return res.status(400).send({ status: false, message: "Please Enter in String formate First-Name" })
            if (!/^[a-zA-Z]{3,15}$/.test(fullname)) return res.status(400).send({ status: false, message: "Please Enter Valid first-Name" })
            final.fullname = fullname
        }

        if (username) {
            if (!isValidString(username)) return res.status(400).send({ status: false, message: "Please Enter in String formate username" })
            // if (!/^[a-zA-Z]{3,15}$/.test(lname)) return res.status(400).send({ status: false, message: "Please Enter Valid username" })
            let isUsernameExist = await userModel.findOne({ username: username })
            if (isUsernameExist) return res.status(400).send({ status: false, message: `This username: ${username} is already exist!` })
            final.username = username
        }

        if (email) {
            if (!isValidString(email)) return res.status(400).send({ status: false, message: "Please Enter in String formate Email" })
            if (!isValidEmail(email)) return res.status(400).send({ status: false, message: "Please Enter valid Email" })
            let isEmailExist = await userModel.findOne({ email: email })
            if (isEmailExist) return res.status(400).send({ status: false, message: `This Email.: ${email} is already exist!` })
            final.email = email
        }

        if (phone) {
            if (!isValidString(phone)) return res.status(400).send({ status: false, message: "Please Enter in String formate phone" })
            if (!isValidMobileNumber(phone)) return res.status(400).send({ status: false, message: "Please Enter valid Phone number" })
            let isPhoneExit = await userModel.findOne({ phone: phone })
            if (isPhoneExit) return res.status(400).send({ status: false, message: `This Phone No.: ${phone} is already exist!` })
            final.phone = phone
        }

        if (password) {
            if (!isValidString(password)) return res.status(400).send({ status: false, message: "Invalid password details" });
            if (!isValidpassword(password)) return res.status(400).send({ status: false, message: "Please put uppercase, lowercase, number, special character and length between 8 to 15" })

            const hashedPassword = await bcrypt.hash(password, 12)
            final.password = hashedPassword
        }

        let profileImages = req.files
        if (profileImages && profileImages.length > 0) {
            let url = await uploadImage(profileImages[0])
            final.profileImage = url
        }

        const updatedUser = await userModel.findOneAndUpdate({ _id: userId }, final, { new: true }).select({ __v: 0 })
        if (!updatedUser) return res.status(404).send({ status: false, message: "User does not exist" })

        return res.status(200).send({ status: true, message: "Successfully Updated", data: updatedUser })

    }
    catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
}

const follow = async (req, res) => {
    // make sure the user exists
    const user = await userModel.findById(req.params.id);

    if (!user) {
        return res.status(404).send({ status: false, message: `No user found for id ${req.params.id}`});
    }

    // make the sure the user is not the logged in user
    if (req.params.id === req.user.id) {
        return res.status(400).send({ status:false, message: "You can't unfollow/follow yourself"});
    }

    // only follow if the user is not following already
    if (user.followers.includes(req.user.id)) {
        return res.status(400).send({ status:false, message: "You are already following him"});
    }

    await userModel.findByIdAndUpdate(req.params.id, {
        $push: { followers: req.user.id },
        $inc: { followersCount: 1 },
    });
    await userModel.findByIdAndUpdate(req.user.id, {
        $push: { following: req.params.id },
        $inc: { followingCount: 1 },
    });

    res.status(200).json({ success: true, data: {} });
}


const unfollow = async (req, res) => {
    const user = await userModel.findById(req.params.id);
  
    if (!user) {
      return res.status(400).send({ status:false, message: `No user found for ID ${req.params.id}`});
    }
  
    // make the sure the user is not the logged in user
    if (req.params.id === req.user.id) {
      return res.status(400).send({ status:false, message: "You can't follow/unfollow yourself"});
    }
  
    await userModel.findByIdAndUpdate(req.params.id, {
      $pull: { followers: req.user.id },
      $inc: { followersCount: -1 },
    });
    await userModel.findByIdAndUpdate(req.user.id, {
      $pull: { following: req.params.id },
      $inc: { followingCount: -1 },
    });
  
    res.status(200).json({ success: true, data: {} });
}
  

module.exports = { createUser, userLogin, getUser, updateUser, follow, unfollow}