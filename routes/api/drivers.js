const express = require("express");
const mongodb = require("mongodb");
const { MongoClient } = require("mongodb");
const axios = require('axios');
const router = express.Router();
var ObjectId = require('mongodb').ObjectId;
const teamsNames = ["Racing Team Italia", "Volanti ITR", "MySubito Casa", "A24", "Scuderia Prandelli", "Virtual Racing", "3DRAP", "Rookies"];

//list drivers
router.get("/", async (req,res)=>{
    const uri = "mongodb+srv://rti_user:rti@astaRti2021.dbx5j.mongodb.net/rti_db?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const drivers = await client.db("rti_db").collection("drivers");
        res.status(200).send(await drivers.find({}).toArray());
    } finally {
        await client.close();
    }
});

//select all drivers currently on sale
router.get("/onsale", async (req,res)=>{
    const uri = "mongodb+srv://rti_user:rti@astaRti2021.dbx5j.mongodb.net/rti_db?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const drivers =  await client.db("rti_db").collection("drivers");
        res.send(await drivers.find({isOnSale: true}).toArray());
    } finally {
        await client.close();
    }
});

//select drivers by team name
router.get("/byteam/:team", async(req,res)=>{
    if(!teamsNames.includes(req.params.team)){
        res.status(400).send({message : "This team is not available, provide a name in this list: " +teamsNames});
        return null;
    }
    const uri = "mongodb+srv://rti_user:rti@astaRti2021.dbx5j.mongodb.net/rti_db?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const drivers =  await client.db("rti_db").collection("drivers");
        res.send(await drivers.find({team: req.params.team}).sort({name: 1}).toArray());
    }
    finally {
        await client.close();
    }
});

//select single driver by his id
router.get("/:id", async (req,res)=>{
    const uri = "mongodb+srv://rti_user:rti@astaRti2021.dbx5j.mongodb.net/rti_db?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const drivers =  await client.db("rti_db").collection("drivers");
        var selectedDriver = await drivers.findOne({_id:ObjectId(req.params.id)});
        if(selectedDriver.length == 0 ) {
            res.status(404);
            return null;
        }
        res.status(200).send(selectedDriver);
    } catch(err) {
        res.status(500).send({error : err.message});
    } finally {
        await client.close();
    }
});

//create driver
router.post("/", async(req, res)=>{
    try{
        //let us validate the request, if wrong return bad request status
        //with a suitable error parameter for front end developers
        if(req.body.name == "" || req.body.name == null || req.body.name == undefined){
            res.status(400).send({message : "Please provide a name parameter for the driver"});
            return null;
        }
        if(req.body.team == null || req.body.team == "" || req.body.team == undefined){
            res.status(400).send({message : "Please provide a team parameter for the driver"});
            return null;
        } 
        if(!teamsNames.includes(req.body.team)){
            res.status(400).send({message : "This team is not available, provide a name in this list: " +teamsNames});
            return null;
        }
        if(req.body.price === null || req.body.price === "" || req.body.price === undefined){
            res.status(400).send({message : "Provide a base price for the driver, if he is not on sale, set 0 as price parameter."});
            return null;
        }
        if(req.body.price < 0){
            res.status(400).send({message : "Provide a price over or equal to 0 credits for a driver"});
            return null;
        } 
        if(req.body.price === 0 && req.body.isOnSale){
            res.status(400).send({message : "Drivers on sale cannot be for free."});
            return null;
        }
        if(req.body.price > 0 && !req.body.isOnSale){
            res.status(400).send({message : "If a driver has a price he must be on sale."});
            return null;
        }
    } catch(err) {
        res.status(500).send({error : err.message});
        return null;
    }
    //parameters validated
    //get connection now
    //now the last check for the database integrity: does this driver already exists? should be unique.
    const uri = "mongodb+srv://rti_user:rti@astaRti2021.dbx5j.mongodb.net/rti_db?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const drivers =  await client.db("rti_db").collection("drivers");
        //find driver by provided name
        var selectedDriver = await drivers.findOne({name: req.body.name});
        if(selectedDriver !== null){
            res.status(400).send({message : "Driver name is already taken. Must be unique."});
            return null;
        }
        //unique, well, keep going with the db operations
        await drivers.insertOne({
            name : req.body.name,
            team: req.body.team,
            price : req.body.price,
            isOnSale : req.body.isOnSale
        });
        res.status(201).send();
    } finally {
        await client.close();
    }
});






//actually we do not need to really update some drivers params or delete them here
//update driver actually this api only set a driver's new team and removes him from sell when the transaction is done
/*router.put("/:id", async(req,res)=>{
    try {
        const drivers = await loadDriversCollection();
        //driver validation for update, did you provided an id?
        if(req.params.id === null || req.params.id == "" || req.params.id == undefined) res.status(400).send({message : "Provide a driver id"});
        //sounds you did, now, does this driver actually exists? if not, return 404
        var selectedDriver = await drivers.findOne({_id:ObjectId(req.params.id)});
        if(selectedDriver === null) res.status(404).send({message : "No driver with this id found in the database"});
        //now the proper request validation, since we must only change his team, this API only checks that and you can only change this parameter
        if(!teamsNames.includes(req.body.team)) res.status(400).send({message : "This team is not available, provide a name in this list: " +teamsNames});
        //data integrity checks: are you trying to buy a driver which was not on sale?
        if(selectedDriver.isOnSale === false) res.status(403).send({message : "Selling drivers who are not on sale is forbidden"});
        var newDriverData = {
            name : selectedDriver.name,
            team: req.body.team,
            price : selectedDriver.price,
            isOnSale : false
        };
        await drivers.updateOne({_id: ObjectId(req.params.id)}, { $set: newDriverData });
        res.status(200).send();
    } catch(err) {
        res.status(500).send(err.message);
    }
});

//delete driver actually i don't know why you should delete a driver, but who cares
router.delete("/:id", async(req,res)=>{
    try {
        const drivers = await loadDriversCollection();
        await drivers.deleteOne({_id:ObjectId(req.params.id)});
        return res.status(204).send();
    } catch(err) {
        res.status(500).send(err.message);
    }
});

async function loadDriversCollection() {
    const client = await mongodb.MongoClient.connect("mongodb+srv://rti_user:rti@astaRti2021.dbx5j.mongodb.net/rti_db?retryWrites=true&w=majority",
        { useNewUrlParser: true },
        { useUnifiedTopology: true });
    try{
        client.db("rti_db").command({ ping: 1 });
     } finally {
    // Ensures that the client will close when you finish/error
        await client.close();
    }
    return client.db("rti_db").collection("drivers");
}*/
module.exports = router;
