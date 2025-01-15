import express from "express";
import serveIndex from "serve-index";

const app = express();
app.use("/", express.static("examples"), serveIndex("examples"));

const server = app.listen(8081, "localhost", () => {
  let address = server.address();
  if (typeof address === "object" && address !== null) {
    address = `http://${address.address}:${address.port}/`;
  }
  console.log("Listening at", address);
});
