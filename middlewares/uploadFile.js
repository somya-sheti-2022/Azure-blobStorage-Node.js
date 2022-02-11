const multer=require('multer')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './')
    },
    filename: (req, file, cb)=> {
      cb(null,`${file.originalname}`)
    }
})

const csvFilter=(req,file,cb)=>{
    if(file.mimetype.includes("csv")){
        cb(null,true)
    }else{
        cb("Please upload CSV file Only",false)
    }
}
const upload = multer({ storage: storage,fileFilter: csvFilter })

module.exports={
    upload,
}