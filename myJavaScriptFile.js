// Set the width and height of the canvas.
var WIDTH = 640;
var HEIGHT = 360;

//Set the width and height of the spectrogram canvas Visualisation
var spectrogramCanvasWidth = 640;
var spectrogramCanvasHeight = 360;

//the current x / draw pixel position of the spectrogram
var spectrogramLeftPos = 0;

//A play / stop flag. True = play, false = stop
var playing = false;

//used for colour distribution of the spectrogram. This example uses a library for the colour. Another example below uses HSL.
var myColor = new chroma.ColorScale({
	colors:['#000000', '#ff0000', '#ffff00', '#ffffff'],
	positions:[0, .25, .75, 1],
	mode:'rgb',
	limits:[0,255]
});

// Smoothing - A value from 0 -> 1 where 0 represents no time averaging with the last analysis frame. The default value is 0.8.
var SMOOTHING = 0.8;

// FFT Size - The size of the FFT used for frequency-domain analysis. Must be a power of 2.
var FFT_SIZE = 2048;

// Analyser variables.
// *******************************

/* The window.requestAnimationFrame() method tells the browser that you wish to perform an animation and requests that
the browser call a specified function to update an animation before the next repaint. The method takes as an argument
a callback to be invoked before the repaint.
Here we use this method, or a fallback. */
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       ||
  				window.RequestAnimationFrame ||
  				window.mozRequestAnimationFrame    ||
  				window.oRequestAnimationFrame      ||
  				window.msRequestAnimationFrame     ||
  				function( callback ){
  					window.setTimeout(callback, 1000 / 60);
				};
})();

// The analyser node.
var analyser;

// Audio Context.
var audioContext;

//Sound oscillator
var oscillator = null;

// A sound.
var aSoundBuffer = null;

// A sound source.
var aSoundSource = null;

//Create a gain node
var gainNode = null;

// Add an event to the the window. The load event will call the init function.
window.addEventListener('load', init, false);

// Function to initalise the audio context.
function init() {
	try {
		// Check if the default naming is enabled, if not use the WebKit naming.
	    if (!window.AudioContext) {
	        window.AudioContext = window.webkitAudioContext;
	    }

		audioContext = new AudioContext();

		// Initalise the analyser.
		initAnalyser();
	}
	catch(e) {
		alert("Web Audio API is not supported in this browser");
  	}
}

// Add events to document elements.
function addEvents() {
	// Add an event listener to the file input.
	document.getElementById("files").addEventListener('change', loadaSound, false);
	document.getElementById("files2").addEventListener('change', loadaSound, false);

	// Add an event to the volume control.
	document.getElementById('volume').addEventListener('change', adjustVolumne);
	// Add an event to the volume control.
	document.getElementById('volume2').addEventListener('change', adjustVolumne);

	frequency2.addEventListener("change", function () {
    filter.frequency.value = this.value;
	document.getElementById("frequency2").innerHTML = this.value;
  });

	frequency.addEventListener("change", function () {
    oscillator.frequency.value = this.value;
    document.getElementById("frequency").innerHTML = this.value;
  });
}

// Load a file when a file is selected.
function loadaSound(evt) {
	// Get the FileList object.
	var files = evt.target.files;

	// Get the first file in the list.
	// This example only works with
	// the first file returned.
	var fileSelected = files[0];

    // Create a file reader.
	var reader = new FileReader();

	reader.onload = function(e) {
    	initSound(this.result);
  	};

	// Read in the image file as a data URL.
  	reader.readAsArrayBuffer(fileSelected);
}

// Adjust the volume.
function adjustVolumne() {
gainNode.gain.value = this.value;
}

// Initalise the sound.
function initSound(arrayBuffer) {
	audioContext.decodeAudioData(arrayBuffer,
			function(buffer) {
				// audioBuffer is global to reuse the decoded audio later.
				aSoundBuffer = buffer;
			},
			function(e) {
				console.log('Error decoding file', e);
			}
		);
}

