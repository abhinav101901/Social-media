const aws = require('aws-sdk');
aws.config.update({
    accessKeyId: "AKIAY3L35MCRZNIRGT6N",
    secretAccessKey: "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",
    region:"ap-south-1"
});

const uploadImage = async (file) => {

    return new Promise(function (resolve, reject) {
        const s3 = new aws.S3({ apiVersion: "2006-03-01" })
        const uploadParams = {
            ACL: 'public-read',
            Bucket: "classroom-training-bucket",
            Key: 'userProfileImage' + file.originalname,
            Body: file.buffer
        }
        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject(err.message);
            } return resolve(data.Location);
        });
    });
};

module.exports.uploadImage=uploadImage