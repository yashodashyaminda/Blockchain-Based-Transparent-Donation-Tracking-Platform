// backend/middleware/multerMiddleware.js
const multer = require('multer');

// Configure storage for temporary file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './'); // Temporary local root or a temp folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB
});

module.exports = upload;