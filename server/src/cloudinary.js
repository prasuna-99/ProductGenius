// Cloudinary setup + buffer upload helper.
// Seller flow: browser compresses photo -> POST multipart to /api/uploads/image
// -> server streams bytes to Cloudinary -> permanent https URL back.
const cloudinary = require('cloudinary').v2;

const configured =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function uploadBuffer(buffer, { folder = 'productgenius', publicId } = {}) {
  if (!configured) {
    throw Object.assign(new Error('Cloudinary not configured (set CLOUDINARY_* in .env)'), { status: 503 });
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

module.exports = { cloudinary, configured, uploadBuffer };
