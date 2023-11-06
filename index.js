const express = require('express')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const app = express()
const port = 3000

// middlewares
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.szfaclu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    console.log('hi')
    // Get the database and collection on which to run the operation
    const database = client.db('job_DB');
    const jobCollection = database.collection('all_jobs');


    // Get all jobs
    app.get('/all_jobs', async (req, res) => {
      const query = {}
      if(req.query.job_title){
        query.job_title = req.query.job_title;
      }
      if(req.query.job_category){
        query.job_category = req.query.job_category;
      }
      const result = await jobCollection.find(query).toArray()
      res.send(result)
    })

    // Get a single job data
    app.get('/all_jobs/:id',async(req,res)=>{
      const id = req.params.id ;
      const result = await jobCollection.findOne({_id: new ObjectId(id)})
      res.send(result);


    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Job server working fine')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})