const express = require("express");
const mongodb = require("mongodb");
const axios = require('axios')
const router = express.Router();
var ObjectId = require('mongodb').ObjectId;

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

module.exports = router;