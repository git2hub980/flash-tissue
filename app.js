// --- Flash-Tissue Feature ---
const video = document.getElementById("video");
const startBtn = document.getElementById("startBtn");
const resultText = document.getElementById("result");

let redValues = [];
let captureInterval;

startBtn.onclick = async () => {

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment", advanced: [{ torch: true }] }
  });

  video.srcObject = stream;
  startCapture();
};

function startCapture() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  redValues = [];

  captureInterval = setInterval(() => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frame = ctx.getImageData(
      canvas.width / 4,
      canvas.height / 4,
      canvas.width / 2,
      canvas.height / 2
    );

    let redSum = 0;
    for (let i = 0; i < frame.data.length; i += 4) redSum += frame.data[i];
    const redAvg = redSum / (frame.data.length / 4);
    redValues.push(redAvg);

  }, 50);

  setTimeout(stopCapture, 15000);
}

function stopCapture() {
  clearInterval(captureInterval);
  const spo2 = estimateSpO2(redValues);

  resultText.innerText = `SpO₂: ${spo2}%`;

  if (spo2 > 95) resultText.innerText += "\nLikely Mild / Walking Case";
  else if (spo2 < 92) resultText.innerText += "\nHigh Severity – Seek Medical Help";
  else resultText.innerText += "\nModerate Risk";
}

function estimateSpO2(values) {
  const mean = values.reduce((a, b) => a + b) / values.length;
  const normalized = values.map(v => v - mean);
  const amplitude = Math.max(...normalized) - Math.min(...normalized);
  let spo2 = 100 - (amplitude * 0.5);
  spo2 = Math.max(85, Math.min(99, spo2));
  return Math.round(spo2);
}

// --- X-ray Upload ---
const predictBtn = document.getElementById("predictBtn");
const xrayInput = document.getElementById("xrayInput");
const xrayResult = document.getElementById("xrayResult");

predictBtn.onclick = async () => {
  if (!xrayInput.files[0]) return alert("Select an X-ray image!");

  const formData = new FormData();
  formData.append("file", xrayInput.files[0]);

  const response = await fetch("http://localhost:5000/predict", {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  xrayResult.innerText = `Prediction: ${data.prediction} (Confidence: ${Math.round(data.confidence*100)}%)`;
};

// --- Symptoms + Risk Score ---
const riskBtn = document.getElementById("riskBtn");
riskBtn.onclick = () => {
  const fever = document.getElementById("fever").checked ? 1 : 0;
  const cough = document.getElementById("cough").checked ? 1 : 0;
  const sob = document.getElementById("sob").checked ? 1 : 0;

  // Combine SpO₂ + symptoms
  let riskScore = 0;
  const spo2Val = parseInt(resultText.innerText.split(":")[1]) || 97;
  if (spo2Val < 92) riskScore += 2;
  else if (spo2Val < 95) riskScore += 1;
  riskScore += fever + cough + sob;

  let riskLabel = "Low";
  if (riskScore >= 4) riskLabel = "High";
  else if (riskScore >= 2) riskLabel = "Moderate";

  document.getElementById("riskResult").innerText = `Risk: ${riskLabel}`;
};
