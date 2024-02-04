import dotenv from "dotenv";
import { ConnectDB } from "./db/db.js";
import { app } from "./app.js";

dotenv.config()


ConnectDB().then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server running on  http://localhost:${process.env.PORT || 8000}`);
    })
}).catch((error) => {
    console.log("MONGODB connection error!!! ", error);
});