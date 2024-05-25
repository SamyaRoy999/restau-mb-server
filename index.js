const express = require('express');
const app = express()
const cors = require('cors');
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

    app.get('/menu',async (req, res)=>{
        const result = await collectionBistro.find().toArray()
        res.send(result)
    })

    app.post("/carts", async(req, res)=>{
      const cardItem = req.body;
      const result = await collectionCarts.insertOne(cardItem);
      res.send(result);
    })

    app.get("/carts",async (req ,res)=>{
      const email = req.query.email
      const quary = {email: email}
      const result = await collectionCarts.find(quary).toArray()
      res.send(result)
    })

    app.delete('/carts/:id', async (req, res)=> {
      const id = req.params.id
      const quary = {_id: new ObjectId(id)}
      const result = await collectionCarts.deleteOne(quary)
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


app.get('/', (req, res)=>{
    res.send("HELLO COSTOMERS WELCOME TO OUR RESTAU")
})

app.listen(port ,()=>{
    console.log(`HELLO COSTOMERS... ${port} `);
})