// Play the sound.
function playSound(buffer) {
  aSoundSource = audioContext.createBufferSource(); // creates a sound source.
  aSoundSource.buffer = buffer; // tell the source which sound to play.

  var tmpInput = document.getElementById("bqfilters").value;

  alert(tmpInput);

	 if(tmpInput == "lowpass") {
		 lowpass();
	 }

	 if(tmpInput == "highpass") {
		 highpass();
	 }

	 if(tmpInput == "lowshelf") {
		 lowshelf();
	 }

	 if(tmpInput == "highshelf") {
		 highshelf();
	 }

	 if(tmpInput == "peaking") {
		 peaking();
	 }

//================== LOW PASS ===================
function lowpass() {
	//Create Filter
  filter = audioContext.createBiquadFilter();
  //Create and specify parameters for Low-Pass Filter
  filter.type = "lowpass"; //Low pass filter
  filter.frequency.value = 440;

  //Create the gain node
  gainNode = audioContext.createGain();

  //Set the current volume
  var volume = document.getElementById('volume').value;
  gainNode.gain.value = volume;

  //Set up the audio graph
  aSoundSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(analyser);
  analyser.connect(audioContext.destination);

  aSoundSource.start(0); // play the source now.
  aSoundSource.connect(gainNode); //Connect the source to the gain node

  //Set the playing flag
  playing = true;

  //Clear the spectrogram canvas
  var canvas = document.getElementById("canvas2");
  var context = canvas.getContext("2d");
  context.fillStyle = "rgb(255,255,255)";
  context.fillRect (0, 0, spectrogramCanvasWidth, spectrogramCanvasHeight);

  // Start visualizer.
  requestAnimFrame(drawVisualisation);
}

//================= HIGH PASS =================
function highpass(){
	//Create Filter
  filter = audioContext.createBiquadFilter();
  //Create and specify parameters for Low-Pass Filter
  filter.type = "highpass"; //Low pass filter
  filter.frequency.value = 440;

    //Create the gain node
  gainNode = audioContext.createGain();

  //Set the current volume
  var volume = document.getElementById('volume').value;
  gainNode.gain.value = volume;

  //Set up the audio graph
  aSoundSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(analyser);
  analyser.connect(audioContext.destination);

  aSoundSource.start(0); // play the source now.
  aSoundSource.connect(gainNode); //Connect the source to the gain node

  //Set the playing flag
  playing = true;

  //Clear the spectrogram canvas
  var canvas = document.getElementById("canvas2");
  var context = canvas.getContext("2d");
  context.fillStyle = "rgb(255,255,255)";
  context.fillRect (0, 0, spectrogramCanvasWidth, spectrogramCanvasHeight);

  // Start visualizer.
  requestAnimFrame(drawVisualisation);
}

//============== LOW SHELF ===============
function lowshelf() {
  //Create Filter
  filter = audioContext.createBiquadFilter();
  //Create and specify parameters for Low-Pass Filter
  filter.type = "lowshelf"; //Low pass filter
  filter.frequency.value = 440;
  filter.gain.value = 25;

  //Create the gain node
  gainNode = audioContext.createGain();

  //Set the current volume
  var volume = document.getElementById('volume').value;
  gainNode.gain.value = volume;

  //Set up the audio graph
  aSoundSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(analyser);
  analyser.connect(audioContext.destination);

  aSoundSource.start(0); // play the source now.
  aSoundSource.connect(gainNode); //Connect the source to the gain node

  //Set the playing flag
  playing = true;

  //Clear the spectrogram canvas
  var canvas = document.getElementById("canvas2");
  var context = canvas.getContext("2d");
  context.fillStyle = "rgb(255,255,255)";
  context.fillRect (0, 0, spectrogramCanvasWidth, spectrogramCanvasHeight);

  // Start visualizer.
  requestAnimFrame(drawVisualisation);
}

//============== HIGH SHELF ===============
function highshelf() {
  //Create Filter
  filter = audioContext.createBiquadFilter();
  //Create and specify parameters for Low-Pass Filter
  filter.type = "highshelf"; //Low pass filter
  filter.frequency.value = 440;
  filter.gain.value = 25;

  //Create the gain node
  gainNode = audioContext.createGain();

  //Set the current volume
  var volume = document.getElementById('volume').value;
  gainNode.gain.value = volume;

  //Set up the audio graph
  aSoundSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(analyser);
  analyser.connect(audioContext.destination);

  aSoundSource.start(0); // play the source now.
  aSoundSource.connect(gainNode); //Connect the source to the gain node

  //Set the playing flag
  playing = true;

  //Clear the spectrogram canvas
  var canvas = document.getElementById("canvas2");
  var context = canvas.getContext("2d");
  context.fillStyle = "rgb(255,255,255)";
  context.fillRect (0, 0, spectrogramCanvasWidth, spectrogramCanvasHeight);

  // Start visualizer.
  requestAnimFrame(drawVisualisation);
}

//====================== PEAKING ==========================
function peaking() {
	//Create Filter
  filter = audioContext.createBiquadFilter();
  //Create and specify parameters for Low-Pass Filter
  filter.type = "peaking"; //Low pass filter
  filter.frequency.value = 440;
  filter.gain.value = 25;

  //Create the gain node
  gainNode = audioContext.createGain();

  //Set the current volume
  var volume = document.getElementById('volume').value;
  gainNode.gain.value = volume;

  //Set up the audio graph
  aSoundSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(analyser);
  analyser.connect(audioContext.destination);

  aSoundSource.start(0); // play the source now.
  aSoundSource.connect(gainNode); //Connect the source to the gain node

  //Set the playing flag
  playing = true;

  //Clear the spectrogram canvas
  var canvas = document.getElementById("canvas2");
  var context = canvas.getContext("2d");
  context.fillStyle = "rgb(255,255,255)";
  context.fillRect (0, 0, spectrogramCanvasWidth, spectrogramCanvasHeight);

  // Start visualizer.
  requestAnimFrame(drawVisualisation);
}
}

