const express = require("express");
const mongodb = require("mongodb");
const axios = require('axios')
const router = express.Router();
var ObjectId = require('mongodb').ObjectId;
const { MongoClient } = require("mongodb");

//create transaction and transfer driver
router.post("/", async(req,res)=> {
    //validate request params
    /*===================================================
    * payload must contain driverId, newTeam, price
    *====================================================
    */
    if(req.body.driver == null || req.body.driver == "" || req.body.driver == undefined){
        res.status(400).send({message : "Please provide a driver"});
        return null;
    }
    if(req.body.price == null || req.body.price == "" || req.body.price == undefined){
        res.status(400).send({message : "Please provide a price of transaction"});
        return null;
    }
    //get connection to collections
    const uri = "mongodb+srv://rti_user:rti@astaRti2021.dbx5j.mongodb.net/rti_db?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try{
        const drivers =  await client.db("rti_db").collection("drivers");
        const teams = await client.db("rti_db").collection("teams");
        const transactions = await client.db("rti_db").collection("transactions");

        //========== the actual function =====================
        var selectedDriver = await drivers.findOne({_id:ObjectId(req.params.driverId)});
        if(selectedDriver.length == 0 ) {
            res.status(404);
            return null;
        }
        if(selectedDriver.isOnSale == false) {
            res.status(404).send({message: "driver is not on sale"});
            return null;
        }
        if(selectedDriver.price > req.body.price) {
            res.status(400).send({message: "Cannot buy driver lower than base price"});
            return null;
        }

        //get team infos
        var payingTeam = await teams.find({name: req.body.newTeam});
        var sellingTeam = await teams.find({name: selectedDriver.team});

        //team provided as new exists?
        if(payingTeam.length == 0) {
            res.status(404).send({message: "this team does not exist"});
            return null;
        }

        //new team has the money? :P
        if(payingTeam.credits < req.body.price) {
            res.status(403).send({message: "this team has not the credits' amount necessary"});
            return null;
        }

        //ok now the team pays.
        payingTeam.credits = payingTeam.credits - req.body.price;
        //the selling teams gets the money, if the transfer is beetween two teams, they get half, 0 otherwise:
        if(sellingTeam.name != payingTeam.name){
            sellingTeam.credits = sellingTeam.credits + (req.body.price/2);
        } else {
            //do nothing you lose all the money bro
        }

        //transfer driver and put him out of market
        selectedDriver.team = payingTeam.name;
        selectedDriver.formerPrice = selectedDriver.price;
        selectedDriver.price = 0;
        selectedDriver.isOnSale = false;

        //create transaction history
        var newTransaction = {
            driverName : selectedDriver.name,
            price : req.body.price,
            formerTeam : sellingTeam.name,
            newTeam : payingTeam.name 
        };

        //flush the database
        res.status(201).send({
            message : "Driver " + newTransaction.driverName + "goes to " + newTransaction.formerTeam + "from " + newTransaction.formerTeam + "for " + newTransaction.price
        })



    } finally {
        await client.close();
    }

})





/*
//list all transactions ordered by time from most recent to less
router.get("/", async (req, res) => {
    try {
        const transactions = await loadTransactionsCollection();
        res.send(await transactions.find({}).sort({ "createdAt": 1 }).toArray());
    } catch (err) {
        res.status(500).send({message : err.message});
    }
});

//select single transaction
router.get("/:id", async (req, res) => {
    try{
        const transactions = await loadTransactionsCollection();
        if(req.params.id === null || req.params.id == "" || req.params.id == undefined) res.status(404).send({message: "transaction not found"});
        var thisTransaction = await transactions.findOne({ _id: ObjectId(req.params.id) });
        res.status(200).send(thisTransaction);
    } catch(err) {
        res.status(500).send({message : err.message});
    }
});

//create transaction
router.post("/", async (req, res) => {
    const transactions = await loadTransactionsCollection();
    axios.get("http://localhost:3000/api/drivers/"+req.body.id)
    .then(res => {
        var driver = res.data;
        console.log(driver);
    })
    .catch(error => {
        console.log(error);
        res.status(500).send();
    });
    await transactions.insertOne({
        driver: req.body.driver,
        from: req.body.from,
        to: req.body.to,
        pricePaid: req.body.pricePaid,
        percentage: req.body.percentage,
        createdAt: new Date()
    });
    if(req.body.from != req.body.to) {
        axios.patch('http://localhost:3000/api/drivers/602060272b28bd3b98f935b3', {
            name : req.body.driver,
            team: req.body.to,
            price : 0,
            isOnSale : false
        })
        .then(res => {
            console.log("ok");
            //console.log(`statusCode: ${res.statusCode}`)
            //console.log(res)
        })
        .catch(error => {
            console.log("nope");
            console.error(error)
        })
    }
    res.status(201).send();
});

//update transaction
router.patch("/:id", async (req, res) => {
    const transactions = await loadTransactionsCollection();
    var newDriverData = {
        driver: req.body.driver,
        from: req.body.from,
        to: req.body.to,
        pricePaid: req.body.pricePaid,
        percentage: req.body.percentage,
        createdAt: new Date()
    };
    await transactions.updateOne({ _id: ObjectId(req.params.id) }, { $set: newDriverData });
    res.status(200).send();
});

//delete transaction
router.delete("/:id", async (req, res) => {
    const transactions = await loadTransactionsCollection();
    await transactions.deleteOne({ _id: ObjectId(req.params.id) });
    return res.status(204).send();
});

async function loadTransactionsCollection() {
    const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false",
        { useNewUrlParser: true },
        { useUnifiedTopology: true }
    );
    return client.db("racing_team_italia").collection("transactions");
}
*/
module.exports = router;