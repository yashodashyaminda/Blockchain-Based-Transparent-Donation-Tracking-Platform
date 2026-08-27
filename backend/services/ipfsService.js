const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

/**
 * @desc    Uploads a file buffer or local disk file to decentralized IPFS storage via Pinata API
 * @param   {Object} file - Express Multer file object
 * @returns {Promise<string>} - Returns the unique IPFS hash (CID)
 */
exports.uploadFileToIPFS = async (file) => {
    try {
        const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

        let data = new FormData();

        // Check if file path exists (diskStorage) or use buffer (memoryStorage)
        if (file.path) {
            data.append('file', fs.createReadStream(file.path));
        } else if (file.buffer) {
            data.append('file', file.buffer, { filename: file.originalname });
        } else {
            throw new Error("Invalid file format provided for IPFS upload");
        }

        const res = await axios.post(url, data, {
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            headers: {
                'pinata_api_key': process.env.PINATA_API_KEY,
                'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY,
                ...data.getHeaders()
            }
        });

        // Clean up local temp file if multer saved it to disk
        if (file.path && fs.existsSync(file.path)) {
            try { fs.unlinkSync(file.path); } catch (e) {}
        }

        // Return the unique IPFS hash (CID)
        return res.data.IpfsHash;
    } catch (error) {
        if (file && file.path && fs.existsSync(file.path)) {
            try { fs.unlinkSync(file.path); } catch (e) {}
        }
        console.error('IPFS Upload Error:', error.response?.data || error.message);
        throw new Error('Failed to upload document to decentralized IPFS storage');
    }
};