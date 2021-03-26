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
        const client = new MongoClient(uri);
        try {
                await client.connect();
                const teams = await client.db("rti_db").collection("teams");
                res.send(await teams.find({}).toArray());
        } finally {
                await client.close();
        }
});
module.exports = router;
