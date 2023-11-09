const express = require('express')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const jwt = require('jsonwebtoken');
const app = express()
const cookieParser = require('cookie-parser')
const port = 3000

// middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'https://job2324-7cf51.web.app', 'https://job2324-7cf51.firebaseapp.com'],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

// custom middlewares
const logger = (req, res, next) => {
  next()
}
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: 'unauthorized' });
  }
  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    // if err
    if (err) {
      return res.status(401).send({ message: 'unauthorized' })
    }
    // if token is valid
    req.user = decoded
    next()
  })
}


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
    // await client.connect();
    // Get the database and collection on which to run the operation
    const database = client.db('job_DB');
    const jobCollection = database.collection('all_jobs');
    const applicationCollection = database.collection('all_applications');



    // json web token
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '1hr' })
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
        .send({ success: true })
      // token coming and deleting
    })
    // app.post('/logout', async (req, res) => {
    //   const user = req.body;
    //   // console.log('hitting log out',user)
    //   res.clearCookie('token', { maxAge: 0 }).send({ success: true })
    // })

    // Logout
    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('logging out', user);
      res
        .clearCookie('token', { maxAge: 0, sameSite: 'none', secure: true })
        .send({ success: true })
    })

    // Get all jobs
    app.get('/all_jobs', async (req, res) => {
      // if(req.user.email!==req.query.email){
      //   return res.status(403).send({message:'forbidden access'})
      // }
      const query = {}
      if (req.query.job_title) {
        query.job_title = req.query.job_title;
      }
      if (req.query.email) {
        query.email = req.query.email;
      }
      if (req.query.job_category) {
        query.job_category = req.query.job_category;
      }
      const result = await jobCollection.find(query).toArray()
      res.send(result)
    })

    // My job Private
    app.get('/my_jobs', verifyToken, async (req, res) => {
      if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      console.log('my job server hitted', req.query.email)
      const query = {}
      if (req.query.email) {
        query.email = req.query.email
      }
      const result = await jobCollection.find(query).toArray()
      res.send(result)
    })

    // Get all jobs for public
    app.get('/all_jobs_public', async (req, res) => {
      const result = await jobCollection.find().toArray()
      res.send(result)
    })

    // Post in all jobs
    app.post('/all_jobs', async (req, res) => {
      const newJob = req.body;
      const result = await jobCollection.insertOne(newJob);
      res.send(result)
    })

    // Get a single job data
    app.get('/all_jobs/:id', async (req, res) => {
      const id = req.params.id;
      const result = await jobCollection.findOne({ _id: new ObjectId(id) })
      res.send(result);


    })

    // Delete a single job by id
    app.delete('/all_jobs/:id', async (req, res) => {
      const id = req.params.id;
      const result = await jobCollection.deleteOne({ _id: new ObjectId(id) })
      res.send(result);
    })

    // Update a single job by id
    app.put('/all_jobs/:id', async (req, res) => {
      const id = req.params.id;
      const updatedJob = req.body;
      const doc = {
        $set: {
          name: updatedJob.name,
          job_banner: updatedJob.job_banner,
          job_applicants_number: updatedJob.job_applicants_number,
          description: updatedJob.description,
          job_category: updatedJob.job_category,
          job_posting_date: updatedJob.job_posting_date,
          application_deadline: updatedJob.application_deadline,
          salary_range: updatedJob.salary_range,
          job_title: updatedJob.job_title,
        }
      }
      const result = await jobCollection.updateOne({ _id: new ObjectId(id) }, doc, { upsert: true });
      res.send(result);
    })

    // Post in All application
    app.post('/all_applications', async (req, res) => {

      if (req.query.jobId) {
        await jobCollection.updateOne(
          { _id: new ObjectId(req.query.jobId) },
          { $inc: { job_applicants_number: 1 } }
        )
      }
      const application = req.body;
      const result = await applicationCollection.insertOne(application);
      res.send(result);
    })

    // Get All application by email with query params
    app.get('/all_applications', verifyToken, async (req, res) => {
      if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const query = {}
      if (req.query.email) {
        query.email = req.query.email;
      };
      if (req.query.category) {
        query.job_category = req.query.category;
      }
      const result = await applicationCollection.find(query).toArray()
      res.send(result)
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