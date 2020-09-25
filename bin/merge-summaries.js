#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(values) {
  if (values.length === 0) return 0;
  values.sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);
  if (values.length % 2) return values[half];
  return (values[half - 1] + values[half]) / 2.0;
}

async function main(summaryfile) {
  const summary = JSON.parse(fs.readFileSync(summaryfile, "utf-8"));
  const summaryCopy = JSON.parse(fs.readFileSync(summaryfile, "utf-8"));
  const summariesfile = path.resolve(
    path.join(path.dirname(summaryfile), "summaries.json")
  );

  let summaries;
  if (fs.existsSync(summariesfile)) {
    summaries = JSON.parse(fs.readFileSync(summariesfile, "utf-8"));
  } else {
    summaries = [];
    for (const report of summaryCopy) {
      const copy = Object.assign({}, report);
      copy.detail.performance = [];
      copy.score = [];
      summaries.push(copy);
    }
  }
  for (const report of summary) {
    for (const aggReport of summaries) {
      if (aggReport.url === report.url) {
        aggReport.detail.performance.push(report.detail.performance);
        aggReport.score.push(report.score);
      }
    }
  }
  for (const aggReport of summaries) {
    const scores = aggReport.score.map((x) => parseFloat(x));

    const performances = aggReport.detail.performance;
    console.log({ scores, performances });
    aggReport.score__count = scores.length;
    aggReport.score__average = average(scores);
    aggReport.score__median = median(scores);
    aggReport.detail.performance__count = performances.length;
    aggReport.detail.performance__average = average(performances);
    aggReport.detail.performance__median = median(performances);
  }
  fs.writeFileSync(summariesfile, JSON.stringify(summaries, null, 2));
  console.log(`Wrote aggregate merged summaries in ${summariesfile}`);
}

main(process.argv[2]);
