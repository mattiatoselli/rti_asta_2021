const express = require("express");
const mongodb = require("mongodb");
const { MongoClient } = require("mongodb");
const axios = require('axios');
const router = express.Router();
var ObjectId = require('mongodb').ObjectId;
const teamsNames = ["Racing Team Italia", "Volanti ITR", "MySubito Casa", "A24", "Scuderia Prandelli", "Virtual Racing", "3DRAP", "Rookies"];

//list team infos
router.get("/", async (req,res)=>{
        const uri = "mongodb+srv://rti_user:rti@astaRti2021.dbx5j.mongodb.net/rti_db?retryWrites=true&w=majority";
        // Create a new MongoClient
        const client = new MongoClient(uri);
        try {
                // Connect the client to the server
                await client.connect();
                // Establish and verify connection
                const teams = await client.db("rti_db").collection("teams");
                res.send(await teams.find({}).toArray());
                //console.log("Connected successfully to server");
        } finally {
                // Ensures that the client will close when you finish/error
                await client.close();
        }
       // const teams = await loadTeamsCollection();
       // res.send(await teams.find({}).toArray());
});



async function loadTeamsCollection() {
    const client = await mongodb.MongoClient.connect("mongodb+srv://rti_user:rti@astaRti2021.dbx5j.mongodb.net/rti_db?retryWrites=true&w=majority",
        { useNewUrlParser: true },
        { useUnifiedTopology: true }
    );
    return client.db("rti_db").collection("teams");
}
module.exports = router;
