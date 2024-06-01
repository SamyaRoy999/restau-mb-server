const express = require('express');
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();


// middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vmk1mwc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const collectionBistro = client.db('bostroDB').collection('menu')
    const collectionCarts = client.db('bostroDB').collection('carts')
    const collectionUsers = client.db('bostroDB').collection('users')


    // jwt releted api 
    app.post("/jwt", async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ token })
    })


    // auth releted api

    app.post('/user', async (req, res) => {
      const body = req.body
      const quary = { email: body.email }
      const existingUser = await collectionUsers.findOne(quary)

      if (existingUser) {
        return res.send({ massages: 'user already exist', insertedID: null })
      }

      const result = await collectionUsers.insertOne(body)
      res.send(result)

    })

    // midelwera
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'forbidden access' })
      }
      // next()
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ massages: 'forbidden access' })
        }
        req.decoded = decoded
        next()
      })
    }

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email
      const quary = { email: email }
      const user = await collectionUsers.findOne(quary)
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ massages: 'forbidden access' })
      }
      next()
    }
    // midelwera


    app.get('/user', verifyToken, verifyAdmin, async (req, res) => {
      // console.log(req.headers);
      const result = await collectionUsers.find().toArray()
      res.send(result)
    })

    app.get('/user/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email
      if (email !== req.decoded.email) {
        return res.status(403).send({ massages: 'unAuthorized token' })
      }
      const quary = { email: email }
      const result = await collectionUsers.findOne(quary)
      let admin = false
      if (result) {
        admin = result?.role === 'admin'
      }
      res.send({ admin })
    })


    app.delete('/user/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id
      const quary = { _id: new ObjectId(id) }
      const result = await collectionUsers.deleteOne(quary)
      res.send(result)
    })

    app.patch('/user/admin/:id', verifyToken, verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) }
        const updataDoc = {
          $set: {
            role: "admin"
          }
        }
        const result = await collectionUsers.updateOne(filter, updataDoc)
        res.send(result)
      })


    // data releted api

    app.get('/menu', async (req, res) => {
      const result = await collectionBistro.find().toArray()
      res.send(result)
    })

    app.post('/menu', async (req, res) => {
      const item = req.body
      const result = await collectionBistro.insertOne(item)
      res.send(result)
    })

    app.delete('/menu/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id
      const quary = { _id: new ObjectId(id) }
      const result = await collectionBistro.deleteOne(quary);
      res.send(result)
    })

    app.post("/carts", async (req, res) => {
      const cardItem = req.body;
      const result = await collectionCarts.insertOne(cardItem);
      res.send(result);
    })

    app.get("/carts", async (req, res) => {
      const email = req.query.email
      const quary = { email: email }
      const result = await collectionCarts.find(quary).toArray()
      res.send(result)
    })

    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id
      const user = { _id: new ObjectId(id) }
      const result = await collectionCarts.deleteOne(user)
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send("HELLO COSTOMERS WELCOME TO OUR RESTAU")
})

app.listen(port, () => {
  console.log(`HELLO COSTOMERS... ${port} `);
})
