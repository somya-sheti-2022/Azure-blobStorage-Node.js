
## Azure-BlobStorage-Email-Node.js 

An application with a ***post request*** wherein you can upload a csv file which will be **first stored in server and then uploaded to Azure Blob Storage and link for the file will be sent through email.**

## Prerequisites

1- Basics of **Node.js**\
2- A **_Query String_** to connect to your **Microsoft Azure Blob Storage** 
## Starting off...

1- The first step would be ***creating a directory and initializing new npm Package***

Go to your project folder in terminal using 
```bash
  cd my-project 
```
Initialize a npm package for your folder
```bash
  npm init-y 
```

2- Installation of **required packages** for the project
```bash
  npm i @azure/storage-blob csv-writer express fast-csv multer nodemailer dotenv 
``` 

3- Look at the above folder structure in the repository to understand further steps properly

***4- Following are the files with there use in the project*** 
 
**- index.js**

This file will contain the basic of your application as shown below

```javascript
const express=require('express');

const app=express();
const uploadRoutes=require('./routes/upload')
const PORT=3000||process.env.PORT;

app.use('/api/upload',uploadRoutes);

app.listen(PORT,()=>{
    console.log(`Server running at PORT Number: ${PORT}`)
})

```

**- routes/upload.js** 

These is the file which have our main post request and is used by **index.js**

```javascript
const express=require('express');
const router=express.Router();

const {upload}=require('../middlewares/uploadFile')
const uploadController=require('../controllers/uploadController')

router.post('/csv-file',upload.single('file'),uploadController.save)

module.exports=router;

```

**- middlewares/uploadFile.js**

These is the file using multer as middleware for uploading CSV file and is used in **routes/upload.js**.

```javascript
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
```

**-controllers/uploadController**

This file is used as a controller by our **routes/upload.js** and has the main code to uplaod file to ***Azure Blob Storage*** and ***Send mail to user***.

***save function*** is used to parse the csv file and store in Server\
***uploadAndSendMail*** is the main part to upload file and send email to user
```javascript
const csv=require('fast-csv');
const fs=require('fs');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const {BlobServiceClient, StorageSharedKeyCredential} = require('@azure/storage-blob');
const nodemailer=require('nodemailer')
require('dotenv').config();
const accountName=process.env.AZURE_STORAGE_NAME;
const accountKey=process.env.AZURE_STORAGE_KEY;
const containerName=process.env.AZURE_CONTAINER_NAME

//Main function to upload and send mail

const uploadAndSendMail=async(data,email)=>{
    console.log("Saving file to blob storage");
    const filename = `${Date.now()}myupload.csv`;
    console.log(`File name => ${filename}`);
    let fileHeaders = []
    for (let key in data[0]) {
        fileHeaders.push({ id: key, title: key })
    }
    const csvStringifier = createCsvStringifier({
        header: fileHeaders
    });
    const csvData = csvStringifier.stringifyRecords(data);
    const headers = csvStringifier.getHeaderString();
    const blobData = `${headers}${csvData}`;
    const credentials = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, credentials);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    const options = {
        blobHTTPHeaders: {
            blobContentType: 'text/csv'
        }
    };    
    blockBlobClient.uploadData(Buffer.from(blobData), options)
    .then((result) => {
        console.log('blob uploaded successfully!');
        console.log(JSON.stringify(result));
    })
    .catch((error) => {
        console.log('failed to upload blob');
        console.log(error);
    });

    var mail=nodemailer.createTransport({
        host:'smtp.gmail.com',
        port:587,
        secure:false,
        auth:{
            user:process.env.EMAIL,
            pass:process.env.PASSWORD
        }
    })
    var mailOptions=({
        from:process.env.EMAIL, // sender address
        to: email, // list of receivers
        subject: "Link of uploaded file", // Subject line
        text: "The Link for the uploaded file is", // plain text body
        html: `<a href='https://${accountname}.blob.core.windows.net/${containerName}/${filename}'>Click here</a> to view your uploaded file`, // html body
    })
    mail.sendMail(mailOptions,(err,info)=>{
        if(err){
            console.log("Mail wasnt send successfully")
            console.log(err)
        }else{
            console.log("Mail sent successfully")
        }
    })
}

//reads the uploaded file and send for uploading to function
const save=async(req,res)=>{
    try{    
        if (req.file == undefined) {
            return res.status(400).send("Please upload a CSV file!");
        }  
        let filePath='./'+req.file.filename;
        let csvData=[];
        fs.createReadStream(filePath)
        .pipe(csv.parse({headers:true}))
        .on("error",(error)=>{
            throw error.message
        })
        .on("data",(row)=>{
            csvData.push(row)
        })
        .on("end",()=>{
            uploadAndSendMail(csvData,req.query.email)
            res.send({message:"Modifications done successfully"})
        });
    }
    catch(error){
        logger.error(err);
        res.status(400).send({
            message: "Could not upload the file: " + req.file.filename,
        });
    }
    
}

module.exports =  {
    save,
}
```


## Final Discussion

Now, Since you have went through the code in the files lets discuss ***some important points in this section*** 
 
You should have following keys and values in your **.env** file

#### ENVIORNMENT VARIABLES

`AZURE_STORAGE_NAME` = (Name of the storage in your Azure Portal)

`AZURE_STORAGE_KEY` = (Primary Key of your Storage)

`AZURE_CONTAINER_NAME` = (Particular Container to which file is supposed to be uplaod)

`EMAIL` = (Email Address of the Sender)

`PASSWORD` = (Password for email of the sender)





### API Reference

***Our final API Endpoint looks like this***

#### Uploading File and Sending Email

```http
  POST /api/upload/csv-file
```

| Query Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `email` | `string` | **Required**. Email of person sending the post request |

**Example API Endpoint:** ```http://localhost:3000/api/upload/csv-file?email=xyz@gmail.com```

### Coming to the end

Hoping that this was a useful one and you have learnt something new today we come to the end💯	💯	



