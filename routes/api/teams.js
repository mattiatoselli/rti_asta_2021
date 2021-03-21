const express = require("express");
const mongodb = require("mongodb");
const axios = require('axios');
const router = express.Router();
var ObjectId = require('mongodb').ObjectId;
const teamsNames = ["Racing Team Italia", "Volanti ITR", "MySubito Casa", "A24", "Scuderia Prandelli", "Virtual Racing", "3DRAP", "Rookies"];

//list team infos
router.get("/", async (req,res)=>{
        const teams = await loadTeamsCollection();
        res.send(await teams.find({}).toArray());
});



async function loadTeamsCollection() {
    const client = await mongodb.MongoClient.connect("mongodb+srv://rti_user:rti@astaRti2021.dbx5j.mongodb.net/rti_db?retryWrites=true&w=majority",
        { useNewUrlParser: true },
        { useUnifiedTopology: true }
    );
    return client.db("rti_db").collection("teams");
}
module.exports = router;