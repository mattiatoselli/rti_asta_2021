const port = process.env.PORT || 3000;
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
//instantiate express framework
const app = express();
//middlewares
app.use(cors());
//routes
const drivers = require("./routes/api/drivers");
const transactions = require("./routes/api/transactions");
const teams = require("./routes/api/teams");
//redirect any routes from api/drivers to file routes/api/drivers
app.use("/api/drivers", drivers);
//redirect any routes from api/transactions to file routes/api/transactions
app.use("/api/transactions", transactions);
//redirect any routes from api/transactions to file routes/api/transactions
app.use("/api/teams", teams);
// open server on port
/*app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});*/











app.get('/', (req, res) => res.send('Hello!'))

app.listen(port, () => console.log(`sample-expressjs app listening on port ${port}!`))