//====================== OSCILLATOR FILTERS==========================
// Play the sound.
function playSound2(buffer) {
	aSoundSource = audioContext.createBufferSource(); // creates a sound source.
	aSoundSource.buffer = buffer; // tell the source which sound to play.

	var tmpInput = document.getElementById("oscfilter").value;

	alert(tmpInput);

	 if(tmpInput == "sine") {
		 sine();
	 }

	 if(tmpInput == "square") {
		 square();
	 }

	 if(tmpInput == "sawtooth") {
		 sawtooth();
	 }

	 if(tmpInput == "triangle") {
		 triangle();
	 }

//================= SINE ==================
function sine() {
	//create oscillator
	oscillator = audioContext.createOscillator();

	oscillator.frequency.value = 440;
	oscillator.detune.value = 0;
	oscillator.type = "sine";

	gainNode = audioContext.createGain();

	//Set the current volume
	var volume = document.getElementById('volume2').value;
	gainNode.gain.value = volume;

	oscillator.connect(gainNode);
	gainNode.connect(analyser);
	gainNode.connect(audioContext.destination);

	oscillator.start(0);

	aSoundSource.connect(gainNode);

	//Set the playing flag
	playing = true;

	//Clear the spectrogram canvas
	var canvas = document.getElementById("canvas2");
	var context = canvas.getContext("2d");
	context.fillStyle = "rgb(255,255,255)";
	context.fillRect (0, 0, spectrogramCanvasWidth, spectrogramCanvasHeight);

    // Start visualizer.
    requestAnimationFrame(drawVisualisation);
}

//================ SQUARE ==================
function square() {
	//create oscillator
	oscillator = audioContext.createOscillator();

	oscillator.frequency.value = 440;
	oscillator.detune.value = 0;
	oscillator.type = "square";

	gainNode = audioContext.createGain();

	//Set the current volume
	var volume = document.getElementById('volume2').value;
	gainNode.gain.value = volume;

	oscillator.connect(gainNode);
	gainNode.connect(analyser);
	gainNode.connect(audioContext.destination);

	oscillator.start(0);

	aSoundSource.connect(gainNode); //Connect the source to the gain node

	//Set the playing flag
	playing = true;

	//Clear the spectrogram canvas
	var canvas = document.getElementById("canvas2");
	var context = canvas.getContext("2d");
	context.fillStyle = "rgb(255,255,255)";
	context.fillRect (0, 0, spectrogramCanvasWidth, spectrogramCanvasHeight);

	// Start visualizer.
    requestAnimationFrame(drawVisualisation);
}

//================== SAWTOOTH =====================
function sawtooth() {
	//create oscillator
	oscillator = audioContext.createOscillator();

	oscillator.frequency.value = 440;
	oscillator.detune.value = 0;
	oscillator.type = "sawtooth";

	gainNode = audioContext.createGain();

	//Set the current volume
	var volume = document.getElementById('volume2').value;
	gainNode.gain.value = volume;

	oscillator.connect(gainNode);
	gainNode.connect(analyser);
	gainNode.connect(audioContext.destination);

	oscillator.start(0);

	aSoundSource.connect(gainNode); //Connect the source to the gain node

	//Set the playing flag
	playing = true;

	//Clear the spectrogram canvas
	var canvas = document.getElementById("canvas2");
	var context = canvas.getContext("2d");
	context.fillStyle = "rgb(255,255,255)";
	context.fillRect (0, 0, spectrogramCanvasWidth, spectrogramCanvasHeight);

	// Start visualizer.
    requestAnimationFrame(drawVisualisation);
}

//================ TRIANGLE ===================
function triangle() {
	//create oscillator
	oscillator = audioContext.createOscillator();

	oscillator.frequency.value = 440;
	oscillator.detune.value = 0;
	oscillator.type = "triangle";

	gainNode = audioContext.createGain();

	//Set the current volume
	var volume = document.getElementById('volume2').value;
	gainNode.gain.value = volume;

	oscillator.connect(gainNode);
	gainNode.connect(analyser);
	gainNode.connect(audioContext.destination);

	oscillator.start(0);

	aSoundSource.connect(gainNode);

	//Set the playing flag
	playing = true;

	//Clear the spectrogram canvas
	var canvas = document.getElementById("canvas2");
	var context = canvas.getContext("2d");
	context.fillStyle = "rgb(255,255,255)";
	context.fillRect (0, 0, spectrogramCanvasWidth, spectrogramCanvasHeight);

	// Start visualizer.
    requestAnimationFrame(drawVisualisation);
	}
}

