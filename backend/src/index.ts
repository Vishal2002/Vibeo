import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import {router} from './router/router';
dotenv.config();
const app = express();

const port=process.env.PORT
app.use(cors());
app.use(express.json( {limit: '50mb'}));
app.use(express.urlencoded({ extended: true,limit: '50mb' }));
app.use('/api/v1',router);



const server = app.listen(port, () => {
    console.log(`Server Running on port ${port}`);
  });
  server.timeout = 300000;