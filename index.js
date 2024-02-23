import dotenv from "dotenv";
import { ConnectDB } from "./src/db/db.js";
import { app } from "./src/app.js";

dotenv.config()


ConnectDB().then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on http://localhost:${process.env.PORT || 8000}`);
    })
}).catch((error) => {
    console.log("MONGODB connection error!!! ", error);
});