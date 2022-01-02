const cloudinary = require("cloudinary");
const dotenv = require("dotenv");

dotenv.config();

cloudinary.v2.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.uploads = async (file, folder) => {
	const uploadedImageData = await cloudinary.v2.uploader.upload(file, { resource_type: "auto", folder: folder }, (error, result) => {
		if (error) console.log(error);
		return result;
	});
	// console.log(uploadedImageData);
	return uploadedImageData;
}