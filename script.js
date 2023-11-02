document.getElementById('start-button').addEventListener('click', function() {
    switchScreen('welcome-screen', 'main-content');
});

document.getElementById('nav-button-welcome').addEventListener('click', function() {
    switchScreen('welcome-screen', 'main-content');
});

document.getElementById('nav-button-main').addEventListener('click', function() {
    switchScreen('main-content', 'result-screen');
});

document.getElementById('nav-button-result').addEventListener('click', function() {
    switchScreen('result-screen', 'welcome-screen');
});

document.getElementById('view-tracker-button').addEventListener('click', function() {
    updateTrackerStats();
    switchScreen('welcome-screen', 'tracker-screen');
});

document.getElementById('nav-button-tracker').addEventListener('click', function() {
    switchScreen('tracker-screen', 'welcome-screen');
});

let video = document.getElementById('camera');
let canvas = document.getElementById('canvas');
let captureButton = document.getElementById('capture');
let classifyButton = document.getElementById('classify');
let retakeButton = document.getElementById('retake');

// Access the device camera and stream to video element
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
        video.srcObject = stream;
        video.play();
    }).catch(function(error) {
        console.log("Error accessing camera: ", error);
    });
}

captureButton.addEventListener('click', function() {
    canvas.getContext('2d').drawImage(video, 0, 0, 640, 480);
    canvas.classList.remove('hidden');
    video.classList.add('hidden');
    captureButton.classList.add('hidden');
    classifyButton.classList.remove('hidden');
    retakeButton.classList.remove('hidden');
});

classifyButton.addEventListener('click', function() {
    canvas.toBlob(function(blob) {
        let formData = new FormData();
        formData.append('file', blob, 'image.jpg');

        fetch('http://127.0.0.1:5000/classify', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            let prediction = data.prediction;
            let classificationText = 'Classification: ' + prediction;
            updateTracker(prediction.toLowerCase());
            let additionalInfo = getDisposalInstructions(prediction);
            document.getElementById('result').innerText = classificationText;
            document.getElementById('additional-info').innerText = additionalInfo;
            switchScreen('main-content', 'result-screen');
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('result').innerText = 'Error: ' + error.toString();
            document.getElementById('additional-info').innerText = '';
            switchScreen('main-content', 'result-screen');
        });
    }, 'image/jpeg');
});

function updateTrackerStats() {
    const tracker = getTrackerData();
    const trackerStatsDiv = document.getElementById('tracker-stats');
    trackerStatsDiv.innerHTML = ''; // Clear existing stats

    Object.keys(tracker).forEach(item => {
        const stat = document.createElement('p');
        stat.innerText = `${item.charAt(0).toUpperCase() + item.slice(1)}: ${tracker[item]}`;
        trackerStatsDiv.appendChild(stat);
    });
}

function getTrackerData() {
    const tracker = localStorage.getItem('recyclingTracker');
    return tracker ? JSON.parse(tracker) : {
        cardboard: 0,
        compost: 0,
        glass: 0,
        metal: 0,
        paper: 0,
        plastic: 0,
        trash: 0
    };
}

function updateTracker(item) {
    const tracker = getTrackerData();
    if (tracker.hasOwnProperty(item)) {
        tracker[item]++;
        localStorage.setItem('recyclingTracker', JSON.stringify(tracker));
    }
}

function getDisposalInstructions(item) {
    const instructions = {
        'cardboard': "Flatten cardboard boxes. Remove any non-paper packing material.",
        'compost': "Place in your compost bin. Ensure no plastic is mixed.",
        'glass': "Rinse and place in your recycling bin. Separate by color if required.",
        'metal': "Clean and place in metal recycling. Check local guidelines for specific metals.",
        'paper': "Recycle clean paper. Shred sensitive documents.",
        'plastic': "Empty and rinse. Remove caps and labels if required. Enter the plastic number below for more in-depth instructions on if it's recyclable based on your local policies.",
        'trash': "Cannot be recycled. Please dispose of it properly."
    };
    return instructions[item] || "Check local guidelines for disposal.";
}

function switchScreen(fromScreenId, toScreenId) {
    let fromScreen = document.getElementById(fromScreenId);
    let toScreen = document.getElementById(toScreenId);

    fromScreen.classList.remove('show');
    setTimeout(() => {
        fromScreen.style.display = 'none';
        toScreen.style.display = 'flex';
        toScreen.offsetWidth;
        toScreen.classList.add('show');
    }, 500);
}

retakeButton.addEventListener('click', function() {
    video.classList.remove('hidden');
    canvas.classList.add('hidden');
    captureButton.classList.remove('hidden');
    classifyButton.classList.add('hidden');
    retakeButton.classList.add('hidden');
});

document.getElementById('recycle-another').addEventListener('click', function() {
    video.classList.remove('hidden');
    canvas.classList.add('hidden');
    captureButton.classList.remove('hidden');
    classifyButton.classList.add('hidden');
    retakeButton.classList.add('hidden');
    document.getElementById('result').innerText = '';
    document.getElementById('additional-info').innerText = '';
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    switchScreen('result-screen', 'main-content');
});

function displayLinkBasedOnCity(city) {
    const cityLinks = {
        'Allen': 'https://www.allenlibrary.org/FAQ.aspx?QID=349#:~:text=%231%2D5%20and%20%237,be%20thrown%20in%20the%20trash.',
        'McKinney': 'https://www.mckinneytexas.org/792/Recycling#:~:text=All%20recycling%20must%20be%20inside,placed%20loosely%20within%20recycling%20cart.',
        'Farmersville': 'https://www.farmersvilletx.com/departments/utilities___public_works/recycling___garbage_pick_up.php#:~:text=Residential%20Recycling%3A,at%20972%2D782%2D6151.'
    };

    const link = cityLinks[city];
    if (link) {
        const resultScreen = document.getElementById('result-screen');
        const linkButton = document.createElement('a');
        linkButton.href = link;
        linkButton.innerText = `Recycling Policies for ${city}`;
        linkButton.target = "_blank"; // Open link in a new tab
        linkButton.classList.add('city-link-button');
        resultScreen.appendChild(linkButton);
    }
}
getCityName(displayLinkBasedOnCity);

// Set initial screen visibility
document.getElementById('welcome-screen').style.display = 'flex';
document.getElementById('welcome-screen').classList.add('show');

// Plastic number submit event listener
document.getElementById('plastic-number-submit').addEventListener('click', function() {
    const plasticNumber = document.getElementById('plastic-number-input').value;
    getCityName(city => {
        checkPlasticRecyclability(plasticNumber, city);
    });
});

function checkPlasticRecyclability(plasticNumber, city) {
    const recyclableInAllen = ['1', '2', '3', '4', '5', '7'];
    const recyclableInMcKinney = ['1', '2', '3', '4', '5', '6', '7'];

    let isRecyclable;
    if (city === 'Allen') {
        isRecyclable = recyclableInAllen.includes(plasticNumber);
    } else if (city === 'McKinney') {
        isRecyclable = recyclableInMcKinney.includes(plasticNumber);
    }

    const resultText = isRecyclable ? "This plastic is recyclable." : "This plastic is not recyclable.";
    document.getElementById('additional-info').innerText += "\n" + resultText;
}

function getCityName(callback) {
    fetch('http://ip-api.com/json')
        .then(response => response.json())
        .then(data => {
            callback(data.city);
        })
        .catch(error => {
            console.error('Error fetching city:', error);
        });
}



