const express=require('express');

const app=express();
const uploadRoutes=require('./routes/upload')
const PORT=3000||process.env.PORT;

app.use('/api/upload',uploadRoutes);

app.listen(PORT,()=>{
    console.log(`Server running at PORT Number: ${PORT}`)
})