// Stop the sound. Will only stop the last sound if you press play more than once.
function stopSound() {
	if (aSoundSource) {
		aSoundSource.stop(0);

		//Set the playing flag
		playing = false;
		//The spectrogram draw x position
		//back to the start
		spectrogramLeftPos = 0;
	}
}

function stopSound2(){
	if (oscillator){
		oscillator.stop(0);

		//Set the playing flag
		playing = false;
		//The spectrogram draw x position
		//back to the start
		spectrogramLeftPos = 0;
	}
}

// Function to initalise the analyser.
function initAnalyser() {
//Creates an AnalyserNode
	analyser = audioContext.createAnalyser();
	/*A value from 0 - 1 where 0 represents no time averaging with the last analysis frame. The default value is 0.8 */
	analyser.smoothingTimeConstant = SMOOTHING;
	//The size of the FFT used for frequency-domain analysis. Must be a power of 2
	analyser.fftSize = FFT_SIZE;
}

// Draw the visualisation.
function drawVisualisation() {
//First, get the canvas
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext("2d");

	//Programmatically set the canvas width and height
	canvas.width = WIDTH;
	canvas.height = HEIGHT;

	//Fill the canvas with a default colour
	context.fillStyle = "rgb(255,255,255)";
	//The fillRect() method draws a "filled" rectangle
	context.fillRect (0, 0, WIDTH, HEIGHT);

	//Draw in the frequency domain
	drawFrequencyDomainVisualisation(context);

	//Draw in the time domain
	drawTimeDomainVisualisation(context);

	//Draw the spectrogram
	drawSpectrogramVisualisation();

	//Request the next frame if playing
	if (playing){
	requestAnimFrame(drawVisualisation);
	}
}

