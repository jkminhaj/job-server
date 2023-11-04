const express = require('express')
require('dotenv').config()
const cors = require('cors')
const app = express()
const port = 3000

// middlewares
app.use(cors())
app.use(express.json())


app.get('/', (req, res) => {
  res.send('Job server working fine')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})