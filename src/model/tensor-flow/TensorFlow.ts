import * as tf from "@tensorflow/tfjs-node";
import fs from "fs";
import { inputs, outputs } from "./Input";

console.log("> testing LSTM Networks used in ITRM");

function prepareData(probability: number) {
	let info: any = {
		train: { inputs: [], outputs: [] },
		test: { inputs: [], outputs: [] },
	};
	for (let i = 0; i < inputs.length; i++)
		if (Math.random() < probability) {
			info.test.inputs.push(inputs[i]);
			info.test.outputs.push(outputs[i]);
		} else {
			info.train.inputs.push(inputs[i]);
			info.train.outputs.push(outputs[i]);
		}
	info.train.data = tf.tensor(build(info.train.inputs));
	info.train.labels = tf.tensor(info.train.outputs);
	info.test.data = tf.tensor(build(info.test.inputs));
	return info;
}

function build(data: number[][][]) {
	let result = [];
	for (let input of data) {
		let layer = [];
		for (let i = 0; i < input[0].length; i++) {
			let row = [];
			for (let j = 0; j < input.length; j++) row.push(input[j][input[0].length - i - 1]);
			layer.push(row);
		}
		result.push(layer);
	}
	return result;
}

export async function run() {
	let best = { training_r2: -100, all_r2: -100 };
	for (let i = 1; i <= 1; i++) {
		let data = prepareData(0.2);
		console.log("> data:", data);
		const model = tf.sequential({
			layers: [
				tf.layers.lstm({
					units: 64,
					returnSequences: false,
					inputShape: [inputs[0][0].length, inputs[0].length],
				}),
				tf.layers.dense({ units: 1 }),
			],
		});
		model.summary();
		console.log("> model layers:");
		model.weights.forEach((w) => {
			console.log(w.name, w.shape);
		});

		console.log("> training model");
		model.compile({
			optimizer: "Adamax",
			loss: "meanSquaredError",
			metrics: ["mse"],
		});
		await model.fit(data.train.data, data.train.labels, {
			epochs: 100,
			batchSize: 32,
		});
		let predictions = restore((model.predict(data.train.data) as tf.Tensor).dataSync());
		let training_r2 = calculateR2(predictions, restoreOutputs(data.train.outputs));
		console.log("> training r2:", training_r2);
		predictions = restore((model.predict(tf.tensor(build(inputs))) as tf.Tensor).dataSync());
		let all_r2 = calculateR2(predictions, outputs); ///from restoreOutputs(outputs)
		console.log("> all r2:", all_r2);
		fs.writeFile(
			"src/networks/" + i + "statistics.txt",
			"training_r2: " + training_r2 + "\nall_r2: " + all_r2,
			function (err: any) {
				if (err) console.log(err);
				console.log("> updated");
			}
		);
		let saveResult = await model.save(
			"file:///Users/itrmi/OneDrive/Documentos/Fabian Ruiz/repos/ValuationTools/crawlers/fluf_crawler/src/networks/attemps/" +
				i
		);
		if (
			all_r2 > best.all_r2 ||
			(Math.abs(all_r2 - best.all_r2) < 0.03 && best.training_r2 < training_r2)
		) {
			saveResult = await model.save(
				"file:///Users/itrmi/OneDrive/Documentos/Fabian Ruiz/repos/ValuationTools/crawlers/fluf_crawler/src/networks/best"
			);
			best.training_r2 = training_r2;
			best.all_r2 = all_r2;
		}
	}
}

function restore(values: any) {
	let result = [];
	// result.push((value - 0.5) * (10.0 * deviation) + average);
	for (let value of values) result.push(value);
	return result;
}

function restoreOutputs(values: any) {
	let result = [];
	//result.push((value[0] - 0.5) * (10.0 * deviation) + average);
	for (let value of values) result.push(value);
	return result;
}

function calculateR2(forecast: number[], reference: number[][]) {
	let avg: number = 0,
		ss_res: number = 0,
		ss_tot: number = 0;
	for (let i = 0; i < reference.length; i++) avg += (reference[i][0]);
	avg /= reference.length;
	for (let i = 0; i < forecast.length; i++) {
		ss_res += Math.pow(forecast[i] - reference[i][0], 2);
		ss_tot += Math.pow(avg - reference[i][0], 2);
	}
	return 1.0 - ss_res / ss_tot;
}