import scikitjs from "scikitjs";
import * as tf from "@tensorflow/tfjs-node";

const fs = require("fs");
const stream = require("fs").createReadStream("./data/test2.csv");
const reader = require("readline").createInterface({ input: stream });

scikitjs.setBackend(tf);

// async function feedModel() {
// 	let X = [];
// 	let Y = [];
// 	let clf = new scikitjs.DecisionTreeRegressor();
// 	reader.on("line", async (row) => {
// 		let tempArry = row.split(";");
// 		let x = tempArry[0].split(",").slice(1).map(Number);
// 		let y = tempArry[1];
// 		X.push(x);
// 		Y.push(parseFloat(y));
// 	});
// 	reader.on("close", async () => {
// 		clf.fit(X, Y);
// 		console.log(">>token characteristics", X[0], ">>prediction:", clf.predict([X[0]]));
// 		let y_res = clf.predict(X);
// 		let r2 = scikitjs.metrics.r2Score(Y, y_res);
// 		console.log(">>R2:", r2);
// 	});
// }

// feedModel();
