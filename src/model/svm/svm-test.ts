import fs from "fs";

const SVM = require("libsvm-js/asm");

const train = require("../data/trainingClusters/train.json");
const test = require("../data/trainingClusters/test.json");

const cluster0 = require("../data/clusters/cluster0.json");
const cluster1 = require("../data/clusters/cluster1.json");
const cluster2 = require("../data/clusters/cluster2.json");
const cluster3 = require("../data/clusters/cluster3.json");
const cluster4 = require("../data/clusters/cluster4.json");
const cluster5 = require("../data/clusters/cluster5.json");
const cluster6 = require("../data/clusters/cluster6.json");
const cluster7 = require("../data/clusters/cluster7.json");
const cluster8 = require("../data/clusters/cluster8.json");
const cluster9 = require("../data/clusters/cluster9.json");

const clusterList = [
	cluster0,
	cluster1,
	cluster2,
	cluster3,
	cluster4,
	cluster5,
	cluster6,
	cluster7,
	cluster8,
	cluster9,
];

console.log("> Trainign Support Vector Machines for clusters");

clusterize()

function formatTrainInput(trainIntput: any, trainOutput: any, clusterSize: any, cluster: any) {
	for (let x = 0; x < 8000; x++) {
		let input_: number[] = [];
		let y = 0;
		for (let property in train) {
			if (property !== "index") {
				input_[y] = train[property][x];
				y += 1;
			}
		}
		trainIntput[x] = input_;
		trainOutput[x] = 0;
	}
	for (let x = 0; x < 8000; x++) {
		for (let j = 0; j < clusterSize; j++) {
			if (train["index"][x] == cluster[j]) {
				trainOutput[x] = 1;
			}
		}
	}
}

function formatTestInput(testIntput: any, testOutput: any, clusterSize: any, cluster: any) {
	for (let x = 0; x < 2000; x++) {
		let input_: number[] = [];
		let y = 0;
		for (let property in test) {
			if (property !== "index") {
				input_[y] = test[property][x];
				y += 1;
			}
		}
		testIntput[x] = input_;
		testOutput[x] = 0;
	}

	for (let x = 0; x < 2000; x++) {
		for (let j = 0; j < clusterSize; j++) {
			if (test["index"][x] == cluster[j]) {
				testOutput[x] = 1;
			}
		}
	}
}

function clusterize() {
	for (let x = 0; x < 10; x++) {

		const clusterSize = Object.keys(clusterList[x]).length;

		let trainIntput: number[] = [];
		let testIntput: number[] = [];
		let trainOutput: number[] = [];
		let testOutput: number[] = [];

		formatTrainInput(trainIntput, trainOutput, clusterSize, clusterList[x]);
		formatTestInput(testIntput, testOutput, clusterSize, clusterList[x]);

    cluster(trainIntput,trainOutput,testIntput,testOutput).then(() => console.log(`done cluser ${x}`));

	}
}

async function cluster(trainIntput:any,trainOutput:any,testIntput:any,testOutput:any) {
	const SVM = await require("libsvm-js");
	const svm = new SVM({
		kernel: SVM.KERNEL_TYPES.RBF, // The type of kernel I want to use
		type: SVM.SVM_TYPES.C_SVC, // The type of SVM I want to run
		gamma: 0.01, // RBF kernel gamma parameter
		cost: 1, // C_SVC cost parameter
	});

	svm.train(trainIntput, trainOutput); // train the model

	let predictions = svm.predict(trainIntput);
	let tp = 0,
		fp = 0,
		tn = 0,
		fn = 0;
	for (let i = 0; i < trainOutput.length; i++) {
		if (trainOutput[i] == predictions[i]) {
			tp += trainOutput[i] > 0 ? 1 : 0;
			tn += trainOutput[i] > 0 ? 0 : 1;
		} else {
			fp += trainOutput[i] > 0 ? 0 : 1;
			fn += trainOutput[i] > 0 ? 1 : 0;
		}
	}

	console.log("> train TP: ", tp);
	console.log("> train TN: ", tn);
	console.log("> train FP: ", fp);
	console.log("> train FN: ", fn);
	console.log("> sensitivity: ", tp / (tp + fn));
	console.log("> specificity: ", tn / (tn + fp));

	predictions = svm.predict(testIntput);
	(tp = 0), (fp = 0), (tn = 0), (fn = 0);

	for (let i = 0; i < predictions.length; i++) {
		if (testOutput[i] == predictions[i]) {
			tp += testOutput[i] > 0 ? 1 : 0;
			tn += testOutput[i] > 0 ? 0 : 1;
		} else {
			fp += testOutput[i] > 0 ? 0 : 1;
			fn += testOutput[i] > 0 ? 1 : 0;
		}
		/*if (predictions[i] == 0)
            console.log(testIntput[i][0], testIntput[i][1]);*/
	}

	console.log("> test TP: ", tp);
	console.log("> test TN: ", tn);
	console.log("> test FP: ", fp);
	console.log("> test FN: ", fn);
	console.log("> sensitivity: ", tp / (tp + fn));
	console.log("> specificity: ", tn / (tn + fp));

	let serialized = svm.serializeModel();
	fs.writeFile("src/data/svm/svm.model_all_cluster", serialized, function (err: any) {
		if (err) throw err;
		console.log("Saved!");
	});
}

function readSVM(trainIntput:any,trainOutput:any,testIntput:any,testOutput:any) {
	const data = fs.readFileSync("src/data/svm.model", "utf8");
	let svm = SVM.load(data);
	let predictions = svm.predict(testIntput);
	let tp = 0,
		fp = 0,
		tn = 0,
		fn = 0;

	for (let i = 0; i < predictions.length; i++) {
		if (testOutput[i] == predictions[i]) {
			tp += testOutput[i] > 0 ? 1 : 0;
			tn += testOutput[i] > 0 ? 0 : 1;
		} else {
			fp += testOutput[i] > 0 ? 0 : 1;
			fn += testOutput[i] > 0 ? 1 : 0;
		}
		/*if (predictions[i] == 0)
            console.log(testIntput[i][0], testIntput[i][1]);*/
	}

	console.log("> test TP: ", tp);
	console.log("> test TN: ", tn);
	console.log("> test FP: ", fp);
	console.log("> test FN: ", fn);
	console.log("> sensitivity (TPR): ", tp / (tp + fn));
	console.log("> specificity (TNR): ", tn / (tn + fp));
	console.log("> fall-out (FPR): ", fp / (tn + fp));
	console.log("> miss rate (FNR): ", fn / (fn + tp));
}

//cluster().then(() => console.log("done!"));
//readSVM();