// Draw the time domain visualisation.
function drawTimeDomainVisualisation(context) {
/* Typed Array - Uint8Array, can contain only unsigned 8-bit integers. Have values between 0 and 255*/
	var timeDomain = new Uint8Array(analyser.frequencyBinCount);
	/*Copies the current time domain data for this sample/batch into the passed unsigned byte array*/
	analyser.getByteTimeDomainData(timeDomain);

	//Loop through each bucket / bin in the timeDomain array
	for (var i = 0; i < analyser.frequencyBinCount; i++){
		//Get the amplitude of the audio for this bucket
		var value = timeDomain[i];
		/*Determine the percentage for this value. Convert the amplitude value (0 - 255) into a percentage */
		var percent = value / 256;

		/* Next, convert the amplitude value (now in percent) into an x and y coordinates position within the canvas and draw a 1 x 1 rectangle */
		var height = HEIGHT * percent;
		var offset = HEIGHT - height - 1;
		var barWidth = WIDTH/analyser.frequencyBinCount;

		//Set the fill colour
		context.fillStyle = "black";
		//The fillRect() method draws a "filled" rectangle
		context.fillRect(i * barWidth, offset, 1, 1);
	}
}

// Draw the frequency domain visualisation.
function drawFrequencyDomainVisualisation(context) {
/* Typed Array - Uint8Array, can contain only Unsigned 8-bit integers. Have values between 0 and 255 */
	var freqDomain = new Uint8Array(analyser.frequencyBinCount);
	/* Copies the current time domain data for this sample / batch into the passed unsigned byte array */
	analyser.getByteFrequencyData(freqDomain);

	//Loop through each bucket / bin in the freqDomain array
	for (var i = 0; i < analyser.frequencyBinCount; i++){
		//Get the amplitude of the audio for this bucket
		var value = freqDomain[i];
		/*Determine the percentage for this value. Convert the amplitude value (0 - 255) into a percentage */
		var percent = value / 256;

	/* Next, convert the amplitude value (now in percent) into an x and y coordinates position within the canvas and draw a vertical bar based on the percentage height and bar width */
	var height = HEIGHT * percent;
	var offset = HEIGHT - height - 1;
	var barWidth = WIDTH/analyser.frequencyBinCount;

	/* HSL stands for hue, saturation and lightness. HSL colour value is specified with: hsl(hue, saturation and lightness) */
	var hue = i/analyser.frequencyBinCount * 360;
	context.fillStyle = "hsl(" + hue + ", 100%, 50%)";
	//The fillRect() method draws a "filled" rectangle
	context.fillRect(i * barWidth, offset, barWidth, height);
	}
}

