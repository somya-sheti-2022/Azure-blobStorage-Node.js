const express=require('express');
const router=express.Router();

const {upload}=require('../middlewares/uploadFile')
const uploadController=require('../controllers/uploadController')

router.post('/csv-file',upload.single('file'),uploadController.save)

module.exports=router;