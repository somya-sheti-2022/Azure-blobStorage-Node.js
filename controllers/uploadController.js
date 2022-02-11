const csv=require('fast-csv');
const fs=require('fs');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const {BlobServiceClient, StorageSharedKeyCredential} = require('@azure/storage-blob');
const nodemailer=require('nodemailer')
require('dotenv').config();
const accountName=process.env.AZURE_STORAGE_NAME;
const accountKey=process.env.AZURE_STORAGE_KEY;
const containerName=process.env.AZURE_CONTAINER_NAME

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