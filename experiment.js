document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('experimentCanvas');
    const ctx = canvas.getContext('2d');

    const instructions = document.getElementById('instructions');
    const instructions2 = document.getElementById('instructions2');
    const nextButton = document.getElementById('nextButton');
    const prevButton = document.getElementById('prevButton');
    const startButton = document.getElementById('startButton');
    const experimentCanvasContainer = document.getElementById('experimentCanvasContainer');

    let centerX, centerY;
    let state = 'iti';  // Track the state of the experiment

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        centerX = canvas.width / 2;
        centerY = canvas.height / 2;
        if (state === 'waiting_for_response' || state === 'iti') {
            drawFixation();
        }
    }

    window.addEventListener('resize', resizeCanvas);

    const exampleCanvas1 = document.getElementById('exampleCanvas1');
    const exampleCtx1 = exampleCanvas1.getContext('2d');
    const exampleCanvas2 = document.getElementById('exampleCanvas2');
    const exampleCtx2 = exampleCanvas2.getContext('2d');
    const exampleCanvas3 = document.getElementById('exampleCanvas3');
    const exampleCtx3 = exampleCanvas3.getContext('2d');

    function drawFixationExample(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawAnnularExample(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, 40, 0, Math.PI * 2);
        ctx.stroke();
    }

    function drawFlashExample(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, 40, 0, Math.PI * 2);
        ctx.fill();
    }

    nextButton.addEventListener('click', function() {
        instructions.style.display = 'none';
        instructions2.style.display = 'flex';
        prevButton.style.display = 'flex';
        startButton.style.display = 'flex';
    });

    prevButton.addEventListener('click', function() {
        instructions2.style.display = 'none';
        instructions.style.display = 'flex';
        nextButton.style.display = 'flex';
    });

    startButton.addEventListener('click', function() {
        instructions2.style.display = 'none';
        experimentCanvasContainer.style.display = 'flex';
        startTrial();
    });

    const fixationSize = 10;
    const annularSize = 50;
    const rewardWindowRatio = 0.3;

    const fixRatio = 1.44444;
    const itiMean = 500;
    const itiMin = 300;
    const itiMax = 1000;
    const setTimeDurMean = 300;
    const setTimeDurMin = 300;
    const setTimeDurMax = 1500;
    const max_reward = 100;
    const flashjitterMin = -75;
    const flashjitterMax = 75;
    const maxPracticeTrialsCount = 200;
    const practiceTrialsCount = 4;
    const trialperBlock = 5;
    const formalTrialsCount = 50;
    const flashchangeratio = [-1, -.5, -.25, .25, .5, 1];
    const flashchangemax = 80;
    const flashmin = 650;
    const flashmax = 1150;

    let flashTime = 800;
    let correctTime = flashTime * fixRatio;
    let timeWindow = correctTime * rewardWindowRatio;
    let maxResponseTime = correctTime + 4 * timeWindow;
    let transitOn = 0;
    let flashOn = 0;
    let trialCount = 0;
    let isPractice = true;

    let lastAnnularTime = 0;
    let timeoutHandle = null;
    let flashHandle = null;
    let blockCount = 0;
    let trialData = [];

    let blocktrialcount = 0;
    let blockid = 0;
    let inBreak = false;

    resizeCanvas();

    drawFixationExample(exampleCtx1);
    drawAnnularExample(exampleCtx2);
    drawFlashExample(exampleCtx3);

    function randomExponential(beta) {
        const u = Math.random();
        return -beta * Math.log(1 - u);
    }

    function boundedExponential(beta, min, max) {
        let value;
        do {
            value = randomExponential(beta);
            value += min;
        } while (value > max);
        return value;
    }

    function drawFixation() {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX, centerY, fixationSize, 0, Math.PI * 2);
        ctx.fill();
    }

    function clearCanvas(excludeFixation = false) {
        if (excludeFixation) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.clearRect(centerX - fixationSize - 1, centerY - fixationSize - 1, fixationSize * 2 + 2, fixationSize * 2 + 2);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    function sampleflashTime() {
        if (blocktrialcount > trialperBlock) {
            transitOn = Math.random() < 0.5;
        }
        if (transitOn) {
            transitOn = 0;
            blocktrialcount = 0;
            blockid++;
            flashTime = Math.max(flashTime + flashchangeratio[Math.floor(Math.random() * flashchangeratio.length)] * flashchangemax, flashmin);
            flashTime = Math.min(flashTime, flashmax);
        }
    }

    function drawAnnular() {
        clearCanvas(true);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, annularSize, 0, Math.PI * 2);
        ctx.stroke();
        lastAnnularTime = Date.now();
        state = 'waiting_for_response';

        setTimeout(() => {
            clearCanvas(true);
            drawFixation();
        }, 100);

        flashOn = Math.random() < 0.5;
        if (blocktrialcount == 0) {
            flashOn = 1;
        }
        flashjitter = flashjitterMin + (flashjitterMax - flashjitterMin) * Math.random();
        trueflashTime = flashTime + flashjitter;
        if (flashOn) {
            flashHandle = setTimeout(drawFlash, trueflashTime);
        }

        timeoutHandle = setTimeout(() => {
            if (state === 'waiting_for_response') {
                state = 'closed_response';
                giveFeedback(false);
            }
        }, maxResponseTime);
    }

    function drawFlash() {
        clearCanvas(true);
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX, centerY, annularSize, 0, Math.PI * 2);
        ctx.fill();
        setTimeout(() => {
            clearCanvas(true);
            drawFixation();
        }, 100);
    }

    function drawErrorBar(error) {
        const barMaxWidth = canvas.width / 2;
        const errorScale = barMaxWidth / 2000;
        const barWidth = Math.min(Math.abs(error * errorScale), barMaxWidth);
        const barHeight = 20;
        const barY = centerY + 100;

        ctx.fillStyle = 'white';
        ctx.beginPath();
        if (error > 0) {
            ctx.rect(centerX, barY, barWidth, barHeight);
        } else {
            ctx.rect(centerX - barWidth, barY, barWidth, barHeight);
        }
        ctx.fill();
    }

    function giveFeedback(isCorrect, responseTime) {
        clearTimeout(timeoutHandle);
        clearTimeout(flashHandle);
        state = 'feedback';

        iti = boundedExponential(itiMean, itiMin, itiMax);
        const error = responseTime - correctTime;
        const error_abs = Math.abs(responseTime - correctTime);
        const reward = Math.max(0, max_reward - (max_reward / timeWindow) * error_abs);

        trialData.push({
            trialNumber: trialCount,
            iti: iti,
            setTimeDur: setTimeDur,
            isPractice: isPractice,
            responseTime: responseTime,
            isCorrect: isCorrect,
            flashOn: flashOn,
            flashTime: flashTime,
            trueflashTime: trueflashTime,
            error: error,
            reward: reward,
            blocktrialcount: blocktrialcount,
            blockid: blockid
        });

        clearCanvas();
        ctx.fillStyle = isCorrect ? 'green' : 'red';
        ctx.beginPath();
        ctx.arc(centerX, centerY, annularSize, 0, Math.PI * 2);
        ctx.fill();

        if (isPractice) {
            drawErrorBar(error);
        }

        ctx.fillStyle = 'white';
        ctx.font = "20px Arial";
        ctx.fillText("Reward: " + reward.toFixed(2), centerX - 50, centerY + 50);

        setTimeout(() => {
            trialCount++;
            blocktrialcount++;
            if (isPractice && trialCount >= practiceTrialsCount) {
                isPractice = false;
                blocktrialcount = 0;
                trialCount = 0;
                alert('Practice completed. Starting formal trials.');
            } else if (!isPractice && trialCount >= formalTrialsCount) {
                endExperiment();
                return;
            } else if (!isPractice && blocktrialcount >= trialperBlock) {
                blockCount++;
                blocktrialcount = 0;
                if (blockCount % 5 === 0 && blockCount > 0) {
                    initiateBreak();
                    return;
                }
            }
            clearCanvas();
            setTimeout(startTrial, iti);
        }, 2000);
    }

    function startTrial() {
        sampleflashTime();
        clearCanvas();
        state = 'init';
        drawFixation();
        setTimeDur = boundedExponential(setTimeDurMean, setTimeDurMin, setTimeDurMax);
        setTimeout(drawAnnular, setTimeDur);
    }

    function endExperiment() {
        let dataToSend = JSON.stringify(trialData);

        const blob = new Blob([dataToSend], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'experiment_data.json';
        a.click();

        alert("Please upload the downloaded file to the Google Form to complete the study. You will be redirected to Prolific to finish.");

        const googleFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSeF4b3Hy1ov1NfiySurlQiQY6qeWqgYp1idL4_RdzF1Jes-Nw/viewform?usp=sf_link";
        const newWindow = window.open(googleFormUrl, "_blank");
        if (newWindow) {
            newWindow.focus();
        } else {
            alert("Popup blocked! Please allow popups for this website. If you don't see the option, copy and paste this link manually: https://docs.google.com/forms/d/e/1FAIpQLSeF4b3Hy1ov1NfiySurlQiQY6qeWqgYp1idL4_RdzF1Jes-Nw/viewform?usp=sf_link");
        }

        setTimeout(function() {
            window.location.href = "https://app.prolific.com/submissions/complete?cc=C1JFHEUP";
        }, 5000);
    }

    function initiateBreak() {
        inBreak = true;
        alert("You can take a break for up to 5 minutes. Press OK to start the break. You can terminate break by pressing Space to resume experiment immediately.");
        const breakDuration = 5 * 60 * 1000;
        const breakEndTime = Date.now() + breakDuration;

        function checkBreakEnd() {
            if (!inBreak) return;
            if (Date.now() >= breakEndTime) {
                endBreak();
            } else {
                setTimeout(checkBreakEnd, 1000);
            }
        }
        checkBreakEnd();
    }

    function endBreak() {
        inBreak = false;
        isPractice = true;
        trialCount = 0;
        blocktrialcount = 0;
        alert("Break over. Restarting practice trials.");
        clearCanvas();
        startTrial();
    }

    document.addEventListener('keydown', function(event) {
        if (event.code === 'Escape') {
            endExperiment();
        } else if (inBreak && event.code === 'Space') {
            alert("Break terminated early. Restarting practice trials.");
            endBreak();
        } else if (event.code === 'Space' && state === 'waiting_for_response') {
            state = 'closed_response';
            const responseTime = Date.now() - lastAnnularTime;
            const isCorrect = responseTime >= (correctTime - timeWindow) && responseTime <= (correctTime + timeWindow);
            giveFeedback(isCorrect, responseTime);
        }
    });

    window.addEventListener('resize', resizeCanvas);
});