//Draw the spectrogram
function drawSpectrogramVisualisation(){
	//First, get the canvas
	var canvas = document.getElementById("canvas2");
	var context = canvas.getContext("2d");

	//Store a temp copy of the canvas
	//Create a temp canvas we use fo copying
	var tempCanvas = document.createElement("canvas");
	tempCanvas.width = spectrogramCanvasWidth;
	tempCanvas.height = spectrogramCanvasHeight;
	var tempCtx = tempCanvas.getContext("2d");

	//Copy the current canvas into the temp canvas
	tempCtx.drawImage(canvas,0,0, spectrogramCanvasWidth, spectrogramCanvasHeight);

	/*Typed Array - Uint8Array, can contain only Unsigned 8-bit Integers. Have values between 0 and 255 */
	var freqDomain = new Uint8Array(analyser.frequencyBinCount);
	/* Copies the current time domain data for this sample/batch into the passed unsigned byte array */
	analyser.getByteFrequencyData(freqDomain);

	// Primitive Frequency Analysis. Variables used for analysis.
		// Stores the highest value.
		var highestValue = -1;
		// Stores highest value index.
		var highestValueIndex = -1;
		// Stores how many buckets this was seen.
		var highestValueLength = 1;

	//Draw the spectrogram
	if(spectrogramLeftPos == spectrogramCanvasWidth){
		//The canvas is full... so draw on the right side and move the canvas left
		for (var i = 0; i < analyser.frequencyBinCount; i++){
			var value = freqDomain[i];

			// Primitive Frequency Analysis.
				if (value > highestValue){
					highestValue = value;
					highestValueIndex = i;
					highestValueLength = 1;
				} else {
					if (value == highestValue){
						if( (highestValueIndex + highestValueLength) == i){
							highestValueLength++;
						}
					}
				}
			//End - Primitive Frequency Analysis.

			tempCtx.fillStyle = myColor.getColor(value).hex();
			tempCtx.fillRect(spectrogramCanvasWidth - 1,
											(spectrogramCanvasHeight - i), 1, 1);
	}

	context.translate(-1, 0);
	context.drawImage(tempCanvas,0,0, spectrogramCanvasWidth,
											 spectrogramCanvasHeight);
	context.setTransform(1, 0, 0, 1, 0, 0);
	} else {
		//The canvas is not full yet... so draw left to right
		for (var i = 0; i < analyser.frequencyBinCount; i++){
			var value = freqDomain[i];

			// Primitive Frequency Analysis
			if (value > highestValue){
				highestValue = value;
				highestValueIndex = i;
				highestValueLength = 1;
			} else {
				if (value == highestValue){
					if( (highestValueIndex + highestValueLength) == i){
						highestValueLength++;
					}
				}
			}
			// End - Primitive Frequency Analysis.

			tempCtx.fillStyle = myColor.getColor(value).hex();
			tempCtx.fillRect(spectrogramLeftPos,
											(spectrogramCanvasHeight - i), 1, 1);
		}

		context.drawImage(tempCanvas,0,0, spectrogramCanvasWidth,
											 spectrogramCanvasHeight);
		spectrogramLeftPos++;
		}

	// Output some infomation
	var highestValIdxStart = highestValueIndex;
	var highestValIdxEnd = highestValueIndex + (highestValueLength - 1);
	var tempIndex = Math.round( (highestValIdxStart + highestValIdxEnd) / 2);

	var tmpFreq = getValueToFrequency(tempIndex);
	var tmpIndex = getFrequencyToIndex(tmpFreq);
	document.getElementById("debugInfo").innerHTML="freqDomain.length: " + freqDomain.length +
									" / highestValue: " + highestValue +
									" / highestValueIndex: " + highestValueIndex +
									" / highestValueLength: " + highestValueLength +
									" |----| highestValueLength AS INDEX: " +
									(highestValueIndex + (highestValueLength - 1)) +
									" |----| tempIndex: " + tempIndex +
									" |----| getValueToFrequency: " + tmpFreq +
									" /getFrequencyToIndex: " + tmpIndex +"\n";
}

//Get the frequency of a value.
function getValueToFrequency(tmpValue) {
	// Get the Nyquist frequency, 1/2 of the sampling rate.
	var nyquistFrequency = audioContext.sampleRate / 2;
	// Map the index / bucket to a frequency.
	var freq = tmpValue * nyquistFrequency / analyser.frequencyBinCount;

	// Return the corresponding frequency.
	return freq;
}

// Get the index value of a frequency
function getFrequencyToIndex(freq) {
	// Get the Nyquist frequency, 1/2 of the smapling rate.
	var nyquistFrequency = audioContext.sampleRate / 2;
	// Map the frequency to the correct bucket.
	var index = Math.round(freq / nyquistFrequency * analyser.frequencyBinCount);

	// Return the correspoding bucket.
	return index;
}
